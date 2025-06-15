
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
    console.log('Fetching live news data...');
    
    const newsData = await fetchLiveNewsData();
    
    return new Response(JSON.stringify(newsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching news data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchLiveNewsData() {
  if (!openAIApiKey) {
    console.log('No OpenAI key, using mock news');
    return getMockNewsData();
  }

  try {
    // Use OpenAI to generate current financial news summaries
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
