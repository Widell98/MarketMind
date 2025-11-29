
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

type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
};

type NewsDigestSummary = {
  id: string;
  headline: string;
  overview: string;
  keyHighlights: string[];
  focusToday: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  generatedAt: string;
  digestHash: string;
};

type BroadcastOptions = {
  type?: string;
  broadcastSummary?: boolean;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestOptions: BroadcastOptions = {};
    try {
      requestOptions = await req.json();
    } catch {
      requestOptions = {};
    }

    const { type = 'news', broadcastSummary = true } = requestOptions ?? {};
    console.log(`Fetching ${type} data with smart caching...`);
    
    let data;
    if (type === 'calendar') {
      data = await fetchFinancialCalendarWithCache();
    } else if (type === 'momentum') {
      data = await fetchMarketMomentumWithCache();
    } else {
      const newsItems = await fetchLiveNewsData() as NewsItem[];
      let summaryPayload: Omit<NewsDigestSummary, 'digestHash'> | null = null;

      try {
        const digestHash = await computeNewsDigestHash(newsItems);
        const summary = await generateNewsDigestSummary(newsItems, digestHash);
        await persistNewsDigestSummary(summary, broadcastSummary);
        summaryPayload = serializeNewsDigestSummary(summary);
      } catch (summaryError) {
        console.error('Failed to generate or distribute news digest summary:', summaryError);
      }

      data = {
        news: newsItems,
        summary: summaryPayload,
      };
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
        max_tokens: 2000,
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
        max_tokens: 2500,
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
        max_tokens: 3000,
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

const textEncoder = new TextEncoder();
const DIGEST_INSIGHT_TYPE = 'news_digest';
const DIGEST_BROADCAST_CHUNK_SIZE = 25;
const DEFAULT_FOCUS_TOPICS = ['Makro', 'Teknik', 'Sverige'];
const DEFAULT_DIGEST_SENTIMENT: NewsDigestSummary['sentiment'] = 'neutral';

function serializeNewsDigestSummary(summary: NewsDigestSummary | null): Omit<NewsDigestSummary, 'digestHash'> | null {
  if (!summary) {
    return null;
  }

  const { digestHash: _digestHash, ...rest } = summary;
  return rest;
}

async function computeNewsDigestHash(newsItems: NewsItem[]): Promise<string> {
  const digestSource = newsItems.length
    ? newsItems
        .slice(0, 10)
        .map((item) => `${item.headline}|${item.summary}|${item.category}|${item.source}`)
        .join('\n')
    : `empty_${new Date().toISOString()}`;

  const hashBuffer = await crypto.subtle.digest('SHA-256', textEncoder.encode(digestSource));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(/\n|•|-/)
      .map((entry) => entry.replace(/^\s*[-•]\s*/, '').trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function formatCategoryLabel(category: string | undefined): string {
  if (!category) {
    return 'Marknad';
  }

  const normalized = category.toLowerCase();
  switch (normalized) {
    case 'macro':
      return 'Makro';
    case 'tech':
      return 'Teknik';
    case 'earnings':
      return 'Rapporter';
    case 'commodities':
      return 'Råvaror';
    case 'sweden':
      return 'Sverige';
    case 'global':
      return 'Globalt';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

function pickFocusTopics(newsItems: NewsItem[]): string[] {
  const uniqueCategories = Array.from(
    new Set(
      newsItems
        .map((item) => item.category)
        .filter((category): category is string => typeof category === 'string' && category.trim().length > 0),
    ),
  );

  if (uniqueCategories.length === 0) {
    return DEFAULT_FOCUS_TOPICS;
  }

  return uniqueCategories.slice(0, 3).map((category) => formatCategoryLabel(category));
}

function buildFallbackHighlights(newsItems: NewsItem[]): string[] {
  if (!newsItems.length) {
    return [
      'Marknaden höll sig relativt lugn men investerare följer centralbankernas nästa steg.',
      'Teknik- och energisektorn fortsätter att styra sentimentet inför kommande rapporter.',
    ];
  }

  return newsItems.slice(0, 4).map((item) => `${item.headline} – ${item.summary}`);
}

function buildFallbackOverview(newsItems: NewsItem[]): string {
  if (!newsItems.length) {
    return 'Marknaden bevakade övergripande makrohändelser samtidigt som fokus låg på centralbankernas vägval och rapportsäsongens fortsättning.';
  }

  const primary = newsItems[0];
  const secondary = newsItems[1];
  const parts = [`${primary.source}: ${primary.summary}`];

  if (secondary) {
    parts.push(`Dessutom: ${secondary.summary}`);
  }

  return parts.join(' ');
}

function deriveSentimentFromNews(newsItems: NewsItem[]): NewsDigestSummary['sentiment'] {
  if (!newsItems.length) {
    return DEFAULT_DIGEST_SENTIMENT;
  }

  const categoryWeights = newsItems.reduce(
    (acc, item) => {
      const normalizedSummary = item.summary.toLowerCase();
      if (/(stiger|rekord|lyfte|växte|expansion|tillväxt)/.test(normalizedSummary)) {
        acc.bullish += 1;
      }
      if (/(faller|oro|press|nedgång|sänker|brist|osäker)/.test(normalizedSummary)) {
        acc.bearish += 1;
      }
      return acc;
    },
    { bullish: 0, bearish: 0 },
  );

  if (categoryWeights.bullish > categoryWeights.bearish) {
    return 'bullish';
  }

  if (categoryWeights.bearish > categoryWeights.bullish) {
    return 'bearish';
  }

  return DEFAULT_DIGEST_SENTIMENT;
}

function buildFallbackDigestSummary(newsItems: NewsItem[], digestHash: string): NewsDigestSummary {
  const generatedAt = new Date().toISOString();
  const keyHighlights = buildFallbackHighlights(newsItems);

  return {
    id: `digest_${digestHash.slice(0, 12)}`,
    headline: newsItems[0]?.headline ?? 'Marknaden i fokus',
    overview: buildFallbackOverview(newsItems),
    keyHighlights,
    focusToday: pickFocusTopics(newsItems),
    sentiment: deriveSentimentFromNews(newsItems),
    generatedAt,
    digestHash,
  };
}

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

async function generateNewsDigestSummary(newsItems: NewsItem[], digestHash: string): Promise<NewsDigestSummary> {
  if (!openAIApiKey) {
    console.warn('Missing OPENAI_API_KEY for digest summary, using fallback content.');
    return buildFallbackDigestSummary(newsItems, digestHash);
  }

  try {
    const newsContext = newsItems
      .slice(0, 10)
      .map((item, index) => {
        const published = item.publishedAt ? `(${item.publishedAt})` : '';
        return `${index + 1}. ${item.headline} ${published} – ${item.summary}`;
      })
      .join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content:
              'Du är en svensk finansredaktör som skriver morgonbrev. Svara alltid med giltig JSON utan text före eller efter.',
          },
          {
            role: 'user',
            content: `Sammanfatta gårdagens viktigaste finansiella nyheter på svenska och skapa ett kort morgonbrev.
Returnera JSON med följande struktur:
{
  "id": "unik-sträng",
  "headline": "Kort huvudrubrik",
  "overview": "2–3 meningar som sammanfattar marknadsläget",
  "key_highlights": ["bullet 1", "bullet 2"],
  "focus_today": ["tema 1", "tema 2"],
  "sentiment": "bullish|bearish|neutral",
  "generated_at": "ISO-tidpunkt"
}

Nyhetsunderlag:
${newsContext || 'Inga nyheter tillgängliga – håll det generellt.'}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI digest request failed:', errorText);
      return buildFallbackDigestSummary(newsItems, digestHash);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      console.warn('OpenAI digest response missing content, using fallback.');
      return buildFallbackDigestSummary(newsItems, digestHash);
    }

    const normalizedPayload = extractJsonPayload(rawContent);
    const parsed = JSON.parse(normalizedPayload) as Record<string, unknown>;

    const keyHighlights = normalizeStringArray(parsed.key_highlights ?? parsed.highlights ?? parsed.keyHighlights);
    const focusToday = normalizeStringArray(parsed.focus_today ?? parsed.watchlist ?? parsed.focus);
    const overviewText =
      typeof parsed.overview === 'string' && parsed.overview.trim()
        ? parsed.overview.trim()
        : typeof parsed.summary === 'string'
          ? parsed.summary.trim()
          : null;

    return {
      id:
        typeof parsed.id === 'string' && parsed.id.trim().length > 0
          ? parsed.id.trim()
          : `digest_${digestHash.slice(0, 12)}`,
      headline:
        typeof parsed.headline === 'string' && parsed.headline.trim().length > 0
          ? parsed.headline.trim()
          : newsItems[0]?.headline ?? 'Marknaden i fokus',
      overview: overviewText ?? buildFallbackOverview(newsItems),
      keyHighlights: keyHighlights.length > 0 ? keyHighlights : buildFallbackHighlights(newsItems),
      focusToday: focusToday.length > 0 ? focusToday : pickFocusTopics(newsItems),
      sentiment:
        typeof parsed.sentiment === 'string'
          ? (['bullish', 'bearish', 'neutral'].includes(parsed.sentiment.toLowerCase())
              ? (parsed.sentiment.toLowerCase() as NewsDigestSummary['sentiment'])
              : deriveSentimentFromNews(newsItems))
          : deriveSentimentFromNews(newsItems),
      generatedAt:
        typeof parsed.generated_at === 'string' && parsed.generated_at.trim().length > 0
          ? parsed.generated_at
          : new Date().toISOString(),
      digestHash,
    };
  } catch (error) {
    console.error('Failed to generate AI-based news digest summary:', error);
    return buildFallbackDigestSummary(newsItems, digestHash);
  }
}

async function fetchLatestDigestHash(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_insights_cache')
      .select('insights_data')
      .eq('insight_type', DIGEST_INSIGHT_TYPE)
      .eq('is_personalized', false)
      .is('user_id', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Unable to fetch existing digest hash:', error);
      return null;
    }

    const insightsData = data?.insights_data;
    if (Array.isArray(insightsData) && insightsData.length > 0) {
      const metadata = (insightsData[0] as Record<string, any>)?.metadata;
      if (metadata && typeof metadata.digest_hash === 'string') {
        return metadata.digest_hash;
      }
    }
  } catch (error) {
    console.warn('Unexpected error when reading digest hash:', error);
  }

  return null;
}

function buildDigestInsightPayload(summary: NewsDigestSummary) {
  return {
    id: summary.id,
    title: summary.headline,
    content: summary.overview,
    confidence_score: 0.72,
    insight_type: DIGEST_INSIGHT_TYPE,
    key_factors: summary.keyHighlights.slice(0, 5),
    metadata: {
      digest_hash: summary.digestHash,
      focus_today: summary.focusToday,
      sentiment: summary.sentiment,
      generated_at: summary.generatedAt,
    },
  };
}

async function upsertGlobalDigest(summary: NewsDigestSummary, digestInsight: Record<string, unknown>) {
  const expiresAt = new Date(summary.generatedAt);
  expiresAt.setDate(expiresAt.getDate() + 1);

  const { error } = await supabase
    .from('ai_insights_cache')
    .upsert(
      {
        user_id: null,
        insight_type: DIGEST_INSIGHT_TYPE,
        is_personalized: false,
        insights_data: [digestInsight],
        updated_at: summary.generatedAt,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'user_id,insight_type,is_personalized',
      },
    );

  if (error) {
    throw error;
  }
}

async function broadcastDigestToUsers(summary: NewsDigestSummary, digestInsight: Record<string, unknown>) {
  try {
    const { data: profiles, error } = await supabase.from('profiles').select('id');
    if (error) {
      console.error('Failed to fetch profiles for digest broadcast:', error);
      return;
    }

    const userIds =
      profiles
        ?.map((profile) => profile.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? [];

    if (userIds.length === 0) {
      console.log('No users found for news digest broadcast.');
      return;
    }

    for (let i = 0; i < userIds.length; i += DIGEST_BROADCAST_CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + DIGEST_BROADCAST_CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (userId) => {
          const { error: upsertError } = await supabase
            .from('user_ai_insights')
            .upsert(
              {
                user_id: userId,
                insight_type: DIGEST_INSIGHT_TYPE,
                is_personalized: false,
                insights_data: [digestInsight],
                updated_at: summary.generatedAt,
              },
              {
                onConflict: 'user_id,insight_type,is_personalized',
              },
            );

          if (upsertError) {
            console.error(`Failed to upsert news digest for user ${userId}`, upsertError);
          }
        }),
      );
    }

    console.log(`Broadcasted news digest summary to ${userIds.length} användare.`);
  } catch (error) {
    console.error('Unexpected error while broadcasting news digest:', error);
  }
}

async function persistNewsDigestSummary(summary: NewsDigestSummary, shouldBroadcast: boolean) {
  if (!summary) {
    return;
  }

  const latestHash = await fetchLatestDigestHash();
  if (latestHash === summary.digestHash) {
    console.log('News digest already up-to-date; skipping persistence.');
    return;
  }

  const digestInsight = buildDigestInsightPayload(summary);

  try {
    await upsertGlobalDigest(summary, digestInsight);
  } catch (error) {
    console.error('Failed to upsert global digest cache:', error);
    return;
  }

  if (!shouldBroadcast) {
    console.log('Skipping digest broadcast (disabled by request option).');
    return;
  }

  await broadcastDigestToUsers(summary, digestInsight);
}
