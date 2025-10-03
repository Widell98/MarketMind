import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const numericField = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') {
    return value;
  }

  const sanitized = value.replace(/[^0-9+\-.]/g, '');
  if (sanitized.length === 0) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  const parsed = Number.parseFloat(sanitized);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}).optional();

const dailyCaseSchema = z.object({
  company: z.string().min(1),
  ticker: z.string().min(1),
  summary: z.string().min(1).max(320),
  thesis: z.object({
    bull_case: z.string().optional(),
    bear_case: z.string().optional(),
    key_metric: z.string().optional(),
  }).optional(),
  upside: numericField,
  downside: numericField,
});

type DailyCasePayload = z.infer<typeof dailyCaseSchema>;

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
};

type TavilyResponse = {
  query: string;
  answer?: string;
  results?: TavilySearchResult[];
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const fetchTavilyContext = async (): Promise<TavilyResponse | null> => {
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas – använder fallback-data.');
    return null;
  }

  const requestBody = {
    api_key: tavilyApiKey,
    query: 'Latest news, catalysts, and technical levels for notable Nordic and European equities today',
    search_depth: 'advanced',
    include_answer: true,
    include_raw_content: false,
    max_results: 6,
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fel vid hämtning av Tavily-data:', errorText);
    return null;
  }

  const tavilyData = await response.json() as TavilyResponse;
  return tavilyData;
};

const buildDailyCasePrompt = (tavilyData: TavilyResponse | null) => ({
  generated_at: new Date().toISOString(),
  locale: 'sv-SE',
  instructions: 'Skapa ett unikt investeringscase på svenska för dagens datum. Fokusera på nordiska eller europeiska bolag och balansera fundamental och teknisk analys.',
  format: {
    summary_sentences: '3-4',
    tone: 'professionell, engagerande, koncis',
  },
  market_context: tavilyData,
});

const openAIResponseSchema = {
  type: 'object',
  properties: {
    company: { type: 'string' },
    ticker: { type: 'string' },
    summary: { type: 'string' },
    thesis: {
      type: 'object',
      properties: {
        bull_case: { type: 'string' },
        bear_case: { type: 'string' },
        key_metric: { type: 'string' },
      },
      additionalProperties: false,
    },
    upside: { type: 'number' },
    downside: { type: 'number' },
  },
  required: ['company', 'ticker', 'summary'],
  additionalProperties: false,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!openAIApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const today = getTodayIsoDate();

    const { data: existingCase } = await supabase
      .from('daily_cases')
      .select('*')
      .eq('case_date', today)
      .maybeSingle();

    if (existingCase) {
      console.log('Återanvänder redan genererat case för dagen.');
      return new Response(JSON.stringify(existingCase), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tavilyData = await fetchTavilyContext();
    const promptPayload = buildDailyCasePrompt(tavilyData);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'daily_case_schema',
            schema: openAIResponseSchema,
            strict: true,
          },
        },
        messages: [
          {
            role: 'system',
            content: 'Du är en finansanalytiker som skapar ett dagligt investeringscase. Svara alltid med giltig JSON.',
          },
          {
            role: 'user',
            content: JSON.stringify(promptPayload),
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Kunde inte generera investeringscase');
    }

    const aiJson = await aiResponse.json();
    const rawContent = aiJson?.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('Tomt svar från OpenAI');
    }

    let parsedPayload: DailyCasePayload;
    try {
      parsedPayload = dailyCaseSchema.parse(JSON.parse(rawContent));
    } catch (parseError) {
      console.error('Kunde inte tolka OpenAI-svaret:', parseError);
      throw new Error('OpenAI svarade inte med giltigt JSON-format');
    }

    const { data: insertedCase, error: insertError } = await supabase
      .from('daily_cases')
      .insert({
        case_date: today,
        company_name: parsedPayload.company,
        ticker: parsedPayload.ticker.toUpperCase(),
        summary: parsedPayload.summary,
        thesis: parsedPayload.thesis ?? null,
        upside: parsedPayload.upside ?? null,
        downside: parsedPayload.downside ?? null,
        tavily_payload: tavilyData,
        gpt_raw: aiJson,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Fel vid insättning i daily_cases:', insertError);
      throw new Error('Kunde inte spara investeringscaset');
    }

    return new Response(JSON.stringify(insertedCase), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fel i generate-daily-case:', error);
    const message = error instanceof Error ? error.message : 'Ett oväntat fel inträffade';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
