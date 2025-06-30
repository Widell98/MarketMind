import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(auth);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { type = 'market_sentiment', personalized = false } = await req.json();
    const insights = personalized
      ? await generatePersonalizedInsights(user.id, type)
      : await generateGeneralInsights(type);

    await saveInsights(insights, user.id, personalized);
    return jsonResponse(insights);
  } catch (err) {
    console.error('AI error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generatePersonalizedInsights(userId: string, type: string) {
  if (!openAIApiKey) return await getLiveFallbackInsights(type);

  try {
    const [{ data: profile }, { data: holdings }] = await Promise.all([
      supabase.from('user_risk_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_holdings').select('*').eq('user_id', userId),
    ]);

    const context = {
      riskTolerance: profile?.risk_tolerance || 'medium',
      investmentHorizon: profile?.investment_horizon || 'long',
      sectors: profile?.sector_interests || [],
      currentHoldings: holdings?.map(h => ({ symbol: h.symbol, sector: h.sector, value: h.current_value })) || []
    };

    const prompt = `Generera personaliserade ${type} insikter för användare:
Risk: ${context.riskTolerance}, Horisont: ${context.investmentHorizon},
Sektorer: ${JSON.stringify(context.sectors)}, Innehav: ${JSON.stringify(context.currentHoldings)}.`;

    return await requestOpenAI('gpt-4o', personalizedSystemPrompt(), prompt, 2000) || await getLiveFallbackInsights(type);
  } catch (err) {
    console.error('Personalized error:', err);
    return await getLiveFallbackInsights(type);
  }
}

async function generateGeneralInsights(type: string) {
  if (!openAIApiKey) return await getLiveFallbackInsights(type);

  const prompt = `Generera ${type} insikter för svenska och globala marknader. Fokus:
AI/tech, centralbanker, geopolitik, sektorrotation, makrotrender, ESG.`;

  return await requestOpenAI('gpt-4o', generalSystemPrompt(), prompt, 2500) || await getLiveFallbackInsights(type);
}

async function requestOpenAI(model: string, systemPrompt: string, userPrompt: string, max_tokens: number) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens
      })
    });
    const json = await res.json();
    return JSON.parse(json.choices?.[0]?.message?.content);
  } catch (err) {
    console.error('OpenAI call failed:', err);
    return null;
  }
}

function generalSystemPrompt() {
  return `Du är en expert marknadsanalytiker. Skapa JSON array med:
id, title, content, confidence_score (0–1), insight_type, key_factors (array), impact_timeline (short/medium/long).`;
}

function personalizedSystemPrompt() {
  return `Du är en AI-investeringsrådgivare. Skapa JSON array med:
id, title, content, confidence_score (0–1), insight_type, actionable_steps (array), risk_level (low/medium/high).`;
}

async function saveInsights(insights: any[], userId: string, isPersonalized: boolean) {
  try {
    const mapped = insights.map(insight => ({
      user_id: isPersonalized ? userId : null,
      insight_type: insight.insight_type || 'market_analysis',
      title: insight.title,
      content: insight.content,
      confidence_score: insight.confidence_score || 0.8,
      is_personalized: isPersonalized,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      data_sources: insight.key_factors || insight.actionable_steps || []
    }));
    await supabase.from('ai_market_insights').insert(mapped);
    console.log(`Saved ${mapped.length} insights.`);
  } catch (err) {
    console.error('Save failed:', err);
  }
}

async function getLiveFallbackInsights(type: string) {
  const prompt = `Skapa 3 aktuella ${type} insikter relaterade till marknadstrender. Returnera som JSON array med objekt som innehåller: id, title, content, confidence_score (0-1), insight_type, key_factors (array), impact_timeline (short/medium/long).`;
  return await requestOpenAI('gpt-4o', generalSystemPrompt(), prompt, 1200) || [];
}
