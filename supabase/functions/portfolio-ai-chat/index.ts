import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REALTIME_KEYWORDS = [
  'kväll',
  'kvällen',
  'kvällens',
  'ikväll',
  'senaste',
  'idag',
  'just nu',
  'aktuella',
  'uppdaterad',
  'uppdaterade',
  'nyligen',
  'latest',
  'current',
  'today',
  'recent',
  'rapport',
  'earnings',
  'resultat',
  'news',
  'rapporten',
  'report',
  'pris nu',
  'price now',
  'price today'
];

const EXCHANGE_RATES: Record<string, number> = {
  SEK: 1.0,
  USD: 10.5,
  EUR: 11.4,
  GBP: 13.2,
  NOK: 0.95,
  DKK: 1.53,
  JPY: 0.07,
  CHF: 11.8,
  CAD: 7.8,
  AUD: 7.0,
};

const convertToSEK = (amount: number, fromCurrency?: string | null): number => {
  if (!amount || amount === 0) return 0;

  const currency = typeof fromCurrency === 'string' && fromCurrency.trim().length > 0
    ? fromCurrency.trim().toUpperCase()
    : 'SEK';

  const rate = EXCHANGE_RATES[currency];

  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${currency}, defaulting to SEK`);
    return amount;
  }

  return amount * rate;
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeIdentifier = (value?: string | null): string | null => {
  if (!value) return null;

  const normalized = value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return normalized.length > 0 ? normalized : null;
};

const removeDiacritics = (value: string): string =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const escapeRegExp = (value: string): string =>
  value.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

type SheetTickerEdgeItem = {
  symbol?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

type SheetTickerEdgeResponse = {
  tickers?: SheetTickerEdgeItem[];
};

type HoldingRecord = {
  symbol?: string | null;
  name?: string | null;
  holding_type?: string | null;
  quantity?: number | string | null;
  current_price_per_unit?: number | string | null;
  price_currency?: string | null;
  currency?: string | null;
  current_value?: number | string | null;
};

type HoldingValueBreakdown = {
  quantity: number;
  pricePerUnit: number | null;
  priceCurrency: string;
  valueInOriginalCurrency: number;
  valueCurrency: string;
  valueInSEK: number;
  pricePerUnitInSEK: number | null;
  hasDirectPrice: boolean;
};

const resolveHoldingValue = (holding: HoldingRecord): HoldingValueBreakdown => {
  const quantity = parseNumericValue(holding?.quantity) ?? 0;

  const pricePerUnit = parseNumericValue(holding?.current_price_per_unit);
  const baseCurrencyRaw =
    typeof holding?.price_currency === 'string' && holding.price_currency.trim().length > 0
      ? holding.price_currency.trim().toUpperCase()
      : typeof holding?.currency === 'string' && holding.currency.trim().length > 0
        ? holding.currency.trim().toUpperCase()
        : 'SEK';

  const fallbackValue = parseNumericValue(holding?.current_value) ?? 0;
  const fallbackCurrency = baseCurrencyRaw;

  const hasDirectPrice = pricePerUnit !== null && quantity > 0;
  const rawValue = hasDirectPrice ? pricePerUnit * quantity : fallbackValue;
  const valueCurrency = hasDirectPrice ? baseCurrencyRaw : fallbackCurrency;
  const valueInSEK = convertToSEK(rawValue, valueCurrency);

  const pricePerUnitInSEK = pricePerUnit !== null
    ? convertToSEK(pricePerUnit, baseCurrencyRaw)
    : quantity > 0
      ? valueInSEK / quantity
      : null;

  return {
    quantity,
    pricePerUnit,
    priceCurrency: baseCurrencyRaw,
    valueInOriginalCurrency: rawValue,
    valueCurrency,
    valueInSEK,
    pricePerUnitInSEK,
    hasDirectPrice,
  };
};

const formatAllocationLabel = (label: string): string => {
  const normalized = label.replace(/_/g, ' ').trim();
  if (!normalized) return label;

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const requiresRealTimeSearch = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return REALTIME_KEYWORDS.some(keyword => normalized.includes(keyword));
};

type TavilySearchResult = {
  title?: string;
  content?: string;
  snippet?: string;
  url?: string;
  published_date?: string;
};

type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

type MorningBriefNewsItem = {
  id: number;
  title: string;
  snippet: string;
  url: string;
  publishedAt: string;
};

type MorningBriefItem = {
  id: number;
  headline: string;
  summary: string;
  reflection?: string;
  sourceUrl?: string;
  publishedAt?: string;
};

type MorningBriefPayload = {
  generatedAt: string;
  marketOverview?: string;
  portfolioHighlights?: string[];
  items: MorningBriefItem[];
};

type PortfolioSnapshot = {
  totalValueSEK: number;
  holdingsCount: number;
  topHoldings: {
    id: number;
    label: string;
    symbol: string | null;
    name: string | null;
    allocation: number;
    valueSEK: number;
  }[];
};

type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

const formatTavilyResults = (data: TavilySearchResponse | null): string => {
  if (!data) return '';

  const sections: string[] = [];

  if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
    sections.push(`Sammanfattning från realtidssökning: ${data.answer.trim()}`);
  }

  if (Array.isArray(data.results)) {
    const topResults = data.results.slice(0, 3);
    if (topResults.length > 0) {
      const resultLines = topResults.map((result: TavilySearchResult, index: number) => {
        const title = typeof result.title === 'string' ? result.title : `Resultat ${index + 1}`;
        const snippet = typeof result.content === 'string' ? result.content : result.snippet;
        const trimmedSnippet = typeof snippet === 'string' ? snippet.trim() : '';
        const url = typeof result.url === 'string' ? result.url : '';
        const publishedDate = typeof result.published_date === 'string' ? result.published_date : '';

        const parts = [`• ${title}`];
        if (publishedDate) {
          parts.push(`(${publishedDate})`);
        }
        if (trimmedSnippet) {
          parts.push(`- ${trimmedSnippet}`);
        }
        if (url) {
          parts.push(`Källa: ${url}`);
        }
        return parts.join(' ');
      });
      sections.push('Detaljer från TAVILY-sökning:\n' + resultLines.join('\n'));
    }
  }

  return sections.length > 0
    ? `\n\nExtern realtidskontext:\n${sections.join('\n\n')}`
    : '';
};

const fetchTavilyContext = async (message: string): Promise<string> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över realtidssökning.');
    return '';
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: message,
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fel vid anrop till Tavily API:', errorText);
      return '';
    }

    const tavilyData = await response.json() as TavilySearchResponse;
    return formatTavilyResults(tavilyData);
  } catch (error) {
    console.error('Undantag vid anrop till Tavily API:', error);
    return '';
  }
};

const buildPortfolioSnapshot = (holdings: HoldingRecord[] | null): PortfolioSnapshot => {
  if (!Array.isArray(holdings)) {
    return {
      totalValueSEK: 0,
      holdingsCount: 0,
      topHoldings: [],
    };
  }

  const resolvedHoldings = holdings
    .map((holding) => {
      if (!holding || typeof holding !== 'object') return null;

      const breakdown = resolveHoldingValue(holding);
      const label = typeof holding.name === 'string' && holding.name.trim().length > 0
        ? holding.name.trim()
        : typeof holding.symbol === 'string' && holding.symbol.trim().length > 0
          ? holding.symbol.trim()
          : 'Okänt innehav';

      return {
        holding,
        breakdown,
        label,
        symbol: typeof holding.symbol === 'string' ? holding.symbol : null,
        name: typeof holding.name === 'string' ? holding.name : null,
      };
    })
    .filter((item): item is {
      holding: HoldingRecord;
      breakdown: HoldingValueBreakdown;
      label: string;
      symbol: string | null;
      name: string | null;
    } => Boolean(item))
    .filter((item) => item.breakdown.valueInSEK > 0);

  const totalValueSEK = resolvedHoldings.reduce((sum, item) => sum + item.breakdown.valueInSEK, 0);

  const sorted = [...resolvedHoldings].sort((a, b) => b.breakdown.valueInSEK - a.breakdown.valueInSEK);

  const topHoldings = sorted.slice(0, 5).map((item, index) => ({
    id: index + 1,
    label: item.label,
    symbol: item.symbol,
    name: item.name,
    allocation: totalValueSEK > 0
      ? Number(((item.breakdown.valueInSEK / totalValueSEK) * 100).toFixed(2))
      : 0,
    valueSEK: Number(item.breakdown.valueInSEK.toFixed(2)),
  }));

  return {
    totalValueSEK: Number(totalValueSEK.toFixed(2)),
    holdingsCount: resolvedHoldings.length,
    topHoldings,
  };
};

const fetchMorningBriefNews = async (topics: string[]): Promise<TavilySearchResult[]> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över morgonbrevets nyhetssökning.');
    return [];
  }

  const uniqueTopics = Array.from(new Set(topics.filter(Boolean))).slice(0, 5);
  const queryBase = uniqueTopics.length > 0
    ? `Latest market news today about ${uniqueTopics.join(', ')}`
    : 'Latest global stock market news today';

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: queryBase,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        max_results: 6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fel vid morgonbrevets Tavily-anrop:', errorText);
      return [];
    }

    const tavilyData = await response.json() as TavilySearchResponse;
    return Array.isArray(tavilyData.results) ? tavilyData.results : [];
  } catch (error) {
    console.error('Undantag vid morgonbrevets Tavily-anrop:', error);
    return [];
  }
};

const ENGLISH_MARKER_REGEX = /(\b|_)(the|and|for|with|company|shares|stock|expected|will|has|have|to|from|market|investors|price|growth|quarter|revenue|profit|loss|trading|announcement|guidance|outlook|update|reports?)(\b|_)/i;

const containsLikelyEnglish = (value: string | undefined | null): boolean => {
  if (!value) return false;

  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  const normalized = removeDiacritics(trimmed.toLowerCase());
  return ENGLISH_MARKER_REGEX.test(normalized);
};

const briefNeedsTranslation = (brief: MorningBriefPayload): boolean => {
  if (containsLikelyEnglish(brief.marketOverview)) {
    return true;
  }

  if (Array.isArray(brief.portfolioHighlights)) {
    for (const highlight of brief.portfolioHighlights) {
      if (containsLikelyEnglish(highlight)) {
        return true;
      }
    }
  }

  for (const item of brief.items) {
    if (
      containsLikelyEnglish(item.headline) ||
      containsLikelyEnglish(item.summary) ||
      containsLikelyEnglish(item.reflection)
    ) {
      return true;
    }
  }

  return false;
};

const translateBriefToSwedish = async (
  brief: MorningBriefPayload,
  openAIApiKey: string,
): Promise<MorningBriefPayload> => {
  const translationPrompt = `Du är en professionell finansiell översättare. Du får ett JSON-objekt med ett morgonbrev.\n\n` +
    `Översätt alla texter i JSON:et till svenska med korrekt finansterminologi. Behåll exakt samma nycklar och id:n.\n` +
    `Svara enbart med giltig JSON i samma struktur.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: translationPrompt },
        { role: 'user', content: JSON.stringify(brief) },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('Kunde inte översätta morgonbrevet till svenska:', errorBody);
    return brief;
  }

  try {
    const json = await response.json();
    const translatedContent = json?.choices?.[0]?.message?.content;
    if (typeof translatedContent === 'string') {
      const parsed = JSON.parse(translatedContent) as Record<string, unknown>;

      const translatedHighlights = Array.isArray(parsed.portfolioHighlights)
        ? (parsed.portfolioHighlights as unknown[]).map((value) => value?.toString?.().trim()).filter(Boolean) as string[]
        : Array.isArray(parsed.portfolio_highlights)
          ? (parsed.portfolio_highlights as unknown[]).map((value) => value?.toString?.().trim()).filter(Boolean) as string[]
          : brief.portfolioHighlights;

      const parsedItems = Array.isArray(parsed.items)
        ? parsed.items as Array<Record<string, unknown>>
        : [];

      const translatedItems = parsedItems.length === brief.items.length
        ? parsedItems.map((item, index) => ({
          id: brief.items[index].id,
          headline: typeof item.headline === 'string' && item.headline.trim().length > 0
            ? item.headline.trim()
            : typeof item.title === 'string' && item.title.trim().length > 0
              ? item.title.trim()
              : brief.items[index].headline,
          summary: typeof item.summary === 'string' && item.summary.trim().length > 0
            ? item.summary.trim()
            : brief.items[index].summary,
          reflection: typeof item.reflection === 'string' && item.reflection.trim().length > 0
            ? item.reflection.trim()
            : brief.items[index].reflection,
          sourceUrl: brief.items[index].sourceUrl,
          publishedAt: brief.items[index].publishedAt,
        }))
        : brief.items;

      return {
        generatedAt: typeof parsed.generatedAt === 'string' && parsed.generatedAt.trim().length > 0
          ? parsed.generatedAt.trim()
          : typeof parsed.generated_at === 'string' && parsed.generated_at.trim().length > 0
            ? parsed.generated_at.trim()
            : brief.generatedAt,
        marketOverview: typeof parsed.marketOverview === 'string' && parsed.marketOverview.trim().length > 0
          ? parsed.marketOverview.trim()
          : typeof parsed.market_overview === 'string' && parsed.market_overview.trim().length > 0
            ? parsed.market_overview.trim()
            : brief.marketOverview,
        portfolioHighlights: translatedHighlights,
        items: translatedItems,
      };
    }
  } catch (error) {
    console.warn('Fel vid tolkning av översatt morgonbrev:', error);
  }

  return brief;
};

