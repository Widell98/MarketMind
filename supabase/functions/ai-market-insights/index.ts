import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type = 'market_sentiment', personalized = false, forceRefresh = false } = await req.json();
    console.log(`Getting AI insights for user ${user.id}, type: ${type}, personalized: ${personalized}`);

    // Check for cached insights first (unless forced refresh)
    if (!forceRefresh) {
      const cachedInsights = await getCachedInsights(user.id, type, personalized);
      if (cachedInsights) {
        console.log('Returning cached insights');
        return new Response(JSON.stringify(cachedInsights), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Generating new insights');
    let insights;
    if (personalized) {
      insights = await generatePersonalizedInsights(user.id, type);
    } else {
      insights = await generateGeneralInsights(type);
    }

    // Cache the new insights
    await cacheInsights(user.id, type, personalized, insights);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getCachedInsights(userId: string, type: string, isPersonalized: boolean) {
  try {
    const { data, error } = await supabase
      .from('ai_insights_cache')
      .select('insights_data, expires_at')
      .eq('user_id', isPersonalized ? userId : null)
      .eq('insight_type', type)
      .eq('is_personalized', isPersonalized)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.log('No valid cached insights found:', error?.message);
      return null;
    }

    return data.insights_data;
  } catch (error) {
    console.error('Error fetching cached insights:', error);
    return null;
  }
}

async function cacheInsights(userId: string, type: string, isPersonalized: boolean, insights: any[]) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3.5); // 3.5 days = twice per week

    const { error } = await supabase
      .from('ai_insights_cache')
      .upsert({
        user_id: isPersonalized ? userId : null,
        insight_type: type,
        is_personalized: isPersonalized,
        insights_data: insights,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'user_id,insight_type,is_personalized'
      });

    if (error) {
      console.error('Error caching insights:', error);
    } else {
      console.log('Successfully cached insights');
    }
  } catch (error) {
    console.error('Error caching insights:', error);
  }
}

async function generatePersonalizedInsights(userId: string, type: string) {
  if (!openAIApiKey) {
    console.warn('OpenAI API key not found, generating AI-powered mock insights');
    return await generateAIMockInsights(type, true);
  }

  try {
    // Hämta användarens riskprofil och holdings
    const { data: riskProfile } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    const userContext = {
      riskTolerance: riskProfile?.risk_tolerance || 'medium',
      investmentHorizon: riskProfile?.investment_horizon || 'long',
      sectors: riskProfile?.sector_interests || [],
      currentHoldings: holdings?.map(h => ({ 
        symbol: h.symbol, 
        sector: h.sector, 
        value: h.current_value,
        name: h.name 
      })) || [],
      portfolioValue: portfolio?.total_value || 0
    };

   const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openAIApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `
Du är en AI-specialist inom aktie- och portföljanalys. Generera ENDAST en ren JSON-array med 2–3 personliga marknadsinsikter enligt följande struktur:

[
  {
    "id": "unik-insight-id",
    "title": "Kort rubrik på svenska",
    "content": "Koncis analys, max 40 ord",
    "confidence_score": 0.0–1.0,
    "insight_type": "macro" | "equity" | "sector" | "sentiment",
    "key_factors": ["faktor1", "faktor2"]
  }
]

Regler:
- Inga rubriker, markdown eller extra text
- Inget prat före eller efter – endast ren JSON
- Allt ska vara på svenska
- Kort, tydligt, strukturerat
`
      },
      {
        role: 'user',
        content: `
Generera personliga ${type}-insikter för en användare med:

- Riskprofil: ${userContext.riskTolerance}
- Investeringshorisont: ${userContext.investmentHorizon}
- Portföljvärde: ${userContext.portfolioValue} SEK
- Sektorintressen: ${userContext.sectors.join(', ')}
- Innehav:
${userContext.currentHoldings.map(h => `  - ${h.symbol} (${h.sector}, ${h.value} SEK)`).join('\n')}

Fokusera på:
- Risker i innehaven
- Möjligheter till bättre diversifiering
- Sektorer att över- eller undervikta
- Aktuella trender som påverkar innehaven

Svara med endast JSON enligt systemprompt. Max 3 insikter.`
      }
    ],
    temperature: 0.6,
    max_tokens: 900,
  }),
});

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return await generateAIMockInsights(type, true);
    }

    const content = data.choices[0].message.content;
    
    try {
      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights : await generateAIMockInsights(type, true);
    } catch (parseError) {
      console.error('Error parsing AI insights:', parseError);
      return await generateAIMockInsights(type, true);
    }
  } catch (error) {
    console.error('Error generating personalized insights:', error);
    return await generateAIMockInsights(type, true);
  }
}

async function generateGeneralInsights(type: string) {
  if (!openAIApiKey) {
    console.warn('OpenAI API key not found, generating AI-powered mock insights');
    return await generateAIMockInsights(type, false);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `
Du är en professionell marknadsanalytiker.

Generera endast en ren JSON-array med 3–4 aktuella marknadsinsikter enligt följande struktur:

[
  {
    "id": "unik-insight-id",
    "title": "Kort rubrik på svenska",
    "content": "Koncis analys, max 40 ord",
    "confidence_score": 0.0–1.0,
    "insight_type": "macro" | "equity" | "sector" | "geopolitical" | "sentiment",
    "key_factors": ["faktor1", "faktor2"]
  }
]

Viktigt:
- Inga markdown-symboler
- Ingen text utanför JSON
- Kort, konkret, aktuell analys på svenska
            `.trim()
          },
          {
            role: 'user',
            content: `
Skapa insikter inom området: ${type}.

Fokusera på:
- AI och tekniksektorns utveckling
- Centralbanker (Fed, ECB, Riksbank)
- Geopolitiska risker
- Sektorrotation och värderingar
- Makrotrender som påverkar svenska investerare
- ESG och hållbarhet

Endast 3–4 insikter. På svenska. Svara enbart med JSON-array enligt formatet ovan.
            `.trim()
          }
        ],
        temperature: 0.6,
        max_tokens: 900,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return await generateAIMockInsights(type, false);
    }

    const content = data.choices?.[0]?.message?.content || '';
    try {
      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights : await generateAIMockInsights(type, false);
    } catch (parseError) {
      console.error('Error parsing general insights JSON:', parseError, '\nGPT response:', content);
      return await generateAIMockInsights(type, false);
    }
  } catch (error) {
    console.error('Error generating general insights:', error);
    return await generateAIMockInsights(type, false);
  }
}

async function generateAIMockInsights(type: string, isPersonalized: boolean) {
  if (!openAIApiKey) {
    console.warn('OpenAI API key not available, using static fallback');
    return [
      {
        id: '1',
        title: 'AI-sektorn redo för genombrott 2025',
        content: 'Teknologijättarna fortsätter investera massivt i AI-infrastruktur. NVIDIA:s nya chip-generation väntas driva nästa våg av AI-innovation.',
        confidence_score: 0.85,
        insight_type: type,
        key_factors: ['Chip-efterfrågan', 'Enterprise AI-adoption', 'Regulatorisk miljö']
      },
      {
        id: '2',
        title: 'Svenska exportföretag gynnas av svag krona',
        content: 'Den svenska kronans svaghet ger exportföretag som Volvo, ABB och Ericsson konkurransfördelar på globala marknader.',
        confidence_score: 0.78,
        insight_type: type,
        key_factors: ['Valutakurser', 'Export-konkurrenskraft', 'Global efterfrågan']
      },
      {
        id: '3',
        title: 'Defensiva sektorer attraktiva vid volatilitet',
        content: 'Utilities och konsumentvaror erbjuder stabilitet när marknadsvolatiliteten ökar inför det nya året.',
        confidence_score: 0.72,
        insight_type: type,
        key_factors: ['Marknadsvolatilitet', 'Defensiv positionering', 'Dividendutbetalningar']
      }
    ];
  }

  try {
    const prompt = isPersonalized 
      ? `Generera 3-4 personaliserade ${type} marknadsinsikter för svenska investerare med fokus på praktiska råd och rekommendationer.`
      : `Generera 4-5 allmänna ${type} marknadsinsikter för svenska och globala marknader med fokus på aktuella trender och möjligheter.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Du är en marknadsanalytiker. Skapa marknadsinsikter och formatera som JSON array med objekt: id, title, content, confidence_score (0-1), insight_type, key_factors (array).`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const insights = JSON.parse(content);
    return Array.isArray(insights) ? insights : [
      {
        id: '1',
        title: 'AI-genererade insikter tillgängliga',
        content: 'Marknadsinsikter genereras nu med AI för bättre precision och relevans.',
        confidence_score: 0.9,
        insight_type: type,
        key_factors: ['AI-analys', 'Realtidsdata']
      }
    ];
  } catch (error) {
    console.error('Error generating AI mock insights:', error);
    return [
      {
        id: '1',
        title: 'Fallback marknadsinsikter',
        content: 'AI-tjänsten är temporärt otillgänglig, men marknadsövervakning fortsätter.',
        confidence_score: 0.5,
        insight_type: type,
        key_factors: ['Teknisk begränsning']
      }
    ];
  }
}
