
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

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
    const { type = 'news' } = await req.json();
    console.log(`Fetching ${type} data with smart caching...`);
    
    let data;
    if (type === 'calendar') {
      data = await fetchFinancialCalendarWithCache();
    } else if (type === 'momentum') {
      data = await fetchMarketMomentumWithCache();
    } else {
      data = await fetchLiveNewsData();
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error fetching data:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchFinancialCalendarWithCache() {
  const cacheKey = `calendar_${new Date().toISOString().split('T')[0]}`;
  
  // Försök hämta från cache först
  const { data: cachedData } = await supabase
    .from('financial_calendar_cache')
    .select('data, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cachedData && new Date(cachedData.expires_at) > new Date()) {
    console.log('Returning cached calendar data');
    return cachedData.data;
  }

  // Om ingen cache eller utgången, hämta ny data
  const freshData = await fetchFinancialCalendarData();
  
  // Spara i cache (gäller till midnatt nästa dag)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  await supabase
    .from('financial_calendar_cache')
    .upsert({
      cache_key: cacheKey,
      data: freshData,
      expires_at: expiresAt.toISOString()
    });

  return freshData;
}

async function fetchMarketMomentumWithCache() {
  const cacheKey = `momentum_${new Date().toISOString().split('T')[0]}_${Math.floor(Date.now() / (4 * 60 * 60 * 1000))}`;
  
  // Försök hämta från cache (uppdateras var 4:e timme)
  const { data: cachedData } = await supabase
    .from('market_momentum_cache')
    .select('data, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cachedData && new Date(cachedData.expires_at) > new Date()) {
    console.log('Returning cached momentum data');
    return cachedData.data;
  }

  const freshData = await fetchMarketMomentumData();
  
  // Cache gäller i 4 timmar
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

  await supabase
    .from('market_momentum_cache')
    .upsert({
      cache_key: cacheKey,
      data: freshData,
      expires_at: expiresAt.toISOString()
    });

  return freshData;
}

async function fetchFinancialCalendarData() {
  if (!openAIApiKey) {
    console.log('No OpenAI key, using mock calendar data');
    return getMockCalendarData();
  }

  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
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
            content: 'Du är en finansiell kalenderexpert. Generera aktuella och realistiska finansiella händelser baserat på verkliga marknadsförhållanden och aktuella ekonomiska trender. Inkludera svenska och internationella händelser som påverkar finansmarknaderna. Formatera som JSON array med id, time, title, description, importance (high/medium/low), category (earnings/economic/dividend/central_bank/announcement/other), company (optional), date (YYYY-MM-DD format), och dayOfWeek (på svenska).'
          },
          {
            role: 'user',
            content: `Skapa en realistisk finansiell kalender för perioden ${today.toLocaleDateString('sv-SE')} till ${nextWeek.toLocaleDateString('sv-SE')}. Basera på verkliga marknadsförhållanden December 2024/Januari 2025. Inkludera:
            
            SVENSKA HÄNDELSER:
            - Riksbankens räntebesked och inflationsdata
            - Kvartalsrapporter från svenska storbolag
            - Ekonomisk statistik från SCB
            - Utdelningsannonsering
            
            INTERNATIONELLA HÄNDELSER:
            - Fed:s räntebeslut och makrodata från USA
            - ECB:s penningpolitik
            - Kvartalsrapporter från stora tech- och finansbolag
            - Centralbanksbesked
            - Viktig ekonomisk data som påverkar svenska marknader
            - Stora eknomiska händelser
    
            
            Gör händelserna trovärdiga och relevanta för nuvarande marknadssituation och årstid.`
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 2000,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const calendarItems = JSON.parse(content);
      return Array.isArray(calendarItems) ? calendarItems : getMockCalendarData();
    } catch (parseError) {
      console.error('Error parsing AI calendar response:', parseError);
      return getMockCalendarData();
    }
  } catch (error) {
    console.error('Error calling OpenAI for calendar:', error);
    return getMockCalendarData();
  }
}

async function fetchMarketMomentumData() {
  if (!openAIApiKey) {
    console.log('No OpenAI key, using mock momentum data');
    return getMockMomentumData();
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
            content: 'Du är en erfaren marknadsanalytiker. Generera aktuell marknadsmomentum-data baserat på verkliga trender och marknadsförhållanden för svenska och globala marknader. Fokusera på realistiska och aktuella trender. Formatera som JSON array med id, title, description, trend (up/down/neutral), change (procentuell förändring med + eller -), timeframe, och sentiment (bullish/bearish/positive/stable/neutral).'
          },
          {
            role: 'user',
            content: `Analysera aktuellt marknadsmomentum för ${new Date().toLocaleDateString('sv-SE')} baserat på verkliga marknadsförhållanden slutet av 2024/början av 2025. Inkludera:
            
            - AI och teknologisektorn (NVIDIA, Microsoft, Google, svenska tech)
            - Centralbankspolitik (Fed, ECB, Riksbanken)
            - Geopolitiska faktorer och deras marknadsimpakt
            - Sektorrotation mellan tech, finans, råvaror, hälsovård
            - Institutionellt flöde och volymanalys
            - Volatilitet och risksentiment (VIX-nivåer)
            - Emerging markets vs utvecklade marknader
            - Svenska specifika faktorer (kronkurs, export, råvaror)
            - ESG och hållbarhetsinvesteringar
            - Räntekänslighet och obligationsmarknaden
            - Stora eknomiska händelser
            
            Skapa 6-8 trovärdiga momentumtrender med realistiska procenttal och tidsramar.`
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 2500,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const momentumItems = JSON.parse(content);
      return Array.isArray(momentumItems) ? momentumItems : getMockMomentumData();
    } catch (parseError) {
      console.error('Error parsing AI momentum response:', parseError);
      return getMockMomentumData();
    }
  } catch (error) {
    console.error('Error calling OpenAI for momentum:', error);
    return getMockMomentumData();
  }
}

