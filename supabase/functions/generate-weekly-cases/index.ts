
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";
import { jsonrepair } from 'https://esm.sh/jsonrepair@3.6.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CASE_COUNT = 1;
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

const normalizeSheetValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractJsonPayload = (content: string): string => {
  const trimmed = content.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
};

function extractText(data: unknown) {
  if (typeof (data as { output_text?: unknown })?.output_text === 'string') {
    return (data as { output_text: string }).output_text;
  }

  const output = (data as { output?: unknown })?.output;
  if (Array.isArray(output)) {
    for (const block of output) {
      if (typeof block === 'object' && block !== null) {
        const blockType = (block as { type?: string }).type;
        const content = (block as { content?: unknown })?.content;

        if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part === 'object' && part !== null) {
              const partType = (part as { type?: string }).type;

              if (partType === 'output_text' || partType === 'text') {
                const text = (part as { text?: unknown })?.text;
                if (typeof text === 'string' && text.trim().length > 0) {
                  return text;
                }
              }
            }
          }
        }

        if (blockType === 'output_text' && typeof (block as { text?: unknown }).text === 'string') {
          const direct = (block as { text: string }).text;
          if (direct.trim().length > 0) {
            return direct;
          }
        }
      }
    }
  }

  return null;
}

const sanitizeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const formatSummaryNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '');
};

const formatDividendYield = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, '');
  const simplePattern = /^-?\d+(?:[.,]\d+)?%?$/u;

  if (!simplePattern.test(compact)) {
    return trimmed;
  }

  const numeric = sanitizeNumber(trimmed);
  if (numeric === null || !Number.isFinite(numeric)) {
    return trimmed;
  }

  if (trimmed.includes('%')) {
    return `${formatSummaryNumber(numeric)}%`;
  }

  if (Math.abs(numeric) <= 1) {
    return `${formatSummaryNumber(numeric * 100)}%`;
  }

  return `${formatSummaryNumber(numeric)}%`;
};

const normalizeParagraphs = (value: string): string => {
  const normalized = value.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return '';
  }

  const initialParagraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  let paragraphs: string[] = [];

  if (initialParagraphs.length > 1) {
    paragraphs = initialParagraphs.map((paragraph) => paragraph.replace(/\s+/g, ' '));
  } else {
    const [singleBlock = normalized] = initialParagraphs.length === 1 ? initialParagraphs : [normalized];
    const lineSeparated = singleBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lineSeparated.length > 1) {
      paragraphs = lineSeparated.map((line) => line.replace(/\s+/g, ' '));
    } else {
      const sentences = singleBlock
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9])/u)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 0);

      if (sentences.length <= 1) {
        paragraphs = [singleBlock.replace(/\s+/g, ' ')];
      } else {
        const assembled: string[] = [];
        let current = '';

        for (const sentence of sentences) {
          if (!current) {
            current = sentence;
            continue;
          }

          const candidate = `${current} ${sentence}`;
          if (candidate.length <= 400) {
            current = candidate;
          } else {
            assembled.push(current);
            current = sentence;
          }
        }

        if (current) {
          assembled.push(current);
        }

        paragraphs = assembled;
      }
    }
  }

  return paragraphs.join('\n\n');
};

const sanitizeLongDescription = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeParagraphs(value);
  if (normalized.length < 180) {
    return null;
  }

  return normalized;
};

const sanitizeCurrency = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  if (trimmed.length < 3 || trimmed.length > 5) {
    return null;
  }

  return trimmed;
};

const fetchSheetTickers = async (): Promise<SheetTickerInfo[]> => {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parse(csvText, { skipFirstRow: false, columns: false }) as string[][];

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) =>
    typeof header === 'string' ? header.trim() : ''
  );
  const dataRows = rows.slice(1);

  const companyIdx = headers.findIndex((header) => /company/i.test(header));
  const simpleTickerIdx = headers.findIndex((header) => /simple\s*ticker/i.test(header));
  const tickerIdx = headers.findIndex((header) => /ticker/i.test(header) && !/simple/i.test(header));
  const currencyIdx = headers.findIndex((header) => /(currency|valuta)/i.test(header));
  const priceIdx = headers.findIndex((header) => /(price|senast|last)/i.test(header));
  const segmentIdx = headers.findIndex((header) =>
    /segment/i.test(header)
  );
  const peIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('p/e')
      || normalized.includes('pe-tal')
      || normalized.includes('pe ratio')
      || normalized.includes('p e');
  });
  const dividendIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('dividend')
      || normalized.includes('yield')
      || normalized.includes('utdelning')
      || normalized.includes('direktavkastning');
  });
  const marketCapIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('market cap')
      || normalized.includes('marketcapitalization')
      || normalized.includes('marketcapitalisation')
      || normalized.includes('börsvärde')
      || normalized.includes('borsvarde');
  });
  const week52HighIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('52')
      && (normalized.includes('högsta') || normalized.includes('hogsta') || normalized.includes('high'));
  });
  const week52LowIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('52')
      && (normalized.includes('lägsta') || normalized.includes('lagsta') || normalized.includes('low'));
  });

  if (tickerIdx === -1 && simpleTickerIdx === -1) {
    throw new Error('CSV saknar nödvändiga kolumner (Ticker eller Simple Ticker).');
  }

  const tickerMap = new Map<string, SheetTickerInfo>();

  for (const columns of dataRows) {
    const rawName = normalizeSheetValue(companyIdx !== -1 ? columns[companyIdx] : null);
    const rawSimpleSymbol = simpleTickerIdx !== -1 ? normalizeSheetValue(columns[simpleTickerIdx]) : null;
    const rawSymbol = tickerIdx !== -1 ? normalizeSheetValue(columns[tickerIdx]) : null;
    const rawCurrency = currencyIdx !== -1 ? normalizeSheetValue(columns[currencyIdx]) : null;
    const rawPrice = priceIdx !== -1 ? normalizeSheetValue(columns[priceIdx]) : null;
    const rawSegment = segmentIdx !== -1 ? normalizeSheetValue(columns[segmentIdx]) : null;
    const rawPeRatio = peIdx !== -1 ? normalizeSheetValue(columns[peIdx]) : null;
    const rawDividendYield = dividendIdx !== -1 ? normalizeSheetValue(columns[dividendIdx]) : null;
    const rawMarketCap = marketCapIdx !== -1 ? normalizeSheetValue(columns[marketCapIdx]) : null;
    const rawWeek52High = week52HighIdx !== -1 ? normalizeSheetValue(columns[week52HighIdx]) : null;
    const rawWeek52Low = week52LowIdx !== -1 ? normalizeSheetValue(columns[week52LowIdx]) : null;

    const selectedSymbol = rawSimpleSymbol ?? rawSymbol;
    if (!selectedSymbol) continue;

    const cleanedSymbol = selectedSymbol.includes(':')
      ? selectedSymbol.split(':').pop()!.toUpperCase()
      : selectedSymbol.toUpperCase();

    const parsedPrice = rawPrice
      ? Number(rawPrice.replace(/\s/g, '').replace(',', '.'))
      : null;

    const price = Number.isFinite(parsedPrice) ? Number(parsedPrice) : null;

    let peRatio: string | null = null;
    if (rawPeRatio) {
      const parsedPe = sanitizeNumber(rawPeRatio);
      if (parsedPe !== null) {
        peRatio = parsedPe.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '');
      } else {
        peRatio = rawPeRatio;
      }
    }

    const parsedWeekHigh = rawWeek52High ? sanitizeNumber(rawWeek52High) : null;
    const parsedWeekLow = rawWeek52Low ? sanitizeNumber(rawWeek52Low) : null;
    const weekHigh = parsedWeekHigh !== null ? Number(parsedWeekHigh.toFixed(2)) : null;
    const weekLow = parsedWeekLow !== null ? Number(parsedWeekLow.toFixed(2)) : null;

    tickerMap.set(cleanedSymbol, {
      symbol: cleanedSymbol,
      name: rawName ?? cleanedSymbol,
      currency: rawCurrency ?? null,
      price,
      segment: rawSegment ?? null,
      peRatio,
      marketCap: rawMarketCap ?? null,
      dividendYield: formatDividendYield(rawDividendYield),
      fiftyTwoWeekHigh: weekHigh,
      fiftyTwoWeekLow: weekLow,
    });
  }

  return Array.from(tickerMap.values());
};

