
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CASE_COUNT = 3;

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

const normalizeParagraphs = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n');

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

type SanitizedWebsite = {
  hostname: string;
  url: string;
  logoUrl: string;
};

const sanitizeWebsite = (value: unknown): SanitizedWebsite | null => {
  if (typeof value !== 'string') {
    return null;
  }

  let trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (!hostname || hostname.split('.').length < 2) {
      return null;
    }

    return {
      hostname,
      url: `https://${hostname}`,
      logoUrl: `https://logo.clearbit.com/${hostname}?size=400`,
    };
  } catch (_error) {
    return null;
  }
};

const sanitizeCaseData = (rawCase: any) => {
  if (!rawCase || typeof rawCase !== 'object') {
    return null;
  }

  const title = typeof rawCase.title === 'string' ? rawCase.title.trim() : '';
  const companyName = typeof rawCase.company_name === 'string' ? rawCase.company_name.trim() : '';
  const descriptionRaw = typeof rawCase.description === 'string' ? rawCase.description.trim() : '';
  const longDescription = sanitizeLongDescription(
    rawCase.long_description ?? rawCase.investment_thesis ?? rawCase.analysis,
  );
  const ticker = typeof rawCase.ticker === 'string' ? rawCase.ticker.trim().toUpperCase() : '';
  const websiteInfo = sanitizeWebsite(
    rawCase.official_website ?? rawCase.company_website ?? rawCase.website ?? rawCase.source_url ?? rawCase.source,
  );

  const lowerCompany = companyName.toLowerCase();
  const lowerDescription = descriptionRaw.toLowerCase();
  const forbiddenTerms = ['fiktiv', 'fiktivt', 'påhitt', 'låtsas', 'fictional'];

  if (!title || !companyName || !descriptionRaw) {
    return null;
  }

  if (forbiddenTerms.some((term) => lowerCompany.includes(term) || lowerDescription.includes(term))) {
    return null;
  }

  if (!ticker || !/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return null;
  }

  if (!longDescription) {
    return null;
  }

  if (!websiteInfo) {
    return null;
  }

  const description = descriptionRaw.replace(/\s+/g, ' ');
  const shortDescription = description.length > 280 ? `${description.slice(0, 277).trimEnd()}...` : description;

  const sector = typeof rawCase.sector === 'string' ? rawCase.sector.trim() : null;
  const marketCap = rawCase.market_cap ? String(rawCase.market_cap).trim() : null;
  const peRatio = rawCase.pe_ratio ? String(rawCase.pe_ratio).trim() : null;
  const dividendYield = rawCase.dividend_yield ? String(rawCase.dividend_yield).trim() : null;

  return {
    title,
    company_name: companyName,
    description: shortDescription,
    long_description: longDescription,
    sector,
    market_cap: marketCap,
    pe_ratio: peRatio,
    dividend_yield: dividendYield,
    entry_price: sanitizeNumber(rawCase.entry_price),
    target_price: sanitizeNumber(rawCase.target_price),
    stop_loss: sanitizeNumber(rawCase.stop_loss),
    ticker,
    image_url: websiteInfo.logoUrl,
    currency: sanitizeCurrency(rawCase.currency),
  };
};

type SheetTickerInfo = {
  symbol: string;
  price: number | null;
  currency: string | null;
  name?: string | null;
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

    const { data: recentCases } = await supabaseClient
      .from('stock_cases')
      .select('title, company_name')
      .eq('ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(50);

    const existingCases = new Set<string>();
    (recentCases || []).forEach((caseItem) => {
      if (caseItem.title && caseItem.company_name) {
        existingCases.add(`${caseItem.title.toLowerCase()}|${caseItem.company_name.toLowerCase()}`);
      }
    });

    const warnings: string[] = [];

    let sheetTickerIndex = new Map<string, SheetTickerInfo>();
    try {
      const { data: tickerResponse, error: tickerError } = await supabaseClient
        .functions
        .invoke<{ tickers?: SheetTickerInfo[] }>('list-sheet-tickers');

      if (tickerError) {
        console.error('Failed to fetch sheet tickers:', tickerError);
        warnings.push('Kunde inte hämta prisdata från list-sheet-tickers');
      } else {
        sheetTickerIndex = buildSheetTickerIndex(tickerResponse?.tickers ?? []);
        if (sheetTickerIndex.size === 0) {
          warnings.push('list-sheet-tickers returnerade inga tickers');
        }
      }
    } catch (tickerFetchError) {
      console.error('Error invoking list-sheet-tickers:', tickerFetchError);
      warnings.push('Fel vid hämtning av prisdata för aktier');
    }

    const generatedCases: any[] = [];
    const generatedTickers: { title: string; ticker: string }[] = [];

    for (let i = 0; i < CASE_COUNT; i++) {
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];

      const prompt = `Som en professionell finansanalytiker, skapa ett realistiskt aktiefall för svenska investerare.

Fokus: ${style}-investering inom ${sector}-sektorn
Stil: Professionell men tillgänglig

Krav:
- Välj ett verkligt börsnoterat bolag (ingen fiktion) som handlas på en etablerad börs.
- Inkludera bolagets officiella börsticker (t.ex. "AAPL" eller "HM-B.ST").
- Ange bolagets officiella webbplatsdomän (utan extra text).
- Skriv en kort sammanfattning (max 200 tecken) och en längre investeringsanalys med minst tre meningar om varför bolaget är intressant.
- Använd aktuella och plausibla siffror för nyckeltal.
- Skriv på svenska.

Returnera ENDAST giltigt JSON i följande format (utan extra text eller markdown):
{
  "title": "string",
  "company_name": "string",
  "description": "string",
  "long_description": "string",
  "sector": "string",
  "market_cap": "string",
  "pe_ratio": "string",
  "dividend_yield": "string",
  "ticker": "string",
  "official_website": "string",
  "target_price": number,
  "entry_price": number,
  "stop_loss": number
}`;

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
        const caseData = JSON.parse(normalizedContent);
        const sanitized = sanitizeCaseData(caseData);

        if (!sanitized) {
          const message = 'Generated case missing required fields';
          console.error(message, caseData);
          warnings.push(message);
          continue;
        }

        const caseKey = `${sanitized.title.toLowerCase()}|${sanitized.company_name.toLowerCase()}`;
        if (existingCases.has(caseKey)) {
          const message = `Duplicate case skipped for ${sanitized.title}`;
          console.warn(message);
          warnings.push(message);
          continue;
        }

        existingCases.add(caseKey);

        const { ticker, ...caseWithoutTicker } = sanitized;

        const sheetInfo = findSheetTickerInfo(ticker, sheetTickerIndex);
        let entryPrice = sanitized.entry_price;
        let targetPrice = sanitized.target_price;
        let stopLoss = sanitized.stop_loss;
        let currency = sanitized.currency;

        if (sheetInfo) {
          const price = typeof sheetInfo.price === 'number' && Number.isFinite(sheetInfo.price)
            ? Number(sheetInfo.price)
            : null;
          if (price !== null) {
            entryPrice = Number(price.toFixed(2));
            if (!targetPrice || !Number.isFinite(targetPrice) || targetPrice <= 0) {
              targetPrice = Number((price * 1.08).toFixed(2));
            }
            if (!stopLoss || !Number.isFinite(stopLoss) || stopLoss <= 0 || stopLoss >= entryPrice) {
              stopLoss = Number((price * 0.92).toFixed(2));
            }
          }

          if (sheetInfo.currency && typeof sheetInfo.currency === 'string') {
            const resolvedCurrency = sheetInfo.currency.trim().toUpperCase();
            if (resolvedCurrency.length >= 3 && resolvedCurrency.length <= 5) {
              currency = resolvedCurrency;
            }
          }
        } else {
          warnings.push(`Prisdata saknas för ${ticker}`);
        }

        const resolvedCurrency = currency ?? 'SEK';

        if (entryPrice !== null && targetPrice !== null && targetPrice <= entryPrice) {
          targetPrice = Number((entryPrice * 1.08).toFixed(2));
        }

        if (entryPrice !== null && stopLoss !== null && stopLoss >= entryPrice) {
          stopLoss = Number((entryPrice * 0.92).toFixed(2));
        }

        generatedCases.push({
          ...caseWithoutTicker,
          ticker,
          ai_generated: true,
          is_public: true,
          status: 'active',
          ai_batch_id: runId,
          generated_at: new Date().toISOString(),
          currency: resolvedCurrency,
          entry_price: entryPrice,
          current_price: entryPrice,
          target_price: targetPrice,
          stop_loss: stopLoss,
        });

        console.log(`Successfully generated case: ${sanitized.title} (${ticker})`);
        generatedTickers.push({ title: sanitized.title, ticker });

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
