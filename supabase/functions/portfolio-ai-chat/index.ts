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

type TavilyCacheRow = {
  query: string;
  answer: string;
  created_at: string;
};

const CACHE_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 timmar
const TAVILY_TIMEOUT_MS = 4_000; // 4 sekunder

// Supabase-klient i modulgemensam scope för att återanvända anslutningen i cachen
const supabaseCacheClient = (() => {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !key) {
    console.warn('Supabase credentials missing – Tavily caching disabled.');
    return null;
  }
  return createClient(url, key);
})();

const swedishIndicators = ['ä', 'å', 'ö', 'Ä', 'Å', 'Ö', 'rapport', 'resultat', 'kvartals', 'aktie', 'fond'];

const stockNameToTickerMap: Record<string, string> = {
  tesla: 'TSLA',
  investor: 'INVE-B',
  volvo: 'VOLV-B',
};

const cryptoIndicators = ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'btc', 'eth', 'solana', 'dogecoin'];
const fundIndicators = ['fond', 'fonden', 'fund', 'etf', 'indexfond', 'mutual fund', 'investment fund'];
const stockIndicators = ['aktie', 'stock', 'share', 'equity', 'earnings', 'rapport', 'resultat'];
const advancedDepthIndicators = ['rapport', 'resultat', 'earnings', 'quarterly report'];

// Försök identifiera en ticker i meddelandet för att kunna bygga riktad sökning och fallback.
const detectTickerInMessage = (message: string): string | null => {
  // Identifiera tickers genom att leta efter mönster som TSLA, AAPL, INVE-B etc.
  const tickerRegex = /\b([A-Z]{1,5}[A-Z0-9](?:-[A-Z]{1,2})?)\b/g;
  const explicitTickerMatches = message.match(tickerRegex);
  if (explicitTickerMatches) {
    for (const match of explicitTickerMatches) {
      // Hoppa över enstaka bokstäver (t.ex. "I" i början av en mening) och returnera hela matchen.
      if (match.length <= 1) continue;
      if (/^[A-Z]{1,5}[A-Z0-9](?:-[A-Z]{1,2})?$/.test(match)) {
        return match;
      }
    }
  }

  const normalizedMessage = message.toLowerCase();
  for (const [name, ticker] of Object.entries(stockNameToTickerMap)) {
    if (normalizedMessage.includes(name)) {
      return ticker;
    }
  }

  return null;
};

// Placeholder-funktion: här kan en riktig översättning implementeras senare.
const translateToEnglishIfNeeded = async (message: string): Promise<string> => {
  return message;
};

const isLikelySwedish = (message: string): boolean => {
  const lower = message.toLowerCase();
  return swedishIndicators.some(indicator => lower.includes(indicator));
};

// Bygger upp den dynamiska queryn mot Tavily baserat på upptäckta signaler.
const buildTavilyQuery = async (message: string): Promise<{ query: string; ticker: string | null }> => {
  const ticker = detectTickerInMessage(message);

  const normalized = message.toLowerCase();
  const hasCryptoIndicator = cryptoIndicators.some(indicator => normalized.includes(indicator));
  const hasFundIndicator = fundIndicators.some(indicator => normalized.includes(indicator));
  const hasStockIndicator = Boolean(ticker) || stockIndicators.some(indicator => normalized.includes(indicator));

  if (hasCryptoIndicator) {
    return {
      query: `site:coindesk.com OR site:cointelegraph.com ${message}`,
      ticker,
    };
  }

  if (hasFundIndicator) {
    return {
      query: `site:morningstar.com OR site:seekingalpha.com ${message}`,
      ticker,
    };
  }

  if (hasStockIndicator) {
    const tickerForQuery = ticker ?? message;
    return {
      query: `site:stockanalysis.com/quote/${tickerForQuery}/financials OR site:reuters.com OR site:bloomberg.com ${tickerForQuery} earnings OR quarterly report`,
      ticker,
    };
  }

  return {
    query: `site:stockanalysis.com OR site:reuters.com OR site:bloomberg.com ${message}`,
    ticker,
  };
};

const getSearchDepth = (message: string): 'basic' | 'advanced' => {
  const normalized = message.toLowerCase();
  return advancedDepthIndicators.some(indicator => normalized.includes(indicator)) ? 'advanced' : 'basic';
};

// Hämtar ett svar från Supabase-cachen om det finns och är färskt.
const fetchFromCache = async (query: string): Promise<string | null> => {
  if (!supabaseCacheClient) return null;

  try {
    const { data, error } = await supabaseCacheClient
      .from('tavily_cache')
      .select('query, answer, created_at')
      .eq('query', query)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<TavilyCacheRow>();

    if (error) {
      console.error('Failed to fetch Tavily cache:', error);
      return null;
    }

    if (!data) return null;

    const createdAt = new Date(data.created_at).getTime();
    if (Number.isNaN(createdAt)) return null;

    const isFresh = Date.now() - createdAt <= CACHE_WINDOW_MS;
    return isFresh ? data.answer : null;
  } catch (error) {
    console.error('Unexpected error when reading Tavily cache:', error);
    return null;
  }
};

