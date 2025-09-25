
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

type MarketauxIntent = 'news' | 'report';

type MarketauxNormalizedItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  source?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
};

type MarketauxContextPayload = {
  source: 'marketaux';
  intent: MarketauxIntent;
  symbol?: string | null;
  query?: string;
  fetchedAt: string;
  summary?: string[];
  items?: MarketauxNormalizedItem[];
};

type QuickAssistantContext = {
  marketaux?: MarketauxContextPayload;
};

const buildMarketauxContextPrompt = (payload: MarketauxContextPayload) => {
  const header = `DATAKÄLLA (MarketAux – ${payload.intent === 'report' ? 'Bolagsrapporter' : 'Nyheter'})`;
  const summaryLines = Array.isArray(payload.summary) && payload.summary.length
    ? payload.summary.map((line) => `- ${line}`).join('\n')
    : '- Ingen sammanfattning tillgänglig.';

  const itemsText = Array.isArray(payload.items) && payload.items.length
    ? payload.items.map((item, idx) => formatMarketauxItem(item, payload.intent, idx + 1)).join('\n\n')
    : '- Inga enskilda dataposter tillgängliga.';

  return `${header}
Fråga: ${payload.query ?? 'Okänd fråga'}
Symbol: ${payload.symbol ?? 'Ej angiven'}
Hämtad: ${payload.fetchedAt}

Sammanfattning:
${summaryLines}

Poster:
${itemsText}

Instruktioner:
- Utgå från MarketAux-datan ovan när du svarar.
- Om datan täcker frågan, inkludera en kort analys.
- Svara på svenska och var tydlig när något är osäkert.
- Markera i svaret att MarketAux användes, till exempel genom att skriva "Källa: MarketAux".`;
};

const formatMarketauxItem = (item: MarketauxNormalizedItem, intent: MarketauxIntent, index: number) => {
  const baseLines = [`${index}. ${item.title}`];

  if (item.subtitle) {
    baseLines.push(`   Sammanfattning: ${item.subtitle}`);
  }

  if (item.source || item.publishedAt) {
    const metaParts = [] as string[];
    if (item.source) metaParts.push(`Källa: ${item.source}`);
    if (item.publishedAt) metaParts.push(`Publicerad: ${item.publishedAt}`);
    if (metaParts.length) {
      baseLines.push(`   ${metaParts.join(' • ')}`);
    }
  }

  if (intent === 'report') {
    const reportDetails = extractReportDetails(item.metadata ?? {});
    if (reportDetails.length) {
      baseLines.push(`   Nyckeltal: ${reportDetails.join(' | ')}`);
    }
  }

  if (item.url && intent === 'news') {
    baseLines.push(`   Länk: ${item.url}`);
  }

  return baseLines.join('\n');
};

const extractReportDetails = (metadata: Record<string, unknown>) => {
  const rows: string[] = [];
  const fiscalPeriod = typeof metadata.fiscalPeriod === 'string' ? metadata.fiscalPeriod : undefined;
  const fiscalYear = typeof metadata.fiscalYear === 'string' || typeof metadata.fiscalYear === 'number'
    ? metadata.fiscalYear
    : undefined;
  const epsActual = typeof metadata.epsActual === 'number' ? metadata.epsActual : undefined;
  const epsEstimate = typeof metadata.epsEstimate === 'number' ? metadata.epsEstimate : undefined;
  const revenueActual = typeof metadata.revenueActual === 'number' ? metadata.revenueActual : undefined;
  const revenueEstimate = typeof metadata.revenueEstimate === 'number' ? metadata.revenueEstimate : undefined;
  const currency = typeof metadata.currency === 'string' ? metadata.currency : undefined;

  if (fiscalPeriod || fiscalYear) {
    rows.push(`Period: ${[fiscalPeriod, fiscalYear].filter(Boolean).join(' ')}`);
  }

  if (epsActual != null || epsEstimate != null) {
    rows.push(`EPS: ${formatNumber(epsActual)} (est ${formatNumber(epsEstimate)})`);
  }

  if (revenueActual != null || revenueEstimate != null) {
    rows.push(`Intäkter: ${formatNumber(revenueActual, currency)} (est ${formatNumber(revenueEstimate, currency)})`);
  }

  return rows;
};

const formatNumber = (value?: number, currency?: string) => {
  if (value == null || Number.isNaN(value)) {
    return '–';
  }

  try {
    if (currency) {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    }

    return new Intl.NumberFormat('sv-SE', {
      maximumFractionDigits: 2,
    }).format(value);
  } catch (_) {
    return String(value);
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== QUICK AI ASSISTANT FUNCTION STARTED ===');

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const {
      message,
      userId,
      systemPrompt,
      model = 'gpt-4o-mini',
      maxTokens = 50,
      temperature = 0.3,
      contextData,
    } = requestBody;

    const marketauxContext: MarketauxContextPayload | undefined = (contextData as QuickAssistantContext | undefined)?.marketaux;

    console.log('Quick AI Assistant called with:', {
      message: message?.substring(0, 50) + '...',
      userId,
      model,
      maxTokens,
      temperature
    });

    if (!message || !userId) {
      console.error('Missing required fields:', { message: !!message, userId: !!userId });
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, calling API...');

    // Enhance system prompt with micro-template structure
    const enhancedSystemPrompt = `${systemPrompt}

MIKRO-MALL FÖR SNABBA AKTIESVAR:
Strukturera VARJE svar enligt denna kompakta mall:

**📊 Tes:** [Huvud-investeringstesen i 1 mening]
**⚠️ Risk:** [Primär risk att beakta]
**📈 Nivåer:** [Relevanta kursnivåer om tillgängliga]

Exempel:
📊 **Tes:** Stark tillväxtaktie inom gaming med global marknadsledning
⚠️ **Risk:** Regulatorisk osäkerhet och konjunkturkänslighet  
📈 **Nivåer:** Stöd 1080 SEK, motstånd 1250 SEK

Håll totalt under 70 ord. Ge alltid konkret investingssyn.`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      }
    ];

    if (marketauxContext) {
      console.log('MarketAux context detected with items:', marketauxContext.items?.length ?? 0);
      messages.push({
        role: 'system',
        content: buildMarketauxContextPrompt(marketauxContext),
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    console.log('=== CALLING OPENAI API ===');
    console.log('Model:', model);
    console.log('Max tokens:', maxTokens);
    console.log('Temperature:', temperature);
    console.log('System prompt length:', systemPrompt?.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error details:', errorData);
      
      if (response.status === 429) {
        const errorType = errorData.error?.type;
        
        if (errorType === 'insufficient_quota') {
          return new Response(
            JSON.stringify({ 
              error: 'quota_exceeded',
              message: 'Du har nått din dagliga gräns för OpenAI API-användning.',
              success: false 
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, choices:', data.choices?.length);
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI response length:', aiResponse?.length);
    console.log('AI response:', aiResponse);

    // Initialize Supabase client for usage tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Track usage
    const { error: usageError } = await supabase.rpc('increment_ai_usage', {
      _user_id: userId,
      _usage_type: 'ai_message'
    });

    if (usageError) {
      console.error('Error tracking usage:', usageError);
    }

    console.log('=== FUNCTION COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true,
        model: model,
        tokens_used: maxTokens
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return new Response(
        JSON.stringify({ 
          error: 'quota_exceeded',
          message: 'Du har nått din dagliga gräns för OpenAI API-användning.',
          success: false 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Ett oväntat fel inträffade',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
