
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

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const isMissingRunsTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (code === '42P01') {
    return true;
  }

  const message = (error as { message?: string }).message?.toLowerCase() ?? '';
  return message.includes('ai_generation_runs');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Missing required environment variables',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let runId: string | null = null;
  let generatedCount = 0;
  const batchId = crypto.randomUUID();
  let triggeredBy = 'scheduled';
  let runLoggingAvailable = true;

  try {
    console.log('Starting AI weekly cases generation...');

    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const payload = await req.json();
        if (payload?.triggered_by && typeof payload.triggered_by === 'string') {
          triggeredBy = payload.triggered_by;
        }
      } catch (parseRequestError) {
        console.warn('Could not parse request payload:', parseRequestError);
      }
    }

    triggeredBy = req.headers.get('x-triggered-by') || triggeredBy;

    // Record that a generation run has started
    const startedAt = new Date().toISOString();
    const { data: runRecord, error: runInsertError } = await supabase
      .from('ai_generation_runs')
      .insert({
        ai_batch_id: batchId,
        status: 'running',
        triggered_by: triggeredBy,
        started_at: startedAt,
      })
      .select()
      .single();

    if (runInsertError) {
      if (isMissingRunsTableError(runInsertError)) {
        runLoggingAvailable = false;
        console.warn(
          'ai_generation_runs table is missing. Proceeding without run logging.'
        );
      } else {
        console.error('Failed to record AI generation run', runInsertError);
        throw runInsertError;
      }
    }

    if (runLoggingAvailable) {
      runId = runRecord?.id ?? null;
    }

    // Fetch recent AI-generated cases to avoid duplicates
    const { data: recentCases } = await supabase
      .from('stock_cases')
      .select('title, company_name')
      .eq('ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(50);

    const recentCaseKeys = new Set(
      (recentCases || [])
        .map((item) => {
          const title = typeof item.title === 'string' ? item.title.toLowerCase() : '';
          const company = typeof item.company_name === 'string' ? item.company_name.toLowerCase() : '';
          return `${title}::${company}`;
        })
    );

    // Get market sectors and current trends for context
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods', 'Real Estate'];
    const investmentStyles = ['Growth', 'Value', 'Dividend', 'ESG'];

    const generatedCases: Record<string, unknown>[] = [];

    // Generate 3 AI cases with different focus areas
    for (let i = 0; i < 3; i++) {
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];

      const prompt = `Som en professionell finansanalytiker, skapa ett realistiskt aktiefall för svenska investerare.

Fokus: ${style}-investering inom ${sector}-sektorn
Stil: Professionell men tillgänglig
Längd: Kortfattat men informativt

Skapa:
1. Företagsnamn (kan vara fiktivt men realistiskt)
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
        console.error(`OpenAI API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content;

      if (!generatedContent) {
        console.error('No content returned from OpenAI for case', i + 1);
        continue;
      }

      try {
        const caseData = JSON.parse(generatedContent);

        const caseTitle = typeof caseData.title === 'string' ? caseData.title.toLowerCase() : '';
        const caseCompany = typeof caseData.company_name === 'string' ? caseData.company_name.toLowerCase() : '';
        const caseKey = `${caseTitle}::${caseCompany}`;
        if (recentCaseKeys.has(caseKey)) {
          console.warn('Skipping duplicate AI case', caseData.title, caseData.company_name);
          continue;
        }

        recentCaseKeys.add(caseKey);

        // Add AI-specific fields
        caseData.ai_generated = true;
        caseData.is_public = true;
        caseData.status = 'active';
        caseData.ai_batch_id = batchId;
        caseData.generated_at = new Date().toISOString();

        caseData.target_price = safeNumber(caseData.target_price);
        caseData.entry_price = safeNumber(caseData.entry_price);
        caseData.stop_loss = safeNumber(caseData.stop_loss);

        generatedCases.push(caseData);
        console.log(`Successfully generated case: ${caseData.title}`);

      } catch (parseError) {
        console.error('Error parsing generated case:', parseError);
        console.error('Generated content:', generatedContent);
      }
    }

    if (generatedCases.length === 0) {
      throw new Error('No cases were successfully generated');
    }

    // Insert generated cases into database
    const { data: insertedCases, error: insertError } = await supabase
      .from('stock_cases')
      .insert(generatedCases)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    generatedCount = insertedCases?.length ?? 0;
    console.log(`Successfully inserted ${generatedCount} AI-generated cases`);

    if (runLoggingAvailable && runId) {
      await supabase
        .from('ai_generation_runs')
        .update({
          status: 'succeeded',
          generated_count: generatedCount,
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', runId);
    }

    return new Response(JSON.stringify({
      success: true,
      generated_cases: generatedCount,
      ai_batch_id: batchId,
      run_id: runId,
      cases: insertedCases,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-weekly-cases function:', error);

    if (runLoggingAvailable && runId) {
      await supabase
        .from('ai_generation_runs')
        .update({
          status: 'failed',
          generated_count: generatedCount,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unexpected error',
      success: false,
      ai_batch_id: batchId,
      run_id: runId,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
