
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dataType = url.searchParams.get('type') || 'news';
    
    console.log(`Fetching ${dataType} data...`);
    
    let data;
    if (dataType === 'calendar') {
      data = await fetchFinancialCalendarData();
    } else if (dataType === 'momentum') {
      data = await fetchMarketMomentumData();
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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Du är en finansiell kalenderexpert. Generera aktuella och realistiska finansiella händelser baserat på verkliga marknadsförhållanden och aktuella ekonomiska trender. Inkludera svenska och internationella händelser som påverkar finansmarknaderna. Formatera som JSON array med id, time, title, description, importance (high/medium/low), category (earnings/economic/dividend/central_bank/announcement/other), company (optional), date (YYYY-MM-DD format), och dayOfWeek (på svenska).'
          },
          {
            role: 'user',
            content: `Skapa en finansiell kalender för perioden ${today.toLocaleDateString('sv-SE')} till ${nextWeek.toLocaleDateString('sv-SE')}. Basera på aktuella marknadsförhållanden och inkludera:
            
            SVENSKA HÄNDELSER:
            - Riksbankens räntebesked och inflationsdata
            - Kvartalsrapporter från svenska storbolag (H&M, Ericsson, Volvo, SEB, Nordea, Atlas Copco, SKF, Sandvik)
            - Ekonomisk statistik från SCB
            - Utdelningsannonsering från svenska bolag
            
            INTERNATIONELLA HÄNDELSER:
            - Fed:s räntebeslut och makrodata från USA
            - ECB:s penningpolitik
            - Kvartalsrapporter från stora tech- och finansbolag
            - Centralbanksbesked från England, Japan
            - Viktig ekonomisk data som påverkar svenska marknader
            
            Gör händelserna trovärdiga och relevanta för aktuell marknadssituation. Variera betydelsen mellan high, medium och low baserat på händelsens påverkan på svenska marknader.`
          }
        ],
        temperature: 0.7,
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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Du är en marknadsanalytiker. Generera aktuell marknadsmomentum-data baserat på verkliga trender och marknadsförhållanden. Fokusera på svenska och globala marknader. Formatera som JSON array med id, title, description, trend (up/down/neutral), change (procentuell förändring), timeframe, och sentiment.'
          },
          {
            role: 'user',
            content: `Analysera nuvarande marknadsmomentum för ${new Date().toLocaleDateString('sv-SE')}. Inkludera:
            
            - Sektorrotation och trender (tech, finans, råvaror, hälsovård)
            - Institutionellt flöde och volymtrender
            - Volatilitet och risksentiment
            - Geopolitiska faktorer som påverkar marknaden
            - Centralbankers påverkan på likviditet
            - AI och teknologitrender
            - Hållbarhetsinvesteringar och ESG-trender
            - Emerging markets vs utvecklade marknader
            
            Gör analysen aktuell och relevant för svenska investerare. Inkludera både positiva och negativa trender.`
          }
        ],
        temperature: 0.7,
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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Du är en finansiell nyhetsanalytiker. Generera aktuella och realistiska finansiella nyheter baserat på verkliga marknadsförhållanden. Inkludera svenska och internationella nyheter. Formatera som JSON array med id, headline, summary, category (macro/tech/earnings/commodities/global/sweden), source, publishedAt, och url.'
          },
          {
            role: 'user',
            content: `Skapa aktuella finansiella nyheter för ${new Date().toLocaleDateString('sv-SE')}. Inkludera:
            
            SVENSKA NYHETER:
            - Utveckling för svenska storbolag och börsen
            - Riksbankens politik och svenska ekonomin
            - Bostadsmarknaden och ränteutveckling
            
            INTERNATIONELLA NYHETER:
            - Fed och amerikansk ekonomi
            - Geopolitiska händelser som påverkar marknader
            - Tech-sektorn och AI-utveckling
            - Råvarumarknader och energi
            - Europeiska marknader och ECB
            
            Gör nyheterna trovärdiga och relevanta för svenska investerare.`
          }
        ],
        temperature: 0.7,
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
      title: 'Tech-sektorn stärks',
      description: 'AI-relaterade investeringar driver uppgång',
      trend: 'up',
      change: '+3.2%',
      timeframe: '24h',
      sentiment: 'bullish'
    },
    {
      id: '2',
      title: 'Institutionellt inflöde',
      description: 'Pensionsfonder ökar aktieexponering',
      trend: 'up',
      change: '+18%',
      timeframe: 'Vecka',
      sentiment: 'positive'
    },
    {
      id: '3',
      title: 'Volatilitet normaliseras',
      description: 'VIX sjunker till normala nivåer',
      trend: 'neutral',
      change: '-12%',
      timeframe: 'Månad',
      sentiment: 'stable'
    },
    {
      id: '4',
      title: 'Råvarusektorn pressad',
      description: 'Kina-oro skapar osäkerhet',
      trend: 'down',
      change: '-2.8%',
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
      headline: 'Riksbanken signalerar försiktig räntesänkning',
      summary: 'Sveriges Riksbank indikerar möjliga räntesänkningar under 2024 beroende på inflationsutvecklingen.',
      category: 'sweden',
      source: 'Svenska Dagbladet',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_2',
      headline: 'AI-bolag driver tech-rally på Stockholmsbörsen',
      summary: 'Svenska tech-aktier stiger kraftigt efter stark utveckling inom artificiell intelligens.',
      category: 'tech',
      source: 'Dagens Industri',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_3',
      headline: 'Oljepriset stiger på OPEC-beslut',
      summary: 'Råoljepriset klättrar efter OPEC+:s beslut att förlänga produktionsnedskärningar.',
      category: 'commodities',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_4',
      headline: 'Fed håller räntorna oförändrade',
      summary: 'Federal Reserve behåller styrräntan men signalerar datadrivet förhållningssätt framöver.',
      category: 'macro',
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_5',
      headline: 'H&M överträffar förväntningarna',
      summary: 'Klädkedjan redovisar starkare kvartalsresultat än väntat drivet av förbättrad lönsamhet.',
      category: 'earnings',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      url: '#'
    }
  ];
}