async function fetchLiveNewsData() {
  if (!openAIApiKey) {
    console.log('No OpenAI key, using mock news');
    return getMockNewsData();
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
            content: 'Du är en finansiell nyhetsanalytiker. Generera aktuella och realistiska finansiella nyheter baserat på verkliga marknadsförhållanden för slutet av 2024/början av 2025. Inkludera svenska och internationella nyheter. Formatera som JSON array med id, headline, summary, category (macro/tech/earnings/commodities/global/sweden), source, publishedAt (ISO format), och url (använd # som placeholder).'
          },
          {
            role: 'user',
            content: `Skapa 8-10 aktuella finansiella nyheter för ${new Date().toLocaleDateString('sv-SE')} baserat på verkliga marknadsförhållanden. Inkludera:
            
            SVENSKA NYHETER:
            - Utveckling för svenska storbolag och Stockholmsbörsen
            - Riksbankens politik och svenska ekonomin
            - Bostadsmarknaden och ränteutveckling
            - Svenska exportföretag och kronkursen
            
            INTERNATIONELLA NYHETER:
            - Fed och amerikansk ekonomi
            - AI-sektorn och teknikjättar
            - Geopolitiska händelser med marknadsimpakt
            - Europeiska marknader och ECB
            - Råvarumarknader och energi
            - Kryptovalutor och digitala tillgångar
            - Stora eknomiska händelser
            
            Gör nyheterna trovärdiga, relevanta och intressanta för svenska investerare.`
          }
        ],
        temperature: 0.8,
        max_completion_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const newsItems = JSON.parse(content);
      return Array.isArray(newsItems) ? newsItems : getMockNewsData();
    } catch (parseError) {
      console.error('Error parsing AI news response:', parseError);
      return getMockNewsData();
    }
  } catch (error) {
    console.error('Error calling OpenAI for news:', error);
    return getMockNewsData();
  }
}

function getMockCalendarData() {
  const today = new Date();
  const thisWeek = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    
    if (i === 0) {
      thisWeek.push({
        id: `cal_${i}_1`,
        time: '08:30',
        title: 'Inflationsdata (KPI)',
        description: 'Månatlig konsumentprisindex från SCB',
        importance: 'high',
        category: 'economic',
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayName
      });
    } else if (i === 1) {
      thisWeek.push({
        id: `cal_${i}_1`,
        time: '09:00',
        title: 'H&M Q4 Rapport',
        description: 'Kvartalsrapport från H&M',
        importance: 'medium',
        category: 'earnings',
        company: 'H&M',
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayName
      });
    } else if (i === 2) {
      thisWeek.push({
        id: `cal_${i}_1`,
        time: '14:30',
        title: 'Riksbankens Beslut',
        description: 'Räntebeslut från Sveriges Riksbank',
        importance: 'high',
        category: 'central_bank',
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayName
      });
    }
  }
  
  return thisWeek;
}

function getMockMomentumData() {
  return [
    {
      id: '1',
      title: 'AI-sektorn accelererar',
      description: 'NVIDIA och Microsoft driver teknikrallyt med nya AI-genombrott',
      trend: 'up',
      change: '+4.2%',
      timeframe: '24h',
      sentiment: 'bullish'
    },
    {
      id: '2',
      title: 'Institutionellt inflöde',
      description: 'Pensionsfonder och hedgefonder ökar aktieexponeringen inför nyåret',
      trend: 'up',
      change: '+22%',
      timeframe: 'Vecka',
      sentiment: 'positive'
    },
    {
      id: '3',
      title: 'Ränteoroshet avtar',
      description: 'Marknadens förväntningar på Fed-sänkningar stabiliseras',
      trend: 'neutral',
      change: '-0.8%',
      timeframe: 'Månad',
      sentiment: 'stable'
    },
    {
      id: '4',
      title: 'Råvarusektorn under press',
      description: 'Kina-oro och stark dollar påverkar råvarupriser negativt',
      trend: 'down',
      change: '-3.1%',
      timeframe: '3 dagar',
      sentiment: 'bearish'
    }
  ];
}

function getMockNewsData() {
  const now = new Date();
  return [
    {
      id: 'news_1',
      headline: 'Riksbanken överväger ytterligare räntesänkning i januari',
      summary: 'Sveriges Riksbank signalerar möjliga räntesänkningar på 0,25% i januari baserat på fallande inflation.',
      category: 'sweden',
      source: 'Svenska Dagbladet',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_2',
      headline: 'Svenska AI-bolag attraherar rekordinvesteringar',
      summary: 'Venture capital-investeringar i svenska AI-startups når nya höjder under Q4 2024.',
      category: 'tech',
      source: 'Dagens Industri',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_3',
      headline: 'Oljepriset stiger på geopolitisk oro',
      summary: 'Brent-oljan klättrar över $80/fat efter spänningar i Mellanöstern påverkar leveranser.',
      category: 'commodities',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_4',
      headline: 'Fed håller räntorna stabila inför årsskiftet',
      summary: 'Federal Reserve behåller styrräntan men öppnar för flexibilitet baserat på inflationsdata.',
      category: 'macro',
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_5',
      headline: 'Volvo rapporterar stark efterfrågan på elbilar',
      summary: 'Volvo Cars överträffar förväntningarna med 35% ökning av elbilsförsäljning i Q4.',
      category: 'earnings',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      url: '#'
    }
  ];
}