const buildConciseDescription = (primary: string | null | undefined, fallback?: string | null): string => {
  const primaryValue = typeof primary === 'string' ? primary.trim() : '';
  const fallbackValue = typeof fallback === 'string' ? fallback.trim() : '';
  const candidateSource = primaryValue.length > 0 ? primaryValue : fallbackValue;
  const normalized = candidateSource.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9])/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  const pickIntroSentence = (): string => {
    if (sentences.length > 0) {
      return sentences[0];
    }

    return normalized;
  };

  const shortenSentence = (sentence: string): string => {
    const cleanSentence = sentence.replace(/\s+/g, ' ').trim();
    if (!cleanSentence) {
      return '';
    }

    const MAX_WORDS = 22;
    const MAX_LENGTH = 140;

    const words = cleanSentence.split(/\s+/u);
    let truncated = cleanSentence;
    let wasTrimmed = false;

    if (words.length > MAX_WORDS) {
      truncated = words.slice(0, MAX_WORDS).join(' ');
      wasTrimmed = true;
    }

    if (truncated.length > MAX_LENGTH) {
      truncated = truncated.slice(0, MAX_LENGTH - 3).trimEnd();
      wasTrimmed = true;
    }

    let result = truncated.replace(/[-,:;]+$/u, '').replace(/\s+/g, ' ').trim();
    const hadTerminalPunctuation = /[.!?]+$/u.test(result);
    if (hadTerminalPunctuation) {
      result = result.replace(/[.!?]+$/u, '').trim();
    }

    if (!result) {
      return '';
    }

    if (wasTrimmed) {
      return `${result}...`;
    }

    return result;
  };

  const intro = shortenSentence(pickIntroSentence());

  if (intro) {
    return intro;
  }

  return shortenSentence(normalized);
};

const buildAiIntro = (
  longAnalysis: string | null | undefined,
  fallback?: string | null,
): string | null => {
  const primaryValue = typeof longAnalysis === 'string' ? longAnalysis.trim() : '';
  const fallbackValue = typeof fallback === 'string' ? fallback.trim() : '';
  const candidate = primaryValue.length > 0 ? primaryValue : fallbackValue;

  if (!candidate) {
    return null;
  }

  const normalizedParagraphs = normalizeParagraphs(candidate);
  if (!normalizedParagraphs) {
    return null;
  }

  const flattened = normalizedParagraphs.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!flattened) {
    return null;
  }

  const sentences = flattened
    .split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9])/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  if (sentences.length === 0) {
    return null;
  }

  const MAX_SENTENCES = 3;
  const MIN_SENTENCES = 2;
  const MAX_LENGTH = 600;

  const assembled: string[] = [];

  for (const sentence of sentences) {
    if (assembled.length >= MAX_SENTENCES) {
      break;
    }

    assembled.push(sentence);

    const currentText = assembled.join(' ');
    if (currentText.length >= MAX_LENGTH) {
      assembled[assembled.length - 1] = sentence.replace(/[.!?]+$/u, '').trim();
      break;
    }

    if (assembled.length >= MIN_SENTENCES && currentText.length >= 280) {
      break;
    }
  }

  if (assembled.length === 0) {
    return null;
  }

  return assembled.join(' ').replace(/\s+/g, ' ').trim();
};

