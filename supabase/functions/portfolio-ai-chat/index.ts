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

const SOFT_REALTIME_KEYWORDS = [
  'idag',
  'just nu',
  'today',
  'current'
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
  raw_content?: string;
};

type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

type TavilyContextPayload = {
  formattedContext: string;
  sources: string[];
};

type TavilySearchDepth = 'basic' | 'advanced';

type TavilySearchOptions = {
  query?: string;
  includeDomains?: string[];
  searchDepth?: TavilySearchDepth;
  maxResults?: number;
  includeRawContent?: boolean;
};

type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

const formatTavilyResults = (data: TavilySearchResponse | null): TavilyContextPayload => {
  if (!data) {
    return { formattedContext: '', sources: [] };
  }

  const sections: string[] = [];
  const sourceSet = new Set<string>();

  if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
    sections.push(`Sammanfattning från realtidssökning: ${data.answer.trim()}`);
  }

  if (Array.isArray(data.results)) {
    const topResults = data.results.slice(0, 3);
    if (topResults.length > 0) {
      const resultLines = topResults.map((result: TavilySearchResult, index: number) => {
        const title = typeof result.title === 'string' ? result.title : `Resultat ${index + 1}`;
        const snippetSource = typeof result.raw_content === 'string' && result.raw_content.trim().length > 0
          ? result.raw_content
          : typeof result.content === 'string' && result.content.trim().length > 0
            ? result.content
            : result.snippet;
        const trimmedSnippet = typeof snippetSource === 'string' ? snippetSource.trim() : '';
        const safeSnippet = trimmedSnippet.length > 900
          ? `${trimmedSnippet.slice(0, 900)}…`
          : trimmedSnippet;
        const url = typeof result.url === 'string' ? result.url : '';
        const publishedDate = typeof result.published_date === 'string' ? result.published_date : '';

        const parts = [`• ${title}`];
        if (publishedDate) {
          parts.push(`(${publishedDate})`);
        }
        if (safeSnippet) {
          parts.push(`- ${safeSnippet}`);
        }
        if (url) {
          sourceSet.add(url);
          parts.push(`Källa: ${url}`);
        }
        return parts.join(' ');
      });
      sections.push('Detaljer från TAVILY-sökning:\n' + resultLines.join('\n'));
    }
  }

  const formattedContext = sections.length > 0
    ? `\n\nExtern realtidskontext:\n${sections.join('\n\n')}`
    : '';

  return {
    formattedContext,
    sources: Array.from(sourceSet),
  };
};

const fetchTavilyContext = async (
  message: string,
  options: TavilySearchOptions = {},
): Promise<TavilyContextPayload> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över realtidssökning.');
    return { formattedContext: '', sources: [] };
  }

  try {
    const payload: Record<string, unknown> = {
      api_key: tavilyApiKey,
      query: options.query ?? message,
      search_depth: options.searchDepth ?? 'basic',
      include_answer: true,
      include_raw_content: options.includeRawContent ?? false,
      max_results: options.maxResults ?? 5,
    };

    if (Array.isArray(options.includeDomains) && options.includeDomains.length > 0) {
      payload.include_domains = options.includeDomains;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fel vid anrop till Tavily API:', errorText);
      return { formattedContext: '', sources: [] };
    }

    const tavilyData = await response.json() as TavilySearchResponse;
    return formatTavilyResults(tavilyData);
  } catch (error) {
    console.error('Undantag vid anrop till Tavily API:', error);
    return { formattedContext: '', sources: [] };
  }
};

const FINANCIAL_DATA_KEYWORDS = [
  'senaste rapport',
  'rapporten',
  'kvartalsrapport',
  'årsrapport',
  'financials',
  'nyckeltal',
  'siffror',
  'resultat',
  'omsättning',
  'intäkter',
  'vinster',
  'vinst',
  'eps',
  'earnings',
  'guidance',
  'prognos',
  'income statement',
  'balance sheet',
  'cash flow',
];

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

    const extractTickerSymbols = (input: string): string[] => {
      const normalizedInput = removeDiacritics(input);
      const tickerMatches = Array.from(normalizedInput.matchAll(/\b([A-Za-z0-9]{1,6})\b/g));
      if (tickerMatches.length === 0) return [];

      const knownTickers = new Set<string>();
      const uppercaseFallback = new Set<string>();

      for (const match of tickerMatches) {
        const rawToken = match[1];
        if (!rawToken) continue;

        const normalizedSymbol = rawToken.toUpperCase();
        const isUppercaseInMessage = rawToken === rawToken.toUpperCase();

        if (sheetTickerSymbolSet.size > 0) {
          if (sheetTickerSymbolSet.has(normalizedSymbol)) {
            knownTickers.add(normalizedSymbol);
          }
        } else if (isUppercaseInMessage) {
          knownTickers.add(normalizedSymbol);
        }

        if (isUppercaseInMessage) {
          uppercaseFallback.add(normalizedSymbol);
        }
      }

      if (knownTickers.size > 0) {
        return Array.from(knownTickers);
      }

      return Array.from(uppercaseFallback);
    };

    const buildStockAnalysisUrlCandidates = (ticker: string): string[] => {
      if (!ticker) return [];

      const trimmed = ticker.trim();
      if (!trimmed) return [];

      const lowercaseTicker = trimmed.toLowerCase();
      const withoutExchange = lowercaseTicker.includes(':')
        ? lowercaseTicker.split(':').pop() ?? lowercaseTicker
        : lowercaseTicker;

      const baseCandidates = new Set<string>([
        withoutExchange,
        withoutExchange.replace(/[^a-z0-9.-]/g, '-'),
        withoutExchange.replace(/[^a-z0-9]/g, ''),
        withoutExchange.replace(/\./g, '-'),
        withoutExchange.replace(/-/g, ''),
      ]);

      const normalizedCandidates = Array.from(baseCandidates)
        .map(candidate => candidate.replace(/-+/g, '-').replace(/^-|-$/g, ''))
        .filter(candidate => candidate.length > 0);

      const uniqueUrls = new Set<string>();
      const addUniqueUrl = (url: string) => {
        if (!uniqueUrls.has(url)) {
          uniqueUrls.add(url);
        }
      };

      const addPathVariants = (base: string) => {
        addUniqueUrl(base);
        if (!base.endsWith('/')) {
          addUniqueUrl(`${base}/`);
        }
      };

      for (const candidate of normalizedCandidates) {
        const baseUrl = `https://stockanalysis.com/stocks/${candidate}`;

        const prioritizedPaths = [
          'financials/metrics',
          'financials/ratios',
          'financials/cash-flow-statement',
          'financials/balance-sheet',
          'financials',
          'financials/quarterly',
          'financials/income-statement',
          'financials/cash-flow',
          '',
          'earnings',
        ];

        for (const path of prioritizedPaths) {
          const trimmedPath = path.replace(/\/+$/g, '');
          if (trimmedPath.length === 0) {
            addPathVariants(baseUrl);
            continue;
          }

          addPathVariants(`${baseUrl}/${trimmedPath}`);
        }
      }

      return Array.from(uniqueUrls);
    };

    const buildStockAnalysisQuery = (ticker: string, urls: string[]): string => {
      const trimmedTicker = ticker.trim();
      const upperTicker = trimmedTicker.toUpperCase();
      let slug = trimmedTicker.toLowerCase();

      const subPathSet = new Set<string>();

      for (const candidateUrl of urls) {
        try {
          const parsed = new URL(candidateUrl);
          if (parsed.hostname.replace(/^www\./, '') !== 'stockanalysis.com') {
            continue;
          }

          const segments = parsed.pathname.split('/').filter(Boolean);
          const stocksIndex = segments.indexOf('stocks');
          if (stocksIndex === -1 || stocksIndex + 1 >= segments.length) {
            continue;
          }

          const slugCandidate = segments[stocksIndex + 1];
          if (slugCandidate) {
            slug = slugCandidate.toLowerCase();
          }

          const subSegments = segments.slice(stocksIndex + 2);
          if (subSegments.length > 0) {
            const subPath = subSegments.join('/').replace(/\/+$/g, '');
            if (subPath) {
              subPathSet.add(subPath);
            }
          }
        } catch (_error) {
          continue;
        }
      }

      const defaultSubPaths = [
        'financials',
        'financials/metrics',
        'financials/ratios',
        'financials/cash-flow-statement',
        'financials/balance-sheet',
      ];

      const subPaths = subPathSet.size > 0
        ? Array.from(subPathSet)
        : defaultSubPaths;

      const limitedSubPaths = subPaths
        .map(path => path.replace(/^\/+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

      const baseUrl = `https://stockanalysis.com/stocks/${slug}`;

      const buildQueryFromPaths = (paths: string[]): string => {
        const pathText = paths.length > 0
          ? ` such as ${paths.join(', ')}`
          : '';

        return [
          `Extract the latest reported financial figures for ${upperTicker} (revenue, EPS, net income, cash flow, margins, debt ratios, guidance).`,
          `Use ${baseUrl} financial pages${pathText}.`,
          'Return the numbers with brief Swedish notes.',
        ].join(' ');
      };

      let query = buildQueryFromPaths(limitedSubPaths);

      while (query.length > 400 && limitedSubPaths.length > 1) {
        limitedSubPaths.pop();
        query = buildQueryFromPaths(limitedSubPaths);
      }

      if (query.length > 400) {
        query = buildQueryFromPaths([]);
      }

      if (query.length > 400) {
        query = `${query.slice(0, 397)}...`;
      }

      return query;
    };

    const fetchStockAnalysisFinancialContext = async (
      ticker: string,
      message: string,
    ): Promise<TavilyContextPayload> => {
      const urlCandidates = buildStockAnalysisUrlCandidates(ticker);
      if (urlCandidates.length === 0) {
        return { formattedContext: '', sources: [] };
      }

      console.log('Tavily StockAnalysis-förfrågan, prioriterade URL:er:', urlCandidates.slice(0, 6));

      const targetedQuery = buildStockAnalysisQuery(ticker, urlCandidates);

      const targetedContext = await fetchTavilyContext(message, {
        query: targetedQuery,
        includeDomains: ['stockanalysis.com'],
        searchDepth: 'advanced',
        maxResults: 5,
        includeRawContent: true,
      });

      return targetedContext;
    };

    const detectedTickers = extractTickerSymbols(message);
    const primaryDetectedTicker = detectedTickers.length > 0 ? detectedTickers[0] : null;

    const hasTickerSymbolMention = (() => {
      if (detectedTickers.length === 0) return false;

      const tokens = message.trim().split(/\s+/);
      const allTokensAreTickers = tokens.length > 0 && tokens.every(token => detectedTickers.includes(token.toUpperCase()));

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

    const lowerCaseMessage = message.toLowerCase();
    const matchedRealTimeKeywords = REALTIME_KEYWORDS.filter(keyword => lowerCaseMessage.includes(keyword));
    const hasOnlySoftRealTimeKeywords = matchedRealTimeKeywords.length > 0 &&
      matchedRealTimeKeywords.every(keyword =>
        SOFT_REALTIME_KEYWORDS.some(softKeyword => keyword === softKeyword)
      );
    const rawRealTimeRequest = requiresRealTimeSearch(message);
    const requiresRealTimeLookup = rawRealTimeRequest && !hasOnlySoftRealTimeKeywords;
    const isFinancialDataRequest = FINANCIAL_DATA_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));

    const isStockMentionRequest = stockMentionsInMessage || isStockAnalysisRequest || (isFinancialDataRequest && detectedTickers.length > 0);
     
    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    // Fetch Tavily context when the user mentions stocks or requests real-time insights
    let tavilyContext: TavilyContextPayload = { formattedContext: '', sources: [] };

    const isSimplePersonalAdviceRequest = (
      isPersonalAdviceRequest || isPortfolioOptimizationRequest
    ) &&
      !isStockMentionRequest &&
      !requiresRealTimeLookup &&
      detectedTickers.length === 0;

    const shouldFetchTavily = !isSimplePersonalAdviceRequest && (
      isStockMentionRequest || requiresRealTimeLookup
    );
    if (shouldFetchTavily) {
      const logMessage = isStockMentionRequest
        ? 'Aktieomnämnande upptäckt – anropar Tavily för relevanta nyheter.'
        : 'Fråga upptäckt som realtidsfråga – anropar Tavily.';
      console.log(logMessage);

      const shouldPrioritizeStockAnalysis = primaryDetectedTicker && (isStockAnalysisRequest || isFinancialDataRequest);

      if (shouldPrioritizeStockAnalysis) {
        console.log(`Försöker hämta finansiell data för ${primaryDetectedTicker} från stockanalysis.com.`);
        tavilyContext = await fetchStockAnalysisFinancialContext(primaryDetectedTicker, message);

        if (tavilyContext.formattedContext) {
          console.log('Lyckades hämta data från stockanalysis.com.');
        } else {
          console.log('Inga resultat från stockanalysis.com, försöker med bredare Tavily-sökning.');
          tavilyContext = await fetchTavilyContext(message, { includeRawContent: true });
        }
      } else {
        tavilyContext = await fetchTavilyContext(message, { includeRawContent: true });
      }

      if (tavilyContext.formattedContext) {
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

      const buySellDecisionRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|position|handel)/i.test(message);

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
      
      // Buy/Sell Decisions Intent - prioritize when explicit trade action is requested
      if (buySellDecisionRequest) {
        return 'buy_sell_decisions';
      }

      // Portfolio Rebalancing/Optimization Intent - must outrank generic stock analysis even when tickers are present
      if (/(?:portfölj|portfolio)/i.test(message) && /(?:optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma|rebalansera)/i.test(message)) {
        return 'portfolio_optimization';
      }

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

    const hasMarketData = tavilyContext.formattedContext.length > 0;
    let tavilySourceInstruction = '';
    if (tavilyContext.sources.length > 0) {
      const formattedSourcesList = tavilyContext.sources
        .map((url, index) => `${index + 1}. ${url}`)
        .join('\n');
      tavilySourceInstruction = `\n\nKÄLLHÄNVISNINGAR FÖR AGENTEN:\n${formattedSourcesList}\n\nINSTRUKTION: Avsluta alltid ditt svar med en sektion "Källor:" som listar dessa länkar i samma ordning.`;
    }

    // Build messages array with enhanced context
    const messages = [
      { role: 'system', content: contextInfo + tavilyContext.formattedContext + tavilySourceInstruction },
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
      hasMarketData,
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
              hasMarketData,
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
                          hasMarketData,
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