
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

const sanitizeCaseData = (rawCase: any) => {
  if (!rawCase || typeof rawCase !== 'object') {
    return null;
  }

  const title = typeof rawCase.title === 'string' ? rawCase.title.trim() : '';
  const companyName = typeof rawCase.company_name === 'string' ? rawCase.company_name.trim() : '';
  const description = typeof rawCase.description === 'string' ? rawCase.description.trim() : '';
  const ticker = typeof rawCase.ticker === 'string' ? rawCase.ticker.trim().toUpperCase() : '';

  const lowerCompany = companyName.toLowerCase();
  const lowerDescription = description.toLowerCase();
  const forbiddenTerms = ['fiktiv', 'fiktivt', 'påhitt', 'låtsas', 'fictional'];

  if (!title || !companyName || !description) {
    return null;
  }

  if (forbiddenTerms.some((term) => lowerCompany.includes(term) || lowerDescription.includes(term))) {
    return null;
  }

  if (!ticker || !/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return null;
  }

  const sector = typeof rawCase.sector === 'string' ? rawCase.sector.trim() : null;
  const marketCap = rawCase.market_cap ? String(rawCase.market_cap).trim() : null;
  const peRatio = rawCase.pe_ratio ? String(rawCase.pe_ratio).trim() : null;
  const dividendYield = rawCase.dividend_yield ? String(rawCase.dividend_yield).trim() : null;

  return {
    title,
    company_name: companyName,
    description,
    sector,
    market_cap: marketCap,
    pe_ratio: peRatio,
    dividend_yield: dividendYield,
    entry_price: sanitizeNumber(rawCase.entry_price),
    target_price: sanitizeNumber(rawCase.target_price),
    stop_loss: sanitizeNumber(rawCase.stop_loss),
    ticker,
  };
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

    const generatedCases: any[] = [];
    const warnings: string[] = [];
    const generatedTickers: { title: string; ticker: string }[] = [];

    for (let i = 0; i < CASE_COUNT; i++) {
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];

      const prompt = `Som en professionell finansanalytiker, skapa ett realistiskt aktiefall för svenska investerare.

Fokus: ${style}-investering inom ${sector}-sektorn
Stil: Professionell men tillgänglig
Längd: Kortfattat men informativt

Krav:
- Välj ett verkligt börsnoterat bolag (ingen fiktion) som handlas på en etablerad börs.
- Inkludera bolagets officiella börsticker (t.ex. "AAPL" eller "HM-B.ST").
- Använd aktuella och plausibla siffror för nyckeltal.
- Skriv på svenska.

Skapa:
1. Företagsnamn (endast verkligt bolag)
2. Investeringstitel (max 60 tecken)
3. Kort beskrivning (max 200 tecken)
4. Sektor
5. Estimerad marknadsvärdering
6. P/E-tal (realistiskt för sektorn)
7. Utdelningsavkastning (om relevant)
8. Målkurs
9. Stopploss-nivå
10. Kort investeringsargument

Svara endast med giltigt JSON i följande format:
{
  "title": "string",
  "company_name": "string",
  "description": "string",
  "sector": "string",
  "market_cap": "string",
  "pe_ratio": "string",
  "dividend_yield": "string",
  "ticker": "string",
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

        generatedCases.push({
          ...caseWithoutTicker,
          ticker,
          ai_generated: true,
          is_public: true,
          status: 'active',
          ai_batch_id: runId,
          generated_at: new Date().toISOString(),
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