const sanitizeCaseData = (rawCase: any) => {
  const logRejection = (reason: string, context?: Record<string, unknown>) => {
    console.log('sanitizeCaseData rejection:', reason, context ?? {});
  };

  if (!rawCase || typeof rawCase !== 'object') {
    logRejection('rawCase is not an object');
    return null;
  }

  const rawTitle = typeof rawCase.title === 'string' ? rawCase.title.trim() : '';
  const companyName = typeof rawCase.company_name === 'string' ? rawCase.company_name.trim() : '';
  const descriptionRaw = typeof rawCase.description === 'string' ? rawCase.description.trim() : '';
  let longDescription = sanitizeLongDescription(
    rawCase.analysis ?? rawCase.long_description ?? rawCase.description,
  );

  const lowerCompany = companyName.toLowerCase();
  const lowerDescription = descriptionRaw.toLowerCase();
  const forbiddenTerms = ['fiktiv', 'fiktivt', 'påhitt', 'låtsas', 'fictional'];

  if ((!rawTitle || rawTitle.length === 0) && (!companyName || companyName.length === 0)) {
    logRejection('missing title and company_name');
    return null;
  }

  if (!descriptionRaw) {
    logRejection('missing description');
    return null;
  }

  if (forbiddenTerms.some((term) => lowerCompany.includes(term) || lowerDescription.includes(term))) {
    logRejection('forbidden terms detected', { companyName, descriptionRaw });
    return null;
  }

  if (!longDescription) {
    // GPT-5.1 can produce more concise summaries; allow a fallback to avoid over-filtering
    longDescription = descriptionRaw || rawCase.long_description || '';
  }

  if (!longDescription || longDescription.length < 50) {
    logRejection('long_description too short', { longDescriptionLength: longDescription.length });
    return null;
  }

  const stripInvestmentAnalysisPrefix = (value: string): string => {
    let result = value.trim();

    const patterns = [
      /^investeringsanalys\s+(?:för|av)\s+/i,
      /^investeringsanalys\s*:\s*/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(result)) {
        result = result.replace(pattern, '').trim();
      }
    }

    return result;
  };

  const cleanedTitle = rawTitle ? stripInvestmentAnalysisPrefix(rawTitle) : '';
  const resolvedTitle = cleanedTitle || rawTitle || companyName;

  const shortDescription = buildConciseDescription(descriptionRaw, longDescription);
  const aiIntro = buildAiIntro(longDescription, descriptionRaw);

  const sector = typeof rawCase.sector === 'string' ? rawCase.sector.trim() : null;
  const marketCap = rawCase.market_cap ? String(rawCase.market_cap).trim() : null;
  const peRatio = rawCase.pe_ratio ? String(rawCase.pe_ratio).trim() : null;
  const dividendYield = rawCase.dividend_yield ? String(rawCase.dividend_yield).trim() : null;

  return {
    title: resolvedTitle,
    company_name: companyName,
    description: shortDescription,
    long_description: longDescription,
    ai_intro: aiIntro,
    sector,
    market_cap: marketCap,
    pe_ratio: peRatio,
    dividend_yield: dividendYield,
    ticker: null,
    image_url: null,
    currency: sanitizeCurrency(rawCase.currency),
  };
};

type SheetTickerInfo = {
  symbol: string;
  price: number | null;
  currency: string | null;
  segment?: string | null;
  name?: string | null;
  peRatio?: string | null;
  marketCap?: string | null;
  dividendYield?: string | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
};

type ClearbitSuggestion = {
  name?: string;
  domain?: string;
  logo?: string;
  ticker?: string;
};

const buildGoogleFaviconUrl = (domain: string): string | null => {
  if (!domain) {
    return null;
  }

  const trimmed = domain.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^https?:\/\//iu, '')
    .replace(/\/.*$/u, '')
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const encodedDomain = encodeURIComponent(`https://${normalized}`);
  return `https://www.google.com/s2/favicons?sz=256&domain_url=${encodedDomain}`;
};

const appendSizeParam = (url: string, size: number = 512): string => {
  if (!url || !url.startsWith('http')) {
    return url;
  }

  if (/[?&]size=\d+/iu.test(url)) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}size=${size}`;
};

const logoCache = new Map<string, string | null>();

const fetchCompanyLogo = async (
  companyName: string,
  ticker: string | null,
): Promise<string | null> => {
  const cacheKey = `${companyName?.toLowerCase() ?? ''}|${ticker ?? ''}`;
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey) ?? null;
  }

  const queries = Array.from(
    new Set(
      [companyName, ticker ? `${companyName} ${ticker}` : null, ticker]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0),
    ),
  );

  const normalizedTicker = ticker ? normalizeTickerKey(ticker) : null;

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        continue;
      }

      const suggestions = await response.json();
      if (!Array.isArray(suggestions)) {
        continue;
      }

      const typedSuggestions = suggestions as ClearbitSuggestion[];
      const preferredMatch = typedSuggestions.find((suggestion) => {
        if (!suggestion) return false;
        if (normalizedTicker && typeof suggestion.ticker === 'string') {
          try {
            return normalizeTickerKey(suggestion.ticker) === normalizedTicker;
          } catch (_error) {
            return false;
          }
        }
        return false;
      });

      const fallbackMatch = typedSuggestions.find((suggestion) =>
        suggestion
        && typeof suggestion.name === 'string'
        && suggestion.name.toLowerCase().includes(companyName.toLowerCase())
      );

      const match = preferredMatch ?? fallbackMatch ?? typedSuggestions[0];
      if (!match) {
        continue;
      }

      const domain = typeof match.domain === 'string' ? match.domain.trim() : '';
      const googleLogo = domain ? buildGoogleFaviconUrl(domain) : null;
      const clearbitLogo = typeof match.logo === 'string' ? match.logo.trim() : '';

      if (googleLogo) {
        logoCache.set(cacheKey, googleLogo);
        return googleLogo;
      }

      if (clearbitLogo) {
        const sizedLogo = appendSizeParam(clearbitLogo, 512);
        logoCache.set(cacheKey, sizedLogo);
        return sizedLogo;
      }
    } catch (error) {
      console.warn('Failed to fetch logo from Clearbit suggestions', { query, error });
    }
  }

  logoCache.set(cacheKey, null);
  return null;
};

const normalizeTickerKey = (value: string): string => {
  const trimmed = value.trim().toUpperCase();
  const withoutPrefix = trimmed.includes(':') ? trimmed.split(':').pop() ?? trimmed : trimmed;
  return withoutPrefix;
};

const buildSheetTickerIndex = (tickers: SheetTickerInfo[] = []): Map<string, SheetTickerInfo> => {
  const index = new Map<string, SheetTickerInfo>();

  tickers.forEach((ticker) => {
    if (!ticker || typeof ticker.symbol !== 'string') {
      return;
    }

    const baseSymbol = normalizeTickerKey(ticker.symbol);
    const variants = new Set<string>();
    variants.add(baseSymbol);
    variants.add(baseSymbol.replace('-', ''));

    if (baseSymbol.includes('.')) {
      const [root] = baseSymbol.split('.');
      if (root) {
        variants.add(root);
        variants.add(root.replace('-', ''));
      }
    }

    variants.forEach((variant) => {
      if (variant) {
        index.set(variant, ticker);
      }
    });
  });

  return index;
};

const findSheetTickerInfo = (
  ticker: string,
  index: Map<string, SheetTickerInfo>,
): SheetTickerInfo | null => {
  if (!ticker) {
    return null;
  }

  const candidates = new Set<string>();
  const normalized = normalizeTickerKey(ticker);
  candidates.add(normalized);
  candidates.add(normalized.replace('-', ''));

  if (normalized.includes('.')) {
    const [root, suffix] = normalized.split('.');
    if (root) {
      candidates.add(root);
      candidates.add(root.replace('-', ''));
      if (suffix) {
        candidates.add(`${root}-${suffix}`);
      }
    }
  }

  for (const candidate of candidates) {
    if (candidate && index.has(candidate)) {
      return index.get(candidate) ?? null;
    }
  }

  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let supabaseClient: ReturnType<typeof createClient> | null = null;

  try {
    console.log('Starting AI weekly cases generation...');

    if (!openAIApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);

    let requestBody: Record<string, unknown> = {};
    try {
      requestBody = await req.json();
    } catch (_error) {
      requestBody = {};
    }

    const triggeredBy = typeof requestBody.triggered_by === 'string'
      ? requestBody.triggered_by
      : requestBody.scheduled === true
        ? 'scheduled'
        : 'manual';

    runId = crypto.randomUUID();

    const { error: runInsertError } = await supabaseClient
      .from('ai_generation_runs')
      .insert({
        id: runId,
        status: 'running',
        expected_count: CASE_COUNT,
        triggered_by: triggeredBy,
      });

    if (runInsertError) {
      console.error('Failed to create AI generation run record:', runInsertError);
      throw new Error('Failed to create AI generation run record');
    }

    const investmentStyles = ['Growth', 'Value', 'Dividend'];

    const { data: existingCaseRows, error: existingCasesError } = await supabaseClient
      .from('stock_cases')
      .select('title, company_name, ticker')
      .eq('ai_generated', true);

    if (existingCasesError) {
      console.error('Failed to fetch existing AI generated cases:', existingCasesError);
      throw new Error('Kunde inte läsa befintliga AI-case');
    }

    const existingCases = new Set<string>();
    const existingTickers = new Set<string>();
    (existingCaseRows || []).forEach((caseItem) => {
      if (caseItem.title && caseItem.company_name) {
        existingCases.add(`${caseItem.title.toLowerCase()}|${caseItem.company_name.toLowerCase()}`);
      }

      if (caseItem.ticker) {
        const normalizedTicker = normalizeTickerKey(caseItem.ticker);
        if (normalizedTicker) {
          existingTickers.add(normalizedTicker);
        }
      }
    });

    const warnings: string[] = [];

    let sheetTickerIndex = new Map<string, SheetTickerInfo>();
    let sheetTickerList: SheetTickerInfo[] = [];
    try {
      sheetTickerList = await fetchSheetTickers();
      sheetTickerIndex = buildSheetTickerIndex(sheetTickerList);

      if (sheetTickerIndex.size === 0) {
        warnings.push('Google Sheet returnerade inga tickers');
      }
    } catch (tickerFetchError) {
      console.error('Error fetching sheet tickers directly:', tickerFetchError);
      warnings.push('Fel vid hämtning av prisdata för aktier');
    }

    if (sheetTickerIndex.size === 0 || sheetTickerList.length === 0) {
      throw new Error('Inga tickers kunde hämtas från Google Sheet');
    }

    const eligibleTickers = sheetTickerList.filter((ticker) => {
      if (!ticker || typeof ticker.symbol !== 'string') {
        return false;
      }

      const normalizedSymbol = normalizeTickerKey(ticker.symbol);
      if (!normalizedSymbol) {
        return false;
      }

      const priceIsValid = typeof ticker.price === 'number' && Number.isFinite(ticker.price);

      return priceIsValid;
    });

    if (eligibleTickers.length === 0) {
      throw new Error('Google Sheet saknar prisdata för alla tickers');
    }

    const generatedCases: any[] = [];
    const generatedTickers: { title: string; ticker: string }[] = [];
    const usedTickerSymbols = new Set<string>();

    for (let i = 0; i < CASE_COUNT; i++) {
      const availableTickers = eligibleTickers.filter((ticker) => {
        const normalizedSymbol = normalizeTickerKey(ticker.symbol);

        if (usedTickerSymbols.has(normalizedSymbol)) {
          return false;
        }

        return true;
      });

      if (availableTickers.length === 0) {
        warnings.push('Inga fler unika tickers tillgängliga från sheetet');
        break;
      }

      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];

      // Sortera tickers efter Market Cap (störst först)
      const sortedTickers = Array.from(
        new Map(
          eligibleTickers
            .map((t) => {
              const mc = t.marketCap ? Number(String(t.marketCap).replace(/[^0-9]/g, '')) : 0;
              return { ...t, marketCapValue: mc };
            })
            // Sortera högst till lägst Market Cap
            .sort((a, b) => b.marketCapValue - a.marketCapValue)
            // Filtrera bort dubbletter baserat på företagsnamn (t.ex. Investor A/B)
            .filter((t, idx, self) => {
              if (!t.name) return true;
              const baseName = t.name.split(' ')[0];
              return self.findIndex(x => x.name?.split(' ')[0] === baseName) === idx;
            })
            // Lägg i Map för att ta bort identiska symboler
            .map((t) => [t.symbol, t])
        ).values()
      );

      // Begränsa till topp 50 största bolagen
      const topTickers = sortedTickers.slice(0, 50);

      // Välj nästa ticker i listan (eller fallback till första om listan tar slut)
      const selectedTickerInfo = topTickers[Math.floor(Math.random() * topTickers.length)];
      const sector = selectedTickerInfo.segment?.trim() || "Unknown";

      // Hämta metadata för valt bolag
      const selectedTicker = normalizeTickerKey(selectedTickerInfo.symbol);
      const selectedName = selectedTickerInfo.name?.trim() || selectedTicker;
      const sheetPrice =
        typeof selectedTickerInfo.price === 'number' && Number.isFinite(selectedTickerInfo.price)
          ? Number(selectedTickerInfo.price.toFixed(2))
          : null;
      const sheetCurrency =
        typeof selectedTickerInfo.currency === 'string' && selectedTickerInfo.currency.trim().length > 0
          ? selectedTickerInfo.currency.trim().toUpperCase()
          : null;

      // Markera tickern som använd
      usedTickerSymbols.add(selectedTicker);


      const prompt = `
Du är en senior aktieanalytiker som skriver extremt koncisa, faktabaserade och moderna investeringscase för retail-investerare. 
Skriv alltid med en snabb, vass och tydlig ton – inga långa meningar, inget bankjargong och ingen hype.

Bolag: ${selectedName} (${selectedTicker})
Sektor: ${sector}
Investeringsstil: ${style}
Senaste pris: ${sheetPrice !== null ? `${sheetPrice} ${sheetCurrency ?? 'SEK'}` : "okänt – använd rimligt intervall"}

Krav:
- Endast verkliga fakta. Inga påhitt.
- Kort, konkret, lättläst språk.
- Totalt 90–130 ord.
- 4 stycken, separerade med en blankrad.
- Inga listor eller punkter i själva caset.
- Inga kursmål, ingen teknisk analys, inga generiska buzzwords.

Stycke 1 (Snapshot):
Beskriv kort vad bolaget gör och varför det är relevant just nu.

Stycke 2 (Edge):
Förklara vad som driver bolaget, dess konkurrensfördel, produkt eller strategi. En tydlig styrka.

Stycke 3 (Katalysatorer):
Två till tre verkliga drivkrafter kommande 6–18 månader. Sätt priset i kontext (t.ex. värdering, nivå mot historik, eller fundamenta).

Stycke 4 (Risk + stilslutsats):
En eller två realistiska risker. Avsluta med en kort slutsats kopplad till stilen "${style}".

Returnera ENDAST giltig JSON:

{
  "title": "string",
  "company_name": "string",
  "description": "string",
  "long_description": "string",
  "sector": "string",
  "market_cap": "string",
  "pe_ratio": "string",
  "dividend_yield": "string"
}
`;

      console.log(`Generating case ${i + 1} for ${sector} - ${style}...`);

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.1',
          max_output_tokens: 1600,
          reasoning: { effort: 'low' },
          text: { verbosity: 'medium' },
          input: [
            {
              role: 'system',
              content:
                'Du är en erfaren finansanalytiker som skriver analytiska investeringscase. Svara ENDAST med giltig JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        let responseText: string | null = null;
        try {
          responseText = await response.text();
        } catch (err) {
          console.error('Failed to read OpenAI error body', err);
        }

        const message = `OpenAI API error: ${response.status}`;
        console.error(message, { responseText });
        warnings.push(message);
        continue;
      }

      const data = await response.json();
      const rawText = extractText(data);

      console.log('OpenAI weekly case response content', {
        ticker: selectedTicker,
        sector,
        style,
        content: rawText,
      });

      if (!rawText) {
        const message = 'OpenAI response did not contain content';
        console.error(message, data);
        warnings.push(message);
        continue;
      }

      try {
        const normalizedContent = extractJsonPayload(rawText);
        console.log('Normalized OpenAI content length', normalizedContent.length);
        let caseData: unknown;

        try {
          caseData = JSON.parse(normalizedContent);
        } catch {
          try {
            const repairedContent = jsonrepair(normalizedContent);
            console.log('Repaired JSON content length', repairedContent.length);
            caseData = JSON.parse(repairedContent);
          } catch (err) {
            console.error('JSON parse failure', {
              normalizedPreview: normalizedContent.slice(0, 500),
              normalizedLength: normalizedContent.length,
            });
            continue;
          }
        }
        const sanitized = sanitizeCaseData(caseData);

        if (!sanitized) {
          const message = 'Generated case missing required fields';
          console.error(message, caseData);
          warnings.push(message);
          continue;
        }

        const caseKey = `${sanitized.title.toLowerCase()}|${sanitized.company_name.toLowerCase()}`;
        const expectedTicker = normalizeTickerKey(selectedTicker);
        if (
          existingCases.has(caseKey)
          || (expectedTicker && existingTickers.has(expectedTicker))
        ) {
          const message = `Duplicate case skipped for ${sanitized.title}`;
          console.warn(message);
          warnings.push(message);
          continue;
        }

        const { ticker: _ignoredTicker, currency: sanitizedCurrency, ...caseWithoutTicker } = sanitized;

        const sheetInfo = findSheetTickerInfo(expectedTicker, sheetTickerIndex);
        let currency = sanitizedCurrency;
        let entryPrice: number | null = null;
        let currentPrice: number | null = null;
        let targetPrice: number | null = null;
        let stopLoss: number | null = null;
        let peRatioValue: string | null = null;
        let marketCapValue: string | null = null;
        let dividendYieldValue: string | null = null;
        let fiftyTwoWeekHigh: number | null = null;
        let fiftyTwoWeekLow: number | null = null;
        let finalLongDescription = caseWithoutTicker.long_description;
        if (typeof finalLongDescription !== 'string') {
          finalLongDescription = '';
        }

        if (sheetInfo) {
          const price = typeof sheetInfo.price === 'number' && Number.isFinite(sheetInfo.price)
            ? Number(sheetInfo.price)
            : null;
          if (price !== null) {
            const rounded = Number(price.toFixed(2));
            entryPrice = rounded;
            currentPrice = rounded;
            targetPrice = Number((rounded * 1.08).toFixed(2));
            stopLoss = Number((rounded * 0.92).toFixed(2));
          }

          if (sheetInfo.currency && typeof sheetInfo.currency === 'string') {
            const resolvedCurrency = sheetInfo.currency.trim().toUpperCase();
            if (resolvedCurrency.length >= 3 && resolvedCurrency.length <= 5) {
              currency = resolvedCurrency;
            }
          }

          peRatioValue = sheetInfo.peRatio ?? null;
          marketCapValue = sheetInfo.marketCap ?? null;
          dividendYieldValue = sheetInfo.dividendYield ?? null;

          if (typeof sheetInfo.fiftyTwoWeekHigh === 'number' && Number.isFinite(sheetInfo.fiftyTwoWeekHigh)) {
            fiftyTwoWeekHigh = Number(sheetInfo.fiftyTwoWeekHigh);
          }

          if (typeof sheetInfo.fiftyTwoWeekLow === 'number' && Number.isFinite(sheetInfo.fiftyTwoWeekLow)) {
            fiftyTwoWeekLow = Number(sheetInfo.fiftyTwoWeekLow);
          }
        } else {
          warnings.push(`Prisdata saknas för ${expectedTicker}`);
        }

        if (typeof peRatioValue === 'string') {
          peRatioValue = peRatioValue.trim();
          if (peRatioValue.length === 0) {
            peRatioValue = null;
          }
        }

        const metricsSummary: string[] = [];
        if (fiftyTwoWeekHigh !== null) {
          metricsSummary.push(`52-veckors högsta: ${formatSummaryNumber(fiftyTwoWeekHigh)}`);
        }
        if (fiftyTwoWeekLow !== null) {
          metricsSummary.push(`52-veckors lägsta: ${formatSummaryNumber(fiftyTwoWeekLow)}`);
        }

        if (metricsSummary.length > 0 && typeof finalLongDescription === 'string') {
          const normalizedLongDescription = finalLongDescription.replace(/\n{3,}/g, '\n\n').trim();
          const segments = [normalizedLongDescription, metricsSummary.join(' | ')].filter((segment) => segment.length > 0);
          finalLongDescription = segments.join('\n\n');
        }

        const resolvedCurrency = currency ?? 'SEK';

        const resolvedLogoUrl = await fetchCompanyLogo(
          caseWithoutTicker.company_name || selectedName,
          expectedTicker,
        );

        generatedCases.push({
          ...caseWithoutTicker,
          long_description: finalLongDescription,
          ai_intro: caseWithoutTicker.ai_intro ?? null,
          ticker: expectedTicker,
          ai_generated: true,
          is_public: true,
          status: 'active',
          ai_batch_id: runId,
          generated_at: new Date().toISOString(),
          currency: resolvedCurrency,
          image_url: resolvedLogoUrl ?? caseWithoutTicker.image_url ?? null,
          entry_price: entryPrice,
          current_price: currentPrice,
          target_price: targetPrice,
          stop_loss: stopLoss,
          market_cap: marketCapValue,
          dividend_yield: dividendYieldValue,
          pe_ratio: peRatioValue,
        });

        console.log(`Successfully generated case: ${sanitized.title} (${expectedTicker})`);
        existingCases.add(caseKey);
        existingTickers.add(expectedTicker);
        generatedTickers.push({ title: sanitized.title, ticker: expectedTicker });

      } catch (parseError) {
        const message = 'Error parsing generated case JSON';
        console.error(message, parseError);
        console.error('Generated content:', rawText);
        warnings.push(message);
      }
    }

    if (generatedCases.length === 0) {
      const warningMessage = warnings.length > 0 ? warnings.join(' | ') : 'No cases were successfully generated';
      console.log('No cases persisted; warnings summary', warnings);
      await supabaseClient
        .from('ai_generation_runs')
        .update({
          status: 'failed',
          generated_count: 0,
          error_message: warningMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);

      throw new Error('No cases were successfully generated');
    }

    const { data: insertedCases, error: insertError } = await supabaseClient
      .from('stock_cases')
      .insert(generatedCases)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    const completionPayload = {
      status: 'completed',
      generated_count: insertedCases?.length ?? 0,
      error_message: warnings.length > 0 ? warnings.join(' | ') : null,
      completed_at: new Date().toISOString(),
    };

    await supabaseClient
      .from('ai_generation_runs')
      .update(completionPayload)
      .eq('id', runId);

    console.log(`Successfully inserted ${insertedCases.length} AI-generated cases`);

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      generated_cases: insertedCases.length,
      warnings,
      cases: insertedCases,
      tickers: generatedTickers,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-weekly-cases function:', error);

    if (runId && supabaseClient) {
      await supabaseClient
        .from('ai_generation_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