const ensureSwedishBrief = async (
  brief: MorningBriefPayload,
  openAIApiKey: string,
): Promise<MorningBriefPayload> => {
  if (!openAIApiKey) {
    return brief;
  }

  if (!briefNeedsTranslation(brief)) {
    return brief;
  }

  try {
    return await translateBriefToSwedish(brief, openAIApiKey);
  } catch (error) {
    console.warn('Fel vid översättning till svenska:', error);
    return brief;
  }
};

const normalizeMorningBrief = (
  rawBrief: unknown,
  newsItems: MorningBriefNewsItem[],
  snapshot: PortfolioSnapshot,
): MorningBriefPayload => {
  const nowIso = new Date().toISOString();
  const parsed = typeof rawBrief === 'object' && rawBrief !== null ? rawBrief as Record<string, unknown> : {};

  const rawItems = Array.isArray(parsed.items)
    ? parsed.items as Record<string, unknown>[]
    : [];

  const normalizedItems: MorningBriefItem[] = rawItems.map((item, index) => {
    const id = typeof item.id === 'number'
      ? item.id
      : typeof item.id === 'string' && !Number.isNaN(Number(item.id))
        ? Number(item.id)
        : (newsItems[index]?.id ?? index + 1);

    const relatedNews = newsItems.find((news) => news.id === id) ?? newsItems[index];

    const reflectionCandidates: string[] = [];

    if (typeof (item as { reflection?: unknown }).reflection === 'string') {
      reflectionCandidates.push(((item as { reflection: string }).reflection).trim());
    }

    if (Array.isArray((item as { reflections?: unknown[] }).reflections)) {
      reflectionCandidates.push(
        ...((item as { reflections: unknown[] }).reflections)
          .map((value) => value?.toString?.().trim())
          .filter((value): value is string => Boolean(value))
      );
    }

    if (Array.isArray(item.recommendedActions)) {
      reflectionCandidates.push(
        ...(item.recommendedActions as unknown[])
          .map((value) => value?.toString?.().trim())
          .filter((value): value is string => Boolean(value))
      );
    } else if (Array.isArray(item.recommended_actions)) {
      reflectionCandidates.push(
        ...(item.recommended_actions as unknown[])
          .map((value) => value?.toString?.().trim())
          .filter((value): value is string => Boolean(value))
      );
    }

    const reflection = reflectionCandidates
      .map((candidate) => candidate.replace(/\s+/g, ' ').trim())
      .filter(Boolean)[0];

    return {
      id,
      headline: typeof item.headline === 'string' && item.headline.trim().length > 0
        ? item.headline.trim()
        : relatedNews?.title ?? `Nyhet ${index + 1}`,
      summary: typeof item.summary === 'string' && item.summary.trim().length > 0
        ? item.summary.trim()
        : relatedNews?.title
          ? `Ingen svensk sammanfattning tillgänglig. Läs mer i källan om "${relatedNews.title}".`
          : 'Ingen svensk sammanfattning tillgänglig.',
      reflection: reflection
        ? reflection
        : relatedNews?.title
          ? `Fundera på hur "${relatedNews.title}" kan påverka din strategi.`
          : 'Fundera på hur detta kan påverka din portfölj på kort och lång sikt.',
      sourceUrl: typeof item.sourceUrl === 'string' && item.sourceUrl.trim().length > 0
        ? item.sourceUrl.trim()
        : typeof item.source_url === 'string' && item.source_url.trim().length > 0
          ? item.source_url.trim()
          : relatedNews?.url || undefined,
      publishedAt: typeof item.publishedAt === 'string' && item.publishedAt.trim().length > 0
        ? item.publishedAt.trim()
        : typeof item.published_at === 'string' && item.published_at.trim().length > 0
          ? item.published_at.trim()
          : relatedNews?.publishedAt || undefined,
    };
  });

  const fallbackItems = normalizedItems.length > 0
    ? normalizedItems
    : newsItems.slice(0, 3).map((news) => ({
      id: news.id,
      headline: news.title || 'Marknadsuppdatering',
      summary: news.title
        ? `Ingen svensk sammanfattning tillgänglig. Läs mer i källan om "${news.title}".`
        : 'Ingen svensk sammanfattning tillgänglig.',
      reflection: news.title
        ? `Fundera på hur "${news.title}" kan påverka din strategi.`
        : 'Fundera på hur detta kan påverka din portfölj på kort och lång sikt.',
      sourceUrl: news.url || undefined,
      publishedAt: news.publishedAt || undefined,
    }));

  const portfolioHighlights = Array.isArray(parsed.portfolioHighlights)
    ? (parsed.portfolioHighlights as unknown[]).map((value) => value?.toString?.().trim()).filter(Boolean) as string[]
    : Array.isArray(parsed.portfolio_highlights)
      ? (parsed.portfolio_highlights as unknown[]).map((value) => value?.toString?.().trim()).filter(Boolean) as string[]
      : snapshot.topHoldings.length > 0
        ? snapshot.topHoldings.map((holding) => `${holding.label}: ${holding.allocation.toFixed(1)}% av portföljen`)
        : [];

  const marketOverview = typeof parsed.marketOverview === 'string' && parsed.marketOverview.trim().length > 0
    ? parsed.marketOverview.trim()
    : typeof parsed.market_overview === 'string' && parsed.market_overview.trim().length > 0
      ? parsed.market_overview.trim()
      : undefined;

  return {
    generatedAt: typeof parsed.generatedAt === 'string' && parsed.generatedAt.trim().length > 0
      ? parsed.generatedAt.trim()
      : typeof parsed.generated_at === 'string' && parsed.generated_at.trim().length > 0
        ? parsed.generated_at.trim()
        : nowIso,
    marketOverview,
    portfolioHighlights,
    items: fallbackItems,
  };
};

const handleMorningBrief = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  openAIApiKey: string,
  portfolioId?: string | null,
) => {
  const [{ data: portfolio }, { data: holdings }] = await Promise.all([
    supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId),
  ]);

  const snapshot = buildPortfolioSnapshot(Array.isArray(holdings) ? holdings as HoldingRecord[] : []);

  const topTopics = snapshot.topHoldings
    .map((holding) => holding.symbol || holding.name)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const tavilyResults = await fetchMorningBriefNews(topTopics);

  const newsItems: MorningBriefNewsItem[] = tavilyResults.slice(0, 5).map((result, index) => ({
    id: index + 1,
    title: typeof result.title === 'string' ? result.title : `Nyhet ${index + 1}`,
    snippet: typeof result.content === 'string'
      ? result.content
      : typeof result.snippet === 'string'
        ? result.snippet
        : 'Ingen ytterligare information tillgänglig.',
    url: typeof result.url === 'string' ? result.url : '',
    publishedAt: typeof result.published_date === 'string' ? result.published_date : '',
  }));

  const morningBriefPrompt = `Du är en finansanalytiker som skapar ett kort morgonbrev på svenska. Svara enbart med giltig JSON.

Struktur:
{
  "generated_at": "ISO-datum",
  "market_overview": "kort marknadsöverblick",
  "portfolio_highlights": ["punkt"...],
  "items": [
    {
      "id": <samma id som i indata>,
      "headline": "rubrik",
      "summary": "kort sammanfattning",
      "reflection": "kort reflektion",
      "source_url": "url från indata",
      "published_at": "datum"
    }
  ]
}

Regler:
- Håll språket på svenska och professionellt men lättillgängligt.
- Översätt rubriker, sammanfattningar, marknadsöversikt och reflektioner till svenska även om originalkällan är på ett annat språk.
- Fokusera på vad som har hänt i varje nyhet och varför det är relevant för användarens portfölj, minst två meningar per sammanfattning.
- Lyft hur nyheten kan påverka användarens portfölj eller marknadsposition.
- Använd fältet "reflection" för en kort personlig reflektion (1–2 meningar) som hjälper användaren att fundera vidare, utan uppmaningar till handling.
- Använd informationen från portföljdatan och nyhetslistan. Återanvänd id och URL exakt.`;

  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: morningBriefPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify({
            portfolio: {
              id: portfolio?.id ?? portfolioId ?? null,
              name: portfolio?.name ?? 'Portfölj',
              riskScore: portfolio?.risk_score ?? null,
              expectedReturn: portfolio?.expected_return ?? null,
              snapshot,
            },
            news: newsItems,
          }),
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorBody = await aiResponse.text();
    console.error('OpenAI fel vid morgonbrev:', errorBody);
    throw new Error(`OpenAI API error: ${aiResponse.status}`);
  }

  const aiJson = await aiResponse.json();
  const rawContent = aiJson?.choices?.[0]?.message?.content;

  let parsedBrief: unknown = null;

  if (typeof rawContent === 'string') {
    try {
      parsedBrief = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Kunde inte parsa AI-svar för morgonbrev:', error);
    }
  }

  const brief = normalizeMorningBrief(parsedBrief, newsItems, snapshot);
  const localizedBrief = await ensureSwedishBrief(brief, openAIApiKey);

  return {
    success: true,
    brief: localizedBrief,
    news: newsItems,
    portfolioSnapshot: snapshot,
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== PORTFOLIO AI CHAT FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe, conversationData, stream } = requestBody;

    console.log('Portfolio AI Chat function called with:', {
      message: message?.substring(0, 50) + '...',
      userId,
      portfolioId,
      sessionId,
      analysisType
    });

    if (!userId) {
      console.error('Missing required userId');
      throw new Error('userId is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, length:', openAIApiKey.length);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Supabase client initialized');

    if (analysisType === 'morning_brief') {
      console.log('Handling morning brief request');
      const morningBriefResult = await handleMorningBrief(supabase, userId, openAIApiKey, portfolioId);

      return new Response(
        JSON.stringify(morningBriefResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      console.error('Missing message for standard chat request');
      throw new Error('Message is required');
    }

    // Fetch all user data in parallel for better performance
    const [
      { data: aiMemory },
      { data: riskProfile },
      { data: portfolio },
      { data: holdings },
      { data: subscriber }
    ] = await Promise.all([
      supabase
        .from('user_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

    let sheetTickerSymbols: string[] = [];
    let sheetTickerNames: string[] = [];

    try {
      const { data: sheetTickerData, error: sheetTickerError } = await supabase.functions.invoke('list-sheet-tickers');

      if (sheetTickerError) {
        console.error('Failed to fetch Google Sheets tickers:', sheetTickerError);
      } else {
        const typedData = sheetTickerData as SheetTickerEdgeResponse | null;
        const rawTickers = Array.isArray(typedData?.tickers)
          ? (typedData?.tickers as SheetTickerEdgeItem[])
          : [];

        const symbolSet = new Set<string>();
        const nameSet = new Set<string>();

        for (const item of rawTickers) {
          if (!item || typeof item !== 'object') continue;

          const rawSymbol = typeof item.symbol === 'string' ? item.symbol : null;
          if (rawSymbol) {
            const trimmedSymbol = rawSymbol.trim();
            const withoutPrefix = trimmedSymbol.includes(':')
              ? trimmedSymbol.split(':').pop() ?? trimmedSymbol
              : trimmedSymbol;
            const cleanedSymbol = withoutPrefix.replace(/\s+/g, '').toUpperCase();
            if (cleanedSymbol.length > 0) {
              symbolSet.add(cleanedSymbol);
            }
          }

          const rawName = typeof item.name === 'string' ? item.name : null;
          if (rawName) {
            const normalizedWhitespaceName = rawName.replace(/\s+/g, ' ').trim();
            if (normalizedWhitespaceName.length > 0) {
              nameSet.add(normalizedWhitespaceName);

              const diacriticsStripped = removeDiacritics(normalizedWhitespaceName).trim();
              if (diacriticsStripped.length > 0 && diacriticsStripped !== normalizedWhitespaceName) {
                nameSet.add(diacriticsStripped);
              }
            }
          }
        }

        sheetTickerSymbols = Array.from(symbolSet);
        sheetTickerNames = Array.from(nameSet);

        console.log('Loaded Google Sheets tickers:', {
          symbols: sheetTickerSymbols.length,
          names: sheetTickerNames.length,
        });
      }
    } catch (error) {
      console.error('Unexpected error when loading Google Sheets tickers:', error);
    }

    // ENHANCED INTENT DETECTION FOR PROFILE UPDATES
    const detectProfileUpdates = (message: string) => {
      const updates: any = {};
      let requiresConfirmation = false;
      const lowerMessage = message.toLowerCase();

      const parseNumber = (value: string) => {
        const numeric = value.replace(/[^\d]/g, '');
        return numeric ? parseInt(numeric, 10) : NaN;
      };

      // Parse monthly savings changes - more comprehensive
      const monthlySavingsPattern = /(öka|höja|minska|sänka|ändra).*(?:månad|månads).*(?:sparande|spara|investera).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const monthlySavingsMatch = message.match(monthlySavingsPattern);
      
      if (monthlySavingsMatch) {
        const action = monthlySavingsMatch[1].toLowerCase();
        const amount = parseInt(monthlySavingsMatch[2].replace(/[\s,]/g, ''));
        const currentAmount = riskProfile?.monthly_investment_amount || 0;
        
        let newAmount = amount;
        if (action.includes('öka') || action.includes('höja')) {
          newAmount = currentAmount + amount;
        } else if (action.includes('minska') || action.includes('sänka')) {
          newAmount = Math.max(0, currentAmount - amount);
        }

        if (newAmount !== currentAmount) {
          updates.monthly_investment_amount = newAmount;
          requiresConfirmation = true;
        }
      }

      // Direct monthly investment amount
      const directMonthlyMatch = message.match(/(?:spara|investera|satsa|lägga)\s+(\d+(?:\s?\d{3})*)\s*(?:kr|kronor|SEK).*(?:månad|månads)/i);
      if (directMonthlyMatch) {
        const amount = parseInt(directMonthlyMatch[1].replace(/\s/g, ''));
        if (amount > 0 && amount !== riskProfile?.monthly_investment_amount) {
          updates.monthly_investment_amount = amount;
          requiresConfirmation = true;
        }
      }

      // Parse liquid capital / savings on accounts
      const liquidCapitalPatterns = [
        /(?:likvidt? kapital|tillgängligt kapital|kassa|sparkonto|kontanter|på kontot|i banken).*?(\d[\d\s.,]*)\s*(?:kr|kronor|sek)?/i,
        /(\d[\d\s.,]*)\s*(?:kr|kronor|sek)?.*?(?:likvidt? kapital|tillgängligt kapital|kassa|sparkonto|kontanter|på kontot|i banken)/i
      ];

      for (const pattern of liquidCapitalPatterns) {
        const match = message.match(pattern);
        if (match) {
          const amount = parseNumber(match[1]);
          if (!Number.isNaN(amount) && amount > 0 && amount !== riskProfile?.liquid_capital) {
            updates.liquid_capital = amount;
            requiresConfirmation = true;
          }
          break;
        }
      }

      // Parse emergency buffer in months
      const emergencyBufferPatterns = [
        /(?:buffert|nödfond|akutfond|trygghetsbuffert).*?(\d+(?:[.,]\d+)?)\s*(?:månader|mån|months?)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:månader|mån)\s*(?:buffert|nödfond|akutfond)/i
      ];

      for (const pattern of emergencyBufferPatterns) {
        const match = message.match(pattern);
        if (match) {
          const bufferMonths = Math.round(parseFloat(match[1].replace(',', '.')));
          if (!Number.isNaN(bufferMonths) && bufferMonths > 0 && bufferMonths !== riskProfile?.emergency_buffer_months) {
            updates.emergency_buffer_months = bufferMonths;
            requiresConfirmation = true;
          }
          break;
        }
      }

      // Parse preferred number of stocks/holdings
      const preferredStockMatch = message.match(/(?:vill|önskar|föredrar|siktar på|tänker|ska|max|högst|upp till|äga|ha)\s*(?:ha|ägna|äga)?\s*(?:max|högst|upp till)?\s*(\d+(?:[.,]\d+)?)\s*(?:aktier|bolag|innehav)/i);
      if (preferredStockMatch) {
        const preferredCount = Math.round(parseFloat(preferredStockMatch[1].replace(',', '.')));
        if (!Number.isNaN(preferredCount) && preferredCount > 0 && preferredCount !== riskProfile?.preferred_stock_count) {
          updates.preferred_stock_count = preferredCount;
          requiresConfirmation = true;
        }
      }

      // Parse age updates
      const agePattern = /(?:är|age|ålder).*?(\d{2,3})\s*(?:år|years|old)/i;
      const ageMatch = message.match(agePattern);

      if (ageMatch) {
        const newAge = parseInt(ageMatch[1]);
        if (newAge >= 18 && newAge <= 100 && newAge !== riskProfile?.age) {
          updates.age = newAge;
          requiresConfirmation = true;
        }
      }

      // Parse income updates
      const incomePattern = /(årsinkomst|lön|income).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const incomeMatch = message.match(incomePattern);
      
      if (incomeMatch) {
        const newIncome = parseInt(incomeMatch[2].replace(/[\s,]/g, ''));
        if (newIncome !== riskProfile?.annual_income) {
          updates.annual_income = newIncome;
          requiresConfirmation = true;
        }
      }

      // Risk tolerance updates - enhanced patterns
      const riskPatterns = [
        { pattern: /(konservativ|låg risk|säker|försiktig)/i, value: 'conservative' },
        { pattern: /(måttlig|medel|balanserad|moderate)/i, value: 'moderate' },
        { pattern: /(aggressiv|hög risk|riskabel|risktagande)/i, value: 'aggressive' }
      ];

      for (const riskPattern of riskPatterns) {
        if (lowerMessage.match(riskPattern.pattern) &&
            (lowerMessage.includes('risk') || lowerMessage.includes('inställning') ||
            lowerMessage.includes('tolerans')) &&
            riskPattern.value !== riskProfile?.risk_tolerance) {
          updates.risk_tolerance = riskPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      // Investment horizon updates - enhanced patterns
      const horizonPatterns = [
        { pattern: /(kort|1-3|kortsiktig)/i, value: 'short' },
        { pattern: /(medel|3-7|mellanlång)/i, value: 'medium' },
        { pattern: /(lång|7\+|långsiktig|över 7)/i, value: 'long' }
      ];

      for (const horizonPattern of horizonPatterns) {
        if (lowerMessage.match(horizonPattern.pattern) &&
            (lowerMessage.includes('horisont') || lowerMessage.includes('sikt') ||
            lowerMessage.includes('tidshorisont')) &&
            horizonPattern.value !== riskProfile?.investment_horizon) {
          updates.investment_horizon = horizonPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      // Housing situation detection with loan status cues
      let detectedHousing: string | null = null;

      const mentionsNoLoan = lowerMessage.includes('utan lån') || lowerMessage.includes('skuldfri') ||
        lowerMessage.includes('utan bolån') || lowerMessage.includes('inget bolån');

      if (/(?:hyr|hyresrätt)/.test(lowerMessage)) {
        detectedHousing = 'rents';
      } else if (/bor hos (?:mina?|föräldrar)/.test(lowerMessage)) {
        detectedHousing = 'lives_with_parents';
      } else if (/(?:bostadsrätt|äg[er]?\s+(?:en\s+)?lägenhet|äg[er]?\s+(?:ett\s+)?hus|äg[er]?\s+(?:en\s+)?villa|äg[er]?\s+(?:ett\s+)?radhus|villa|radhus|egna hem)/.test(lowerMessage)) {
        detectedHousing = mentionsNoLoan ? 'owns_no_loan' : 'owns_with_loan';
      } else if (/bolån/.test(lowerMessage) && /(villa|hus|radhus|bostad|bostadsrätt)/.test(lowerMessage)) {
        detectedHousing = mentionsNoLoan ? 'owns_no_loan' : 'owns_with_loan';
      }

      if (detectedHousing && detectedHousing !== riskProfile?.housing_situation) {
        updates.housing_situation = detectedHousing;
        requiresConfirmation = true;
      }

      // Loan detection (true/false)
      const loanIndicators = [/bolån/, /studielån/, /privatlån/, /billån/, /låneskulder/, /har lån/, /lån på huset/, /lånet/, /lån kvar/];
      const loanNegativeIndicators = [/utan lån/, /skuldfri/, /inga lån/, /lånefri/, /helt skuldfri/, /utan bolån/, /inget lån/, /inget bolån/];

      const sanitizedLoanMessage = lowerMessage
        .replace(/utan\s+bolån/g, '')
        .replace(/utan\s+lån/g, '')
        .replace(/inga\s+lån/g, '')
        .replace(/inget\s+lån/g, '')
        .replace(/inget\s+bolån/g, '')
        .replace(/skuldfri/g, '')
        .replace(/lånefri/g, '');

      const hasPositiveLoan = loanIndicators.some(pattern => pattern.test(sanitizedLoanMessage));
      const hasNegativeLoan = loanNegativeIndicators.some(pattern => pattern.test(lowerMessage));

      if (hasPositiveLoan) {
        if (riskProfile?.has_loans !== true) {
          updates.has_loans = true;
          requiresConfirmation = true;
        }
      } else if (hasNegativeLoan) {
        if (riskProfile?.has_loans !== false) {
          updates.has_loans = false;
          requiresConfirmation = true;
        }
      }

      return { updates, requiresConfirmation };
    };

    const profileChangeDetection = detectProfileUpdates(message);

    const isPremium = subscriber?.subscribed || false;
    console.log('User premium status:', isPremium);

    const investmentContextPattern = /(aktie|aktier|börs|portfölj|fond|investera|bolag|innehav|kurs|marknad|stock|share|equity)/i;
    const hasInvestmentContext = investmentContextPattern.test(message);

    const companyIntentPattern = /(?:analysera|analys av|vad tycker du om|hur ser du på|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|information om|företagsinfo|köpvärd|sälj|köpa|sälja|investera)/i;
    const hasCompanyIntent = companyIntentPattern.test(message);

    const hasStockContext = hasInvestmentContext || hasCompanyIntent;

    // Check if this is a stock exchange request
    const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av)/i.test(message) &&
      /(?:aktie|aktier|innehav|portfölj)/i.test(message);

    // Enhanced stock detection - detect both analysis requests AND stock mentions
    const createBoundaryPattern = (pattern: string) => `(?:^|[^A-Za-z0-9])${pattern}(?=$|[^A-Za-z0-9])`;

    const sheetTickerSymbolSet = new Set(sheetTickerSymbols.map(symbol => symbol.toUpperCase()));

    const sheetTickerSymbolPatterns: StockDetectionPattern[] = sheetTickerSymbols.map(symbol =>
      ({
        regex: new RegExp(createBoundaryPattern(escapeRegExp(symbol)), 'i'),
        requiresContext: true,
      })
    );

    const sheetTickerNamePatterns: StockDetectionPattern[] = sheetTickerNames.map(name => {
      const collapsedName = name.replace(/\s+/g, ' ');
      const escapedName = escapeRegExp(collapsedName).replace(/\s+/g, '\\s+');
      return {
        regex: new RegExp(createBoundaryPattern(escapedName), 'i'),
        requiresContext: true,
      };
    });

    const staticCompanyPattern: StockDetectionPattern = {
      regex: new RegExp(
        createBoundaryPattern('(?:investor|volvo|ericsson|sandvik|atlas|kinnevik|hex|alfa\\s+laval|skf|telia|seb|handelsbanken|nordea|abb|astra|electrolux|husqvarna|getinge|boliden|ssab|stora\\s+enso|svenska\\s+cellulosa|lund|billerud|holmen|nibe|beijer|essity|kindred|evolution|betsson|net\\s+entertainment|fingerprint|sinch|tobii|xvivo|medivir|orexo|camurus|diamyd|raysearch|elekta|sectra|bactiguard|vitrolife|bioinvent|immunovia|hansa|cantargia|oncopeptides|wilson\\s+therapeutics|solberg|probi|biovica|addlife|duni|traction|embracer|stillfront|paradox|starbreeze|remedy|gaming|saab|h&m|hennes|mauritz|assa\\s+abloy|atlas\\s+copco|epiroc|trelleborg|lifco|indutrade|fagerhult|munters|sweco|ramboll|hexagon|addtech|bufab|nolato|elanders)'),
        'i'
      ),
      requiresContext: true,
    };

    const stockMentionPatterns: StockDetectionPattern[] = [
      staticCompanyPattern,
      {
        regex: /(?:köpa|sälja|investera|aktier?|bolag|företag)\s+(?:i\s+)?([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      {
        regex: /(?:aktien?|bolaget)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      {
        regex: /(?:vad tycker du om|hur ser du på|bra aktie|dålig aktie|köpvärd|sälj)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      ...sheetTickerSymbolPatterns,
      ...sheetTickerNamePatterns,
    ];

    const isStockAnalysisRequest = /(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) &&
      /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity)/i.test(message);

    const hasTickerSymbolMention = (() => {
      const tickerMatches = Array.from(message.matchAll(/\b([A-Z]{2,6})\b/g));
      if (tickerMatches.length === 0) return false;

      const matchedTickers = tickerMatches
        .map(match => match[1]?.toUpperCase())
        .filter((symbol): symbol is string => Boolean(symbol) && sheetTickerSymbolSet.has(symbol));

      if (matchedTickers.length === 0) return false;

      const tokens = message.trim().split(/\s+/);
      const allTokensAreTickers = tokens.length > 0 && tokens.every(token => sheetTickerSymbolSet.has(token.toUpperCase()));

      return hasStockContext || allTokensAreTickers;
    })();

    // Check for stock mentions in user message
    const stockMentionsInMessage = stockMentionPatterns.some(({ regex, requiresContext }) => {
      regex.lastIndex = 0;
      if (requiresContext && !hasStockContext) {
        return false;
      }
      return regex.test(message);
    }) || hasTickerSymbolMention;

    const isStockMentionRequest = stockMentionsInMessage || isStockAnalysisRequest;
     
    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    // Fetch Tavily context when the user mentions stocks or requests real-time insights
    let tavilyContext = '';
    const shouldFetchTavily = isStockMentionRequest || requiresRealTimeSearch(message);
    if (shouldFetchTavily) {
      const logMessage = isStockMentionRequest
        ? 'Aktieomnämnande upptäckt – anropar Tavily för relevanta nyheter.'
        : 'Fråga upptäckt som realtidsfråga – anropar Tavily.';
      console.log(logMessage);

      tavilyContext = await fetchTavilyContext(message);
      if (tavilyContext) {
        console.log('Tavily-kontent hämtad och läggs till i kontexten.');
      }
    }

    // AI Memory update function
    const updateAIMemory = async (supabase: any, userId: string, userMessage: string, aiResponse: string, existingMemory: any) => {
      try {
        // Extract interests and companies from conversation
        const interests: string[] = [];
        const companies: string[] = [];
        
        // Simple keyword extraction
        const techKeywords = ['teknik', 'AI', 'mjukvara', 'innovation', 'digitalisering'];
        const healthKeywords = ['hälsa', 'medicin', 'bioteknik', 'läkemedel', 'vård'];
        const energyKeywords = ['energi', 'förnybar', 'miljö', 'hållbarhet', 'grön'];
        
        if (techKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Teknik');
        }
        if (healthKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Hälsovård');
        }
        if (energyKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Förnybar energi');
        }

        // Extract company names (simple pattern matching)
        const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
        const matches = userMessage.match(companyPattern);
        if (matches) {
          companies.push(...matches.slice(0, 3));
        }

        const memoryData = {
          user_id: userId,
          total_conversations: (existingMemory?.total_conversations || 0) + 1,
          communication_style: userMessage.length > 50 ? 'detailed' : 'concise',
          preferred_response_length: userMessage.length > 100 ? 'detailed' : 'concise',
          expertise_level: isStockAnalysisRequest || isPortfolioOptimizationRequest ? 'advanced' : 'beginner',
          frequently_asked_topics: [
            ...(existingMemory?.frequently_asked_topics || []),
            ...(isStockAnalysisRequest ? ['aktieanalys'] : []),
            ...(isPortfolioOptimizationRequest ? ['portföljoptimering'] : [])
          ].slice(0, 5),
          favorite_sectors: [
            ...(existingMemory?.favorite_sectors || []),
            ...interests
          ].slice(0, 5),
          current_goals: existingMemory?.current_goals || ['långsiktig tillväxt'],
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_ai_memory')
          .upsert(memoryData, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating AI memory:', error);
        } else {
          console.log('AI memory updated successfully');
        }
      } catch (error) {
        console.error('Error in updateAIMemory:', error);
      }
    };

    const userHasPortfolio = Array.isArray(holdings) &&
      holdings.some((holding: HoldingRecord) => holding?.holding_type !== 'recommendation');

    // ENHANCED INTENT ROUTING SYSTEM
    const detectIntent = (message: string) => {
      const msg = message.toLowerCase();

      const newsUpdateKeywords = [
        'kväll',
        'ikväll',
        'senaste',
        'påverka min portfölj',
        'portföljen'
      ];

      const generalNewsKeywords = [
        'nyheter',
        'marknadsbrev',
        'dagens händelser',
        'veckobrev',
        'sammanfattning'
      ];
      
      // Stock/Company Analysis Intent - enhanced to catch more stock mentions
      if (isStockMentionRequest || 
          (/(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) && 
          /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity|[A-Z]{3,5})/i.test(message))) {
        return 'stock_analysis';
      }
      
      // Portfolio news update intent
      if (userHasPortfolio && newsUpdateKeywords.some(keyword => msg.includes(keyword))) {
        return 'news_update';
      }

      // General market news intent
      if (generalNewsKeywords.some(keyword => msg.includes(keyword))) {
        return 'general_news';
      }

      // Portfolio Rebalancing/Optimization Intent
      if (/(?:portfölj|portfolio)/i.test(message) && /(?:optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma|rebalansera)/i.test(message)) {
        return 'portfolio_optimization';
      }
      
      // Buy/Sell Decisions Intent
      if (/(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|position|handel)/i.test(message)) {
        return 'buy_sell_decisions';
      }
       
      // Market Analysis Intent
      if (/(?:marknad|index|trend|prognos|ekonomi|räntor|inflation|börsen)/i.test(message)) {
        return 'market_analysis';
      }
      
      return 'general_advice';
    };

    const userIntent = detectIntent(message);
    console.log('Detected user intent:', userIntent);

    // Build enhanced context with intent-specific prompts
let contextInfo = `Du är en auktoriserad svensk investeringsrådgivare med diskretionär men icke-verkställande behörighet. Du agerar som en personlig finansiell rådgivare som ger professionella investeringsråd.

⚡ SPRÅKREGLER:
- Om användarens fråga är på svenska → översätt den först till engelska internt innan du resonerar.
- Gör hela din analys och reasoning på engelska (för att utnyttja din styrka).
- När du formulerar svaret → översätt tillbaka till naturlig och professionell svenska innan du skickar det till användaren.
- Systeminstruktioner och stilregler (nedan) ska alltid följas på svenska.

PERSONA & STIL:
- Professionell men konverserande ton, som en erfaren rådgivare som bjuder in till dialog
- Anpassa svarens längd: korta svar (2–5 meningar) för enkla frågor
- Vid komplexa frågor → använd strukturerad analys (Situation, Strategi, Risker, Åtgärder)
- Ge alltid exempel på relevanta aktier/fonder med symboler när det är lämpligt
- Använd svensk finansterminologi och marknadskontext
- Avsluta med en öppen fråga för att uppmuntra fortsatt dialog
- Inkludera alltid en **Disclaimer** om utbildningssyfte
`;

const intentPrompts = {
  stock_analysis: `
AKTIEANALYSUPPGIFT:
- Anpassa alltid svarslängd och struktur efter användarens fråga.
- Om frågan är snäv (ex. "vilka triggers?" eller "vad är riskerna?") → ge bara det relevanta svaret i 2–5 meningar.
- Om frågan är bred eller allmän (ex. "kan du analysera bolaget X?") → använd hela analysstrukturen nedan.
- Var alltid tydlig och koncis i motiveringarna.

**OBLIGATORISKT FORMAT FÖR AKTIEFÖRSLAG:**
**Företagsnamn (TICKER)** - Kort motivering

Exempel:
**Evolution AB (EVO)** - Stark position inom online gaming  
**Investor AB (INVE-B)** - Diversifierat investmentbolag  
**Volvo AB (VOLV-B)** - Stabil lastbilstillverkare  

📌 **FLEXIBEL STRUKTUR (välj delar beroende på fråga):**
🏢 Företagsöversikt – Endast vid breda analysfrågor  
📊 Finansiell bild – Endast om relevant för frågan  
📈 Kursläge/Värdering – Endast om användaren frågar om värdering eller prisnivåer  
🎯 Rekommendation – Alltid om användaren vill veta om aktien är köpvärd  
⚡ Triggers – Alltid om användaren frågar om kommande händelser/katalysatorer  
⚠️ Risker & Möjligheter – Endast om användaren efterfrågar risker eller helhetsanalys  
💡 Relaterade förslag – Endast om användaren vill ha alternativ/komplement  

Avsluta med en öppen fråga **endast när det är relevant** för att driva vidare dialog.  
Avsluta alltid med en **Disclaimer** om att råden är i utbildningssyfte.`,


  portfolio_optimization: `
PORTFÖLJOPTIMERINGSUPPGIFT:
- Identifiera överexponering och luckor
- Föreslå omviktningar med procentsatser
- Om kassa eller månadssparande finns: inkludera allokeringsförslag
- Ge enklare prioriteringssteg, men inte hela planen direkt`,

  buy_sell_decisions: `
KÖP/SÄLJ-BESLUTSUPPGIFT:
- Bedöm om tidpunkten är lämplig
- Ange för- och nackdelar
- Föreslå positionsstorlek i procent
- Avsluta med en fråga tillbaka till användaren`,

  market_analysis: `
MARKNADSANALYSUPPGIFT:
- Analysera trender kortfattat
- Beskriv påverkan på användarens portfölj
- Ge 1–2 möjliga justeringar
- Avsluta med fråga om användaren vill ha en djupare analys`,

  general_news: `
NYHETSBREV:
- Ge en bred marknadssammanfattning likt ett kort nyhetsbrev.
- Dela upp i 2–3 sektioner (t.ex. "Globala marknader", "Sektorer", "Stora bolag").
- Prioritera större trender och rubriker som påverkar sentimentet.
- Lägg till 1–2 visuella emojis per sektion för att göra det lättläst.
- Avsluta alltid med en öppen fråga: "Vill du att jag kollar hur detta kan påverka din portfölj?"
`,

  news_update: `
NYHETSBEVAKNING:
- Sammanfatta de viktigaste marknadsnyheterna som påverkar användarens portfölj på ett strukturerat sätt.
- Prioritera nyheter från de senaste 24 timmarna och gruppera dem efter bolag, sektor eller tema.
- Om Tavily-data finns i kontexten: referera tydligt till den och inkludera källa samt tidsangivelse.
- Lyft fram hur varje nyhet påverkar användarens innehav eller strategi och föreslå konkreta uppföljningssteg.
- Avsluta alltid med att fråga användaren om de vill ha en djupare analys av något specifikt bolag.
`,

  general_advice: `
ALLMÄN INVESTERINGSRÅDGIVNING:
- Ge råd i 2–4 meningar
- Inkludera ALLTID konkreta aktieförslag i formatet **Företagsnamn (TICKER)** när relevant
- Anpassa förslag till användarens riskprofil och intressen
- Avsluta med öppen fråga för att driva dialog

**VIKTIGT: Använd ALLTID denna exakta format för aktieförslag:**
**Företagsnamn (TICKER)** - Kort motivering`
};

contextInfo += intentPrompts[userIntent] || intentPrompts.general_advice;

// … här behåller du riskProfile och holdings-delen som du redan har …


    // Enhanced user context with current holdings and performance
    if (riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL (använd denna info, fråga ALDRIG efter den igen):
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Investeringshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (1-3 år)' : riskProfile.investment_horizon === 'medium' ? 'Medellång (3-7 år)' : 'Lång (7+ år)'}
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}`;
      
      if (riskProfile.monthly_investment_amount) {
        contextInfo += `\n- Månatligt sparande: ${riskProfile.monthly_investment_amount.toLocaleString()} SEK`;
      }
      
      if (riskProfile.annual_income) {
        contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
      }
      
      if (riskProfile.sector_interests && riskProfile.sector_interests.length > 0) {
        contextInfo += `\n- Sektorintressen: ${riskProfile.sector_interests.join(', ')}`;
      }
      
      if (riskProfile.investment_goal) {
        contextInfo += `\n- Investeringsmål: ${riskProfile.investment_goal}`;
      }
    }

    // Add current portfolio context with latest valuations
    if (holdings && holdings.length > 0) {
      const actualHoldings: HoldingRecord[] = (holdings as HoldingRecord[]).filter((h) => h.holding_type !== 'recommendation');
      if (actualHoldings.length > 0) {
        const holdingsWithValues = actualHoldings.map((holding) => ({
          holding,
          value: resolveHoldingValue(holding),
        }));

        const totalValue = holdingsWithValues.reduce((sum, item) => sum + item.value.valueInSEK, 0);

        const actualHoldingsLookup = new Map<string, { label: string; percentage: number; valueInSEK: number }>();

        holdingsWithValues.forEach(({ holding, value }) => {
          const label = holding.symbol || holding.name || 'Okänt innehav';
          const percentage = totalValue > 0 ? (value.valueInSEK / totalValue) * 100 : 0;
          const entry = { label, percentage, valueInSEK: value.valueInSEK };

          const symbolKey = normalizeIdentifier(typeof holding.symbol === 'string' ? holding.symbol : null);
          const nameKey = normalizeIdentifier(typeof holding.name === 'string' ? holding.name : null);

          if (symbolKey && !actualHoldingsLookup.has(symbolKey)) {
            actualHoldingsLookup.set(symbolKey, entry);
          }

          if (nameKey && !actualHoldingsLookup.has(nameKey)) {
            actualHoldingsLookup.set(nameKey, entry);
          }
        });

        const topHoldings = [...holdingsWithValues]
          .sort((a, b) => b.value.valueInSEK - a.value.valueInSEK)
          .slice(0, 5);

        const topHoldingsDetails = topHoldings.map(({ holding, value }) => {
          const label = holding.symbol || holding.name || 'Okänt innehav';
          const percentage = totalValue > 0 ? (value.valueInSEK / totalValue) * 100 : 0;

          const identifiers = new Set<string>();
          const symbolKey = normalizeIdentifier(typeof holding.symbol === 'string' ? holding.symbol : null);
          const nameKey = normalizeIdentifier(typeof holding.name === 'string' ? holding.name : null);

          if (symbolKey) identifiers.add(symbolKey);
          if (nameKey) identifiers.add(nameKey);

          return {
            label,
            percentage,
            formattedPercentage: percentage.toFixed(1),
            identifiers: Array.from(identifiers),
          };
        });

        let holdingsSummary = topHoldingsDetails
          .map(({ label, formattedPercentage }) => `${label} (${formattedPercentage}%)`)
          .join(', ');

        const totalValueFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(totalValue));

        let recommendedAllocationEntries: Array<{
          asset: string;
          percentage: number;
          displayValue: string;
          normalizedKey: string | null;
          actualPercentage: number | null;
        }> = [];

        if (portfolio && portfolio.asset_allocation && typeof portfolio.asset_allocation === 'object') {
          recommendedAllocationEntries = Object.entries(portfolio.asset_allocation)
            .map(([asset, rawValue]) => {
              const parsedValue = parseNumericValue(rawValue);
              if (parsedValue === null) return null;

              const normalizedKey = normalizeIdentifier(asset);
              const actualMatch = normalizedKey ? actualHoldingsLookup.get(normalizedKey) : undefined;

              return {
                asset,
                percentage: parsedValue,
                displayValue: typeof rawValue === 'number' ? rawValue.toString() : String(rawValue),
                normalizedKey,
                actualPercentage: actualMatch ? actualMatch.percentage : null,
              };
            })
            .filter((entry): entry is {
              asset: string;
              percentage: number;
              displayValue: string;
              normalizedKey: string | null;
              actualPercentage: number | null;
            } => entry !== null);

          if (recommendedAllocationEntries.length > 0) {
            holdingsSummary = topHoldingsDetails
              .map(({ label, formattedPercentage, identifiers }) => {
                const matchingAllocation = identifiers
                  .map(identifier => recommendedAllocationEntries.find(entry => entry.normalizedKey === identifier))
                  .find((match): match is {
                    asset: string;
                    percentage: number;
                    displayValue: string;
                    normalizedKey: string | null;
                    actualPercentage: number | null;
                  } => Boolean(match));

                if (matchingAllocation) {
                  return `${label} (nu ${formattedPercentage}%, mål ${matchingAllocation.displayValue}%)`;
                }

                return `${label} (${formattedPercentage}%)`;
              })
              .join(', ');
          }
        }

        contextInfo += `\n\nNUVARANDE PORTFÖLJ:
- Totalt värde: ${totalValueFormatted} SEK
- Antal innehav: ${actualHoldings.length}
- Största positioner: ${holdingsSummary || 'Inga registrerade innehav'}`;

        if (portfolio) {
          if (recommendedAllocationEntries.length > 0) {
            contextInfo += `\n- Rekommenderad allokering (använd dessa målviktstal när du diskuterar portföljens struktur):`;
            recommendedAllocationEntries.forEach(({ asset, displayValue, actualPercentage }) => {
              const actualText = actualPercentage !== null
                ? ` (nu ${actualPercentage.toFixed(1)}%)`
                : '';
              contextInfo += `\n  • ${formatAllocationLabel(asset)}: ${displayValue}%${actualText}`;
            });
          }

          contextInfo += `\n- Portföljens riskpoäng: ${portfolio.risk_score || 'Ej beräknad'}
- Förväntad årlig avkastning: ${portfolio.expected_return || 'Ej beräknad'}%`;
        }
      }
    }

// Add response structure requirements
contextInfo += `
SVARSSTRUKTUR (ANPASSNINGSBAR):
- Anpassa alltid svarens format efter frågans karaktär
- Vid enkla frågor: svara kort (2–4 meningar) och avsluta med en öppen motfråga
- Vid generella marknadsfrågor: använd en nyhetsbrevsliknande ton med rubriker som "Dagens höjdpunkter" eller "Kvällens marknadsnyheter"
- Vid djupgående analyser: använd en tydligare struktur med valda sektioner (se nedan), men ta bara med det som tillför värde

EMOJI-ANVÄNDNING:
- Använd relevanta emojis för att förstärka budskapet, men variera mellan svar (t.ex. 📈/🚀 för tillväxt, ⚠️/🛑 för risker, 🔍/📊 för analys)
- Byt ut emojis och rubriker för att undvika monotona svar

MÖJLIGA SEKTIONER (välj flexibelt utifrån behov):
**Analys** 🔍
[Sammanfattning av situationen eller frågan]

**Rekommendation** 🌟
[Konkreta råd, inkl. aktier/fonder med ticker]

**Risker & Överväganden** ⚠️
[Endast om det finns relevanta risker]

**Åtgärdsplan** 📋
[Endast vid komplexa frågor som kräver steg-för-steg]

**Nyhetsuppdatering** 📰
[Vid frågor om senaste händelser – strukturera som ett kort nyhetsbrev]

**Disclaimer:** Detta är endast i utbildningssyfte. Konsultera alltid en licensierad rådgivare.

VIKTIGT:
- Använd ALDRIG hela strukturen slentrianmässigt – välj endast sektioner som ger värde
- Variera rubriker och emojis för att undvika repetitiva svar
- Avsluta alltid med en öppen fråga för att bjuda in till vidare dialog
`;


    // Force using gpt-4o to avoid streaming restrictions and reduce cost
    const model = 'gpt-4o';

    console.log('Selected model:', model, 'for request type:', {
      isStockAnalysis: isStockAnalysisRequest,
      isPortfolioOptimization: isPortfolioOptimizationRequest,
      messageLength: message.length,
      historyLength: chatHistory.length
    });

    // Build messages array with enhanced context
    const messages = [
      { role: 'system', content: contextInfo + tavilyContext },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    // Enhanced telemetry logging
    const requestId = crypto.randomUUID();
    const telemetryData = {
      requestId,
      userId,
      sessionId,
      messageType: isStockAnalysisRequest ? 'stock_analysis' : isPersonalAdviceRequest ? 'personal_advice' : 'general',
      model,
      timestamp: new Date().toISOString(),
      hasMarketData: !!tavilyContext,
      isPremium
    };

    console.log('TELEMETRY START:', telemetryData);

    // Save user message to database first
    if (sessionId) {
      try {
        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: message,
            message_type: 'user',
            context_data: {
              analysisType,
              requestId,
              timestamp: new Date().toISOString()
            }
          });
        console.log('User message saved to database');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // If the client requests non-streaming, return JSON instead of SSE
    if (stream === false) {
      const nonStreamResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!nonStreamResp.ok) {
        const errorBody = await nonStreamResp.text();
        console.error('OpenAI API error response:', errorBody);
        console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
        throw new Error(`OpenAI API error: ${nonStreamResp.status} - ${errorBody}`);
      }

      const nonStreamData = await nonStreamResp.json();
      const aiMessage = nonStreamData.choices?.[0]?.message?.content || '';

      // Update AI memory and optionally save to chat history
      await updateAIMemory(supabase, userId, message, aiMessage, aiMemory);
      if (sessionId && aiMessage) {
        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: aiMessage,
            message_type: 'assistant',
            context_data: {
              analysisType,
              model,
              requestId,
              hasMarketData: !!tavilyContext,
              profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
              requiresConfirmation: profileChangeDetection.requiresConfirmation,
              confidence: 0.8
            }
          });
      }

      console.log('TELEMETRY COMPLETE:', { ...telemetryData, responseLength: aiMessage.length, completed: true });

      return new Response(
        JSON.stringify({
          response: aiMessage,
          requiresConfirmation: profileChangeDetection.requiresConfirmation,
          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: streaming SSE response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error response:', errorBody);
      console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const streamResp = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let aiMessage = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Update AI memory
                  await updateAIMemory(supabase, userId, message, aiMessage, aiMemory);
                  
                  // Send final telemetry
                  console.log('TELEMETRY COMPLETE:', { 
                    ...telemetryData, 
                    responseLength: aiMessage.length,
                    completed: true 
                  });
                  
                  // Save complete message to database
                  if (sessionId && aiMessage) {
                    await supabase
                      .from('portfolio_chat_history')
                      .insert({
                        user_id: userId,
                        chat_session_id: sessionId,
                        message: aiMessage,
                        message_type: 'assistant',
                        context_data: {
                          analysisType,
                          model,
                          requestId,
                          hasMarketData: !!tavilyContext,
                          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                          requiresConfirmation: profileChangeDetection.requiresConfirmation,
                          confidence: 0.8
                        }
                      });
                  }
                  
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    aiMessage += content;
                    
                    // Stream content to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content,
                      profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                      requiresConfirmation: profileChangeDetection.requiresConfirmation
                    })}\n\n`));
                  }
                } catch (e) {
                  // Ignore JSON parse errors for non-JSON lines
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          console.error('TELEMETRY STREAM ERROR:', { ...telemetryData, error: error.message });
          controller.error(error);
        }
      }
    });

    return new Response(streamResp, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});