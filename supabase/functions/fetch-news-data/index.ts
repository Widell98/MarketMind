
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
            content: 'Du är en finansiell kalenderexpert. Generera realistiska finansiella händelser för den kommande veckan i Sverige och globalt. Inkludera företagsrapporter, ekonomisk data, centralbanksbeslut, och andra viktiga finansiella händelser. Formatera som JSON array med id, time, title, description, importance (high/medium/low), category (earnings/economic/dividend/other), company (optional), date (YYYY-MM-DD format), och dayOfWeek.'
          },
          {
            role: 'user',
            content: `Generera finansiella kalenderhändelser för veckan som börjar ${new Date().toLocaleDateString('sv-SE')}. Inkludera svenska företag som H&M, Ericsson, Volvo, SEB, Nordea, Atlas Copco, samt internationella händelser som påverkar svenska marknader.`
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
            content: 'You are a financial news analyst. Generate 6-8 realistic current financial news headlines and summaries. Include mix of macro, tech, earnings, commodities, and global categories. Format as JSON array with id, headline, summary, category, source, publishedAt, and url fields.'
          },
          {
            role: 'user',
            content: `Generate current financial news for ${new Date().toLocaleDateString('sv-SE')}. Make them realistic and relevant to today's market conditions.`
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
        category: 'economic',
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayName
      });
    }
  }
  
  return thisWeek;
}

function getMockNewsData() {
  const now = new Date();
  return [
    {
      id: 'news_1',
      headline: 'Fed Signals Potential Rate Cuts as Inflation Moderates',
      summary: 'Federal Reserve officials hint at possible interest rate reductions following latest inflation data showing continued moderation in price pressures.',
      category: 'macro',
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_2',
      headline: 'Tech Stocks Rally on AI Chip Demand Surge',
      summary: 'Semiconductor companies see significant gains as artificial intelligence applications drive unprecedented demand for specialized chips.',
      category: 'tech',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_3',
      headline: 'Oil Prices Climb on OPEC Production Cuts',
      summary: 'Crude oil futures rise sharply following OPEC+ decision to extend production cuts through the second quarter.',
      category: 'commodities',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_4',
      headline: 'Major Bank Reports Strong Q4 Earnings',
      summary: 'Leading financial institution beats analyst expectations with robust quarterly results driven by improved credit conditions.',
      category: 'earnings',
      source: 'Wall Street Journal',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      url: '#'
    },
    {
      id: 'news_5',
      headline: 'European Markets React to ECB Policy Update',
      summary: 'European Central Bank maintains current rates while signaling data-dependent approach for future monetary policy decisions.',
      category: 'global',
      source: 'Financial News',
      publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      url: '#'
    }
  ];
}
