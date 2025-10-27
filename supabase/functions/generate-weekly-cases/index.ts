
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

const CASE_COUNT = 3;
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
  const peIdx = headers.findIndex((header) => {
    const normalized = header.toLowerCase();
    return normalized.includes('p/e')
      || normalized.includes('pe-tal')
      || normalized.includes('pe ratio')
      || normalized.includes('p e');
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
    const rawPeRatio = peIdx !== -1 ? normalizeSheetValue(columns[peIdx]) : null;
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
      peRatio,
      fiftyTwoWeekHigh: weekHigh,
      fiftyTwoWeekLow: weekLow,
    });
  }

  return Array.from(tickerMap.values());
};

const sanitizeCaseData = (rawCase: any) => {
  if (!rawCase || typeof rawCase !== 'object') {
    return null;
  }

  const rawTitle = typeof rawCase.title === 'string' ? rawCase.title.trim() : '';
  const companyName = typeof rawCase.company_name === 'string' ? rawCase.company_name.trim() : '';
  const descriptionRaw = typeof rawCase.description === 'string' ? rawCase.description.trim() : '';
  const longDescription = sanitizeLongDescription(
    rawCase.analysis ?? rawCase.long_description ?? rawCase.investment_thesis,
  );

  const lowerCompany = companyName.toLowerCase();
  const lowerDescription = descriptionRaw.toLowerCase();
  const forbiddenTerms = ['fiktiv', 'fiktivt', 'påhitt', 'låtsas', 'fictional'];

  if ((!rawTitle || rawTitle.length === 0) && (!companyName || companyName.length === 0)) {
    return null;
  }

  if (!descriptionRaw) {
    return null;
  }

  if (forbiddenTerms.some((term) => lowerCompany.includes(term) || lowerDescription.includes(term))) {
    return null;
  }

  if (!longDescription) {
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

  const description = descriptionRaw.replace(/\s+/g, ' ');
  const shortDescription = description.length > 280 ? `${description.slice(0, 277).trimEnd()}...` : description;

  const sector = typeof rawCase.sector === 'string' ? rawCase.sector.trim() : null;
  const marketCap = rawCase.market_cap ? String(rawCase.market_cap).trim() : null;
  const peRatio = rawCase.pe_ratio ? String(rawCase.pe_ratio).trim() : null;
  const dividendYield = rawCase.dividend_yield ? String(rawCase.dividend_yield).trim() : null;

  return {
    title: resolvedTitle,
    company_name: companyName,
    description: shortDescription,
    long_description: longDescription,
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
  name?: string | null;
  peRatio?: string | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
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

    const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods', 'Real Estate'];
    const investmentStyles = ['Growth', 'Value', 'Dividend', 'ESG'];

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

      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];

      const selectedTickerInfo = availableTickers[Math.floor(Math.random() * availableTickers.length)];
      const selectedTicker = normalizeTickerKey(selectedTickerInfo.symbol);
      const selectedName = selectedTickerInfo.name?.trim() || selectedTicker;
      const sheetPrice = typeof selectedTickerInfo.price === 'number' && Number.isFinite(selectedTickerInfo.price)
        ? Number(selectedTickerInfo.price.toFixed(2))
        : null;
      const sheetCurrency = typeof selectedTickerInfo.currency === 'string' && selectedTickerInfo.currency.trim().length > 0
        ? selectedTickerInfo.currency.trim().toUpperCase()
        : null;

      usedTickerSymbols.add(selectedTicker);

      const prompt = `
Du är en professionell finansanalytiker som skriver inspirerande men faktabaserade aktiepitchar för svenska investerare.

🎯 Uppdrag:
Skapa ett välformulerat investeringscase för ett bolag inom sektorn "${sector}" med inriktning på "${style}"-strategier.

📊 Fakta att utgå från:
- Bolag: ${selectedName} (${selectedTicker})
- Nuvarande pris (från Google Sheet): ${sheetPrice !== null ? `${sheetPrice} ${sheetCurrency ?? 'SEK'}` : 'okänt, använd ett rimligt värde baserat på börsdata'}
- Analysen ska gälla verkliga, börsnoterade bolag. Kontrollera att bolaget existerar och är listat på en erkänd börs.

💰 Prisreferens:
Om prisdata finns (${sheetPrice ? "ja" : "nej"}), inkludera **en kort mening** som sätter priset i kontext – t.ex. om aktien handlas på en attraktiv nivå, nära årshögsta, eller i linje med sektorkollegor.
Undvik teknisk analys eller exakta kursmål – håll kommentaren kort, som ett led i helhetsanalysen.

🧠 Stil och ton:
- Skriv på svenska.
- Professionell, engagerande och lättillgänglig ton — som en erfaren analytiker som vill väcka intresse snarare än överösa med siffror.
- Undvik jargong, men använd relevanta finansiella begrepp där det stärker trovärdigheten.
- Fokusera på bolagets affärslogik, tillväxtmöjligheter och branschkontext — inte exakta handelsnivåer.

📈 Innehållskrav:
1. Förklara varför bolaget är intressant för investerare med fokus på "${style}"-strategin.
2. Lyft fram både kvantitativa och kvalitativa faktorer som stärker caset.
3. Beskriv 2–3 tydliga tillväxtdrivare, trender eller händelser som kan påverka aktien positivt.
4. Inkludera en kort reflektion kring nuvarande prisnivå om sådan data finns.
5. Undvik att ange målpris, stop-loss eller tekniska nivåer — fokusera på värdedrivande faktorer och berättelsen.

🧩 Analysdel – krav på innehåll och struktur:
Skriv en analytisk aktiepitch i tre till fem korta stycken (separerade med tomma rader) som flyter naturligt att läsa.

Analysen ska:
- Börja med en slagkraftig introduktion som förklarar varför bolaget är intressant just nu.
- Följa upp med bolagets kärnverksamhet, styrkor och marknadsposition.
- Lyft fram aktuella drivkrafter, trender eller marknadsförhållanden som påverkar bolaget – till exempel förändringar i efterfrågan, teknikutveckling, konkurrens, reglering eller makroekonomi 
- Välj de faktorer som är mest relevanta för just detta bolag och sektor, utan att fokusera på någon specifik investeringsstil eller tema i onödan 
- Nämn kort en eller två risker eller utmaningar på ett balanserat sätt.
- Om prisdata finns, väv in en naturlig mening om aktiens värdering eller prisnivå.
- Avsluta med ett sammanfattande stycke som beskriver varför aktien är attraktiv för investerare med "${style}"-inriktning.

💬 Exempel på ton:
"Med sin ledande position inom hållbar logistik och ett växande europeiskt nätverk står bolaget väl rustat för att dra nytta av den gröna omställningen. Den stabila lönsamheten och starka balansräkningen ger trygghet, samtidigt som bolaget erbjuder strukturell tillväxt inom ett område med politiskt stöd. Aktien handlas kring 142 SEK, vilket är en rimlig värdering sett till bolagets långsiktiga potential."

📦 Outputformat:
Returnera **endast** giltig JSON (utan markdown, kommentarer eller extra text):

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du är en erfaren finansanalytiker som skapar investeringsanalyser för svenska investerare. Svara alltid med giltigt JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const message = `OpenAI API error: ${response.status}`;
        console.error(message);
        warnings.push(message);
        continue;
      }

      const data = await response.json();
      const generatedContent = data?.choices?.[0]?.message?.content;

      if (!generatedContent) {
        const message = 'OpenAI response did not contain content';
        console.error(message, data);
        warnings.push(message);
        continue;
      }

      try {
        const normalizedContent = extractJsonPayload(generatedContent);
        let caseData: unknown;

        try {
          caseData = JSON.parse(normalizedContent);
        } catch (initialParseError) {
          try {
            const repairedContent = jsonrepair(normalizedContent);
            caseData = JSON.parse(repairedContent);
          } catch (_) {
            throw initialParseError;
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
        let peRatioValue: string | null = caseWithoutTicker.pe_ratio ?? null;
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

          if (sheetInfo.peRatio) {
            peRatioValue = sheetInfo.peRatio;
          }

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

        generatedCases.push({
          ...caseWithoutTicker,
          long_description: finalLongDescription,
          ticker: expectedTicker,
          ai_generated: true,
          is_public: true,
          status: 'active',
          ai_batch_id: runId,
          generated_at: new Date().toISOString(),
          currency: resolvedCurrency,
          entry_price: entryPrice,
          current_price: currentPrice,
          target_price: targetPrice,
          stop_loss: stopLoss,
          pe_ratio: peRatioValue,
        });

        console.log(`Successfully generated case: ${sanitized.title} (${expectedTicker})`);
        existingCases.add(caseKey);
        existingTickers.add(expectedTicker);
        generatedTickers.push({ title: sanitized.title, ticker: expectedTicker });

      } catch (parseError) {
        const message = 'Error parsing generated case JSON';
        console.error(message, parseError);
        console.error('Generated content:', generatedContent);
        warnings.push(message);
      }
    }

    if (generatedCases.length === 0) {
      const warningMessage = warnings.length > 0 ? warnings.join(' | ') : 'No cases were successfully generated';
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
