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

type MarketIndex = {
  name: string;
  symbol: string;
  change_percent: number;
  change: number;
  level: number;
};

type SectorPerformance = {
  sector: string;
  change_percent: number;
};

const marketSummarySchema = z.object({
  sentiment: z.string().min(1).max(80),
  summary: z.string().min(1).max(320),
  highlights: z.array(z.string().min(1)).max(4).optional(),
});

type MarketSummary = z.infer<typeof marketSummarySchema>;

const fallbackIndices: MarketIndex[] = [
  { name: 'OMXS30', symbol: '^OMX', change_percent: 0.58, change: 9.8, level: 2134.45 },
  { name: 'DAX', symbol: 'DAX', change_percent: 0.42, change: 65.1, level: 15672.21 },
  { name: 'S&P 500', symbol: '^GSPC', change_percent: 0.35, change: 16.2, level: 5228.74 },
  { name: 'Nasdaq', symbol: '^IXIC', change_percent: 0.61, change: 91.4, level: 15224.87 },
];

const fallbackSectors: SectorPerformance[] = [
  { sector: 'Teknik', change_percent: 1.2 },
  { sector: 'Industri', change_percent: 0.5 },
  { sector: 'Finans', change_percent: -0.3 },
  { sector: 'Hälsovård', change_percent: 0.2 },
  { sector: 'Energi', change_percent: -0.6 },
];

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const fetchTavilyMarketData = async (): Promise<TavilyResponse | null> => {
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas – använder fallback-data.');
    return null;
  }

  const requestBody = {
    api_key: tavilyApiKey,
    query: 'Market performance summary for OMXS30, DAX, S&P 500 and Nasdaq with sector moves today',
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

  return await response.json() as TavilyResponse;
};

const normalizeIndices = (_tavilyData: TavilyResponse | null): MarketIndex[] => {
  // Om vi hade strukturerade siffror från Tavily skulle de parsas här.
  return fallbackIndices;
};

const normalizeSectors = (_tavilyData: TavilyResponse | null): SectorPerformance[] => {
  return fallbackSectors;
};

const buildMarketPrompt = (indices: MarketIndex[], sectors: SectorPerformance[], tavilyData: TavilyResponse | null) => ({
  generated_at: new Date().toISOString(),
  locale: 'sv-SE',
  focus: 'Skapa en kort marknadspuls med sentiment och viktiga drivkrafter.',
  indices,
  sectors,
  tavily_context: tavilyData,
});

const openAIResponseSchema = {
  type: 'object',
  properties: {
    sentiment: { type: 'string' },
    summary: { type: 'string' },
    highlights: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['sentiment', 'summary'],
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

    const { data: existingSnapshot } = await supabase
      .from('market_snapshots')
      .select('*')
      .eq('snapshot_date', today)
      .maybeSingle();

    if (existingSnapshot) {
      console.log('Återanvänder redan genererad marknadspuls.');
      return new Response(JSON.stringify(existingSnapshot), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tavilyData = await fetchTavilyMarketData();
    const indices = normalizeIndices(tavilyData);
    const sectors = normalizeSectors(tavilyData);

    const promptPayload = buildMarketPrompt(indices, sectors, tavilyData);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'market_pulse_schema',
            schema: openAIResponseSchema,
            strict: true,
          },
        },
        messages: [
          {
            role: 'system',
            content: 'Du är en marknadskommentator. Leverera sentiment och kort sammanfattning på svenska. Svara endast med giltig JSON.',
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
      throw new Error('Kunde inte generera marknadspulsen');
    }

    const aiJson = await aiResponse.json();
    const rawContent = aiJson?.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('Tomt svar från OpenAI');
    }

    let summary: MarketSummary;
    try {
      summary = marketSummarySchema.parse(JSON.parse(rawContent));
    } catch (parseError) {
      console.error('Kunde inte tolka OpenAI-svaret:', parseError);
      throw new Error('OpenAI svarade inte med giltigt JSON-format');
    }

    const { data: insertedSnapshot, error: insertError } = await supabase
      .from('market_snapshots')
      .insert({
        snapshot_date: today,
        sentiment_label: summary.sentiment,
        narrative: summary.summary,
        highlights: summary.highlights ?? null,
        indices,
        sector_heatmap: sectors,
        tavily_payload: tavilyData,
        gpt_raw: aiJson,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Fel vid insättning i market_snapshots:', insertError);
      throw new Error('Kunde inte spara marknadspulsen');
    }

    return new Response(JSON.stringify(insertedSnapshot), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fel i generate-market-snapshot:', error);
    const message = error instanceof Error ? error.message : 'Ett oväntat fel inträffade';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