const saveToCache = async (query: string, answer: string): Promise<void> => {
  if (!supabaseCacheClient) return;

  try {
    const { error } = await supabaseCacheClient
      .from('tavily_cache')
      .insert({ query, answer });

    if (error) {
      console.error('Failed to save Tavily cache:', error);
    }
  } catch (error) {
    console.error('Unexpected error when saving Tavily cache:', error);
  }
};

const fetch_stockanalysis_financials = async (ticker: string): Promise<string> => {
  console.warn(`Fallback fetch_stockanalysis_financials triggered for ticker ${ticker}. Not implemented.`);
  return `Fallback financials for ${ticker}: Not implemented.`;
};

// Formaterar Tavily-svaret till ett GPT-vänligt textblock enligt önskad struktur.
const formatTavilyResults = (data: TavilySearchResponse | null): string => {
  if (!data) return '';

  const sections: string[] = [];

  if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
    sections.push(`Sammanfattning: ${data.answer.trim()}`);
  }

  if (Array.isArray(data.results) && data.results.length > 0) {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const filtered = data.results
      .filter(result => {
        if (!result?.published_date) return true;
        const timestamp = new Date(result.published_date).getTime();
        return !Number.isNaN(timestamp) && timestamp >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a?.published_date ? new Date(a.published_date).getTime() : 0;
        const dateB = b?.published_date ? new Date(b.published_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);

    if (filtered.length > 0) {
      const formattedResults = filtered.map((result, index) => {
        const title = result?.title?.trim() ?? `Resultat ${index + 1}`;
        const snippet = (result?.content ?? result?.snippet ?? '').trim();
        const publishedDate = result?.published_date
          ? new Date(result.published_date).toISOString().split('T')[0]
          : 'Okänt datum';
        const url = result?.url ?? '';

        const lines: string[] = [`${index + 1}. ${title} (${publishedDate})`];
        if (snippet) {
          lines.push(`   ${snippet}`);
        }
        if (url) {
          lines.push(`   Källa: ${url}`);
        }
        return lines.join('\n');
      });

      sections.push(formattedResults.join('\n'));
    }
  }

  return sections.length > 0
    ? `\n\n📰 Realtidskontext från Tavily\n${sections.join('\n\n')}`
    : '';
};

type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

const fetchTavilyContext = async (message: string): Promise<string> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över realtidssökning.');
    return '';
  }

  const shouldTranslate = isLikelySwedish(message);
  const normalizedMessage = shouldTranslate
    ? await translateToEnglishIfNeeded(message)
    : message;

  // Dynamisk query + sökdjup för mer precisa Tavily-anrop.
  const { query, ticker } = await buildTavilyQuery(normalizedMessage);
  const searchDepth = getSearchDepth(normalizedMessage);

  console.log(`Tavily query byggd (${searchDepth}):`, query);

  // Återanvänd cache om samma fråga ställts senaste 12 timmarna.
  const cachedAnswer = await fetchFromCache(query);
  if (cachedAnswer) {
    console.log('Tavily cacheträff – återanvänder tidigare svar.');
    return cachedAnswer;
  }

  // Förbered payload för Tavily-anropet.
  const payload = {
    api_key: tavilyApiKey,
    query,
    search_depth: searchDepth,
    include_answer: true,
    include_raw_content: false,
    max_results: 5,
  };

  let tavilyData: TavilySearchResponse | null = null;
  const maxAttempts = 2;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

      console.log(`Tavily-anrop försök #${attempt}`);

      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Tavily svarade med fel (${response.status}):`, errorText);
          if (response.status >= 500 && attempt < maxAttempts) {
            const backoff = 1000 * Math.pow(2, attempt - 1);
            console.log(`Väntar ${backoff} ms innan nästa försök...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            continue;
          }
          return '';
        }

        const data = await response.json() as TavilySearchResponse;
        const hasContent = Boolean(data?.answer && data.answer.trim().length > 0) ||
          (Array.isArray(data?.results) && data.results.length > 0);

        if (!hasContent) {
          console.warn('Tavily returnerade tomt svar.');
          if (attempt < maxAttempts) {
            const backoff = 1000 * Math.pow(2, attempt - 1);
            console.log(`Väntar ${backoff} ms innan nästa försök...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            continue;
          }
        } else {
          tavilyData = data;
          break;
        }
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Tavily-anrop avbrutet efter timeout.');
        } else {
          console.error('Undantag vid anrop till Tavily API:', error);
        }

        if (attempt < maxAttempts) {
          const backoff = 1000 * Math.pow(2, attempt - 1);
          console.log(`Väntar ${backoff} ms innan nästa försök...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    const formatted = formatTavilyResults(tavilyData);

    if (formatted.trim().length > 0) {
      await saveToCache(query, formatted);
      return formatted;
    }

    if (ticker) {
      console.log('Tavily saknade relevant innehåll – använder fallback mot StockAnalysis.');
      return await fetch_stockanalysis_financials(ticker);
    }

    return '';
  } catch (error) {
    console.error('Undantag vid anrop till Tavily API:', error);
    return '';
  }
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

    if (!message || !userId) {
      console.error('Missing required fields:', { message: !!message, userId: !!userId });
      throw new Error('Message and userId are required');
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
- Avsluta med en öppen-relaterad fråga för att uppmuntra fortsatt dialog
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