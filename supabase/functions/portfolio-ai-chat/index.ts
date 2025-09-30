import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REALTIME_KEYWORDS = [
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

    // Check if this is a stock exchange request
    const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|amerikanska|svenska|europeiska|asiatiska|aktier|innehav)/i.test(message);
    
    // Enhanced stock detection - detect both analysis requests AND stock mentions
    const stockMentionPatterns = [
      // Direct stock mentions with company names
      /(?:investor|volvo|ericsson|sandvik|atlas|kinnevik|hex|alfa laval|skf|telia|seb|handelsbanken|nordea|abb|astra|electrolux|husqvarna|getinge|boliden|ssab|stora enso|svenska cellulosa|lund|billerud|holmen|nibe|beijer|essity|kindred|evolution|betsson|net entertainment|fingerprint|sinch|tobii|xvivo|medivir|orexo|camurus|diamyd|raysearch|elekta|sectra|bactiguard|vitrolife|bioinvent|immunovia|hansa|cantargia|oncopeptides|wilson therapeutics|solberg|probi|biovica|addlife|duni|traction|embracer|stillfront|paradox|starbreeze|remedy|gaming|saab|h&m|hennes|mauritz|getinge|elekta|assa abloy|atlas copco|epiroc|trelleborg|lifco|indutrade|fagerhult|munters|sweco|ramboll|hexagon|addtech|bufab|nolato|elanders)/i,
      // Ticker symbols (2-6 characters)
      /\b([A-Z]{2,6})(?:\s|$)/g,
      // Company mentions in investment context
      /(?:köpa|sälja|investera|aktier?|bolag|företag)\s+(?:i\s+)?([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/gi,
      // "aktie + company name" patterns
      /(?:aktien?|bolaget)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/gi,
      // Direct questions about companies
      /(?:vad tycker du om|hur ser du på|bra aktie|dålig aktie|köpvärd|sälj)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/gi
    ];
    
    const isStockAnalysisRequest = /(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) && 
      /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity)/i.test(message);
      
    // Check for stock mentions in user message
    const stockMentionsInMessage = stockMentionPatterns.some(pattern => pattern.test(message));
    const isStockMentionRequest = stockMentionsInMessage || isStockAnalysisRequest;
     
    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    // Fetch real-time market data if stock analysis or stock mention request
    let marketDataContext = '';
    if (isStockMentionRequest) {
      try {
        const { data: marketData } = await supabase.functions.invoke('fetch-market-data');
        if (marketData) {
          marketDataContext = `\n\nREALTIDSMARKNADSDATA:
- Senaste uppdatering: ${marketData.lastUpdated}
- Marknadsindex: ${JSON.stringify(marketData.marketIndices?.slice(0, 3) || [])}
- Toppresterande aktier: ${JSON.stringify(marketData.topStocks?.slice(0, 5) || [])}`;
        }
      } catch (error) {
        console.log('Could not fetch market data:', error);
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

    // ENHANCED INTENT ROUTING SYSTEM
    const detectIntent = (message: string) => {
      const msg = message.toLowerCase();
      
      // Stock/Company Analysis Intent - enhanced to catch more stock mentions
      if (isStockMentionRequest || 
          (/(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) && 
          /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity|[A-Z]{3,5})/i.test(message))) {
        return 'stock_analysis';
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

PERSONA & STIL:
- Professionell men konverserande ton, som en erfaren rådgivare som bjuder in till dialog
- Anpassa svarens längd: ge korta, konkreta svar (2–5 meningar) om frågan är enkel
- Använd längre strukturerade svar (Situation, Strategi, Risker, Åtgärder) endast när användaren explicit ber om en detaljerad plan
- Ge alltid exempel på relevanta aktier/fonder med symboler när det är lämpligt
- Om användaren har kassa eller månadssparande → ge alltid ett allokeringsförslag
- Använd svensk finansterminologi och marknadskontext
- Avsluta svar med en öppen fråga för att uppmuntra fortsatt dialog
- Inkludera alltid en **Disclaimer** om utbildningssyfte

PERSONALISERING:
- Utnyttja aiMemory, senaste chatHistory och portföljdata för att bygga vidare på tidigare resonemang och undvika upprepningar.
- Lyft fram nya eller förändrade datapunkter (exempelvis största portföljförändringen, nya mål eller transaktioner).
- Om något redan behandlats – markera det kort och erbjud en ny vinkel eller fördjupning istället för att repetera.`;

const intentPrompts = {
  stock_analysis: `
AKTIEANALYSUPPGIFT:
Om användaren nämner specifika aktier eller företag - GE ALLTID KONKRETA AKTIEFÖRSLAG!
- Välj en unik infallsvinkel (t.ex. fundamental värdering, tekniska nivåer, kassaflöde eller scenarioanalys) som passar frågan och användarens portfölj.
- Anpassa rubriker/emojis efter vinkeln och hoppa över delar som inte tillför värde.

**VIKTIGT: När du rekommenderar aktier, använd ALLTID denna exakta format så att systemet kan fånga upp dem:**
**Företagsnamn (TICKER)** - Kort motivering

Exempel:
**Evolution AB (EVO)** - Stark position inom online gaming
**Investor AB (INVE-B)** - Diversifierat investmentbolag  
**Volvo AB (VOLV-B)** - Stabil lastbilstillverkare

Föreslagen struktur (anpassa fritt, kombinera rubriker eller hoppa över de som inte är relevanta):

🏢 FÖRETAGSÖVERSIKT
[Beskriv bolaget, dess affärsmodell, styrkor och marknadsposition]

📊 FINANSIELL ANALYS
[Sammanfatta intäkter, lönsamhet, skuldsättning och kassaflöde]

📈 VÄRDERING & KURSUTVECKLING
[Diskutera P/E-tal, substansvärde, historisk kursutveckling, tekniska nivåer]

🎯 INVESTERINGSREKOMMENDATION
[Ge KÖP/BEHÅLL/SÄLJ med tydlig motivering, samt ev. kursmål och tidshorisont]
[Inkludera ALLTID relaterade aktieförslag i formatet **Företag (TICKER)**]

⚠️ RISKER & MÖJLIGHETER
[List de största riskerna och möjligheterna kopplat till aktien]

💡 SLUTSATS & RELATERADE FÖRSLAG
[Sammanfatta och ge 2-3 relaterade aktieförslag i formatet **Företag (TICKER)**]

Avsluta alltid med en **öppen fråga** för att bjuda in till dialog.
Inkludera en **Disclaimer** om att råden är i utbildningssyfte.`,


  portfolio_optimization: `
PORTFÖLJOPTIMERINGSUPPGIFT:
- Välj en unik infallsvinkel (t.ex. riskbalans, kassaflödesbehov, scenarioplanering eller taktisk omallokering) baserat på portföljen och frågan.
- Identifiera överexponering och luckor
- Föreslå omviktningar med procentsatser
- Om kassa eller månadssparande finns: inkludera allokeringsförslag
- Ge enklare prioriteringssteg, men inte hela planen direkt
- Anpassa rubriker och hoppa över sådant som inte är relevant`,

  buy_sell_decisions: `
KÖP/SÄLJ-BESLUTSUPPGIFT:
- Välj en vinkel (t.ex. katalysatorer, värderingsdrivare, tekniskt läge eller kassaflödespåverkan) för att göra resonemanget unikt.
- Bedöm om tidpunkten är lämplig
- Ange för- och nackdelar
- Föreslå positionsstorlek i procent
- Avsluta med en fråga tillbaka till användaren
- Hoppa över sektioner som inte tillför värde`,

  market_analysis: `
MARKNADSANALYSUPPGIFT:
- Välj en tydlig huvudvinkel (makroläge, räntesituation, sektorsrotation eller sentiment) utifrån användarens behov.
- Analysera trender kortfattat
- Beskriv påverkan på användarens portfölj
- Ge 1–2 möjliga justeringar
- Avsluta med fråga om användaren vill ha en djupare analys
- Anpassa struktur och hoppa över irrelevanta rubriker`,

  general_advice: `
ALLMÄN INVESTERINGSRÅDGIVNING:
- Välj en unik infallsvinkel (t.ex. långsiktigt sparmål, kassaflöde, tekniska nivåer eller scenario) för att individualisera svaret.
- Ge råd i 2–4 meningar
- Inkludera ALLTID konkreta aktieförslag i formatet **Företagsnamn (TICKER)** när relevant
- Anpassa förslag till användarens riskprofil och intressen
- Avsluta med öppen fråga för att driva dialog
- Rubriker är valfria – använd dem endast när de tillför klarhet

**VIKTIGT: Använd ALLTID denna exakta format för aktieförslag:**
**Företagsnamn (TICKER)** - Kort motivering`
};

contextInfo += intentPrompts[userIntent] || intentPrompts.general_advice;

    if (conversationData && typeof conversationData === 'object' && Object.keys(conversationData).length > 0) {
      type ConversationSection = { title: string; lines: string[] };
      const sections: ConversationSection[] = [];
      const toText = (value: unknown): string => {
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value.toString() : '';
        }
        if (typeof value === 'string') {
          return value.trim();
        }
        return '';
      };

      const profileLines: string[] = [];
      if (typeof conversationData.isBeginnerInvestor === 'boolean') {
        profileLines.push(`Erfarenhet: ${conversationData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'}`);
      }
      const ageText = toText(conversationData.age);
      if (ageText) {
        profileLines.push(`Ålder: ${ageText}`);
      }
      const investmentGoalText = toText(conversationData.investmentGoal);
      if (investmentGoalText) {
        profileLines.push(`Investeringsmål: ${investmentGoalText}`);
      }
      const timeHorizonText = toText(conversationData.timeHorizon);
      if (timeHorizonText) {
        profileLines.push(`Tidshorisont: ${timeHorizonText}`);
      }
      const riskToleranceText = toText(conversationData.riskTolerance);
      if (riskToleranceText) {
        profileLines.push(`Risktolerans: ${riskToleranceText}`);
      }
      if (profileLines.length > 0) {
        sections.push({ title: 'PROFIL & MÅL', lines: profileLines });
      }

      const cashflowLines: string[] = [];
      const monthlyAmountText = toText(conversationData.monthlyAmount);
      if (monthlyAmountText) {
        cashflowLines.push(`Månatligt sparande: ${monthlyAmountText}`);
      }
      const monthlyIncomeText = toText(conversationData.monthlyIncome);
      if (monthlyIncomeText) {
        cashflowLines.push(`Månadsinkomst: ${monthlyIncomeText}`);
      }
      const availableCapitalText = toText(conversationData.availableCapital);
      if (availableCapitalText) {
        cashflowLines.push(`Tillgängligt kapital: ${availableCapitalText}`);
      }
      const emergencyFundText = toText(conversationData.emergencyFund);
      if (emergencyFundText) {
        cashflowLines.push(`Buffert: ${emergencyFundText}`);
      }
      if (Array.isArray(conversationData.financialObligations) && conversationData.financialObligations.length > 0) {
        cashflowLines.push(`Ekonomiska förpliktelser: ${conversationData.financialObligations.join(', ')}`);
      }
      if (cashflowLines.length > 0) {
        sections.push({ title: 'KASSA & KASSAFLÖDE', lines: cashflowLines });
      }

      const preferenceLines: string[] = [];
      if (Array.isArray(conversationData.interests) && conversationData.interests.length > 0) {
        preferenceLines.push(`Personliga intressen: ${conversationData.interests.join(', ')}`);
      }
      if (Array.isArray(conversationData.companies) && conversationData.companies.length > 0) {
        preferenceLines.push(`Favoritbolag: ${conversationData.companies.join(', ')}`);
      }
      const investmentStyleText = toText(conversationData.investmentStyle);
      if (investmentStyleText) {
        preferenceLines.push(`Investeringsstil: ${investmentStyleText}`);
      }
      if (typeof conversationData.volatilityComfort === 'number' && Number.isFinite(conversationData.volatilityComfort)) {
        preferenceLines.push(`Komfort med volatilitet: ${conversationData.volatilityComfort}/10`);
      } else {
        const volatilityComfortText = toText(conversationData.volatilityComfort);
        if (volatilityComfortText) {
          preferenceLines.push(`Komfort med volatilitet: ${volatilityComfortText}`);
        }
      }
      const sustainabilityText = toText(conversationData.sustainabilityPreference);
      if (sustainabilityText) {
        preferenceLines.push(`Hållbarhetsfokus: ${sustainabilityText}`);
      }
      const geographicText = toText(conversationData.geographicPreference);
      if (geographicText) {
        preferenceLines.push(`Geografisk preferens: ${geographicText}`);
      }
      const dividendRequirementText = toText(conversationData.dividendYieldRequirement);
      if (dividendRequirementText) {
        preferenceLines.push(`Direktavkastningskrav: ${dividendRequirementText}`);
      }
      if (preferenceLines.length > 0) {
        sections.push({ title: 'PREFERENSER & STIL', lines: preferenceLines });
      }

      const portfolioLines: string[] = [];
      if (typeof conversationData.hasCurrentPortfolio === 'boolean') {
        portfolioLines.push(`Har befintlig portfölj: ${conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}`);
      }
      const portfolioSizeText = toText(conversationData.portfolioSize);
      if (portfolioSizeText) {
        portfolioLines.push(`Portföljstorlek: ${portfolioSizeText}`);
      }
      const currentAllocationText = toText(conversationData.currentAllocation);
      if (currentAllocationText) {
        portfolioLines.push(`Nuvarande allokering: ${currentAllocationText}`);
      }
      const previousPerformanceText = toText(conversationData.previousPerformance);
      if (previousPerformanceText) {
        portfolioLines.push(`Historisk prestanda: ${previousPerformanceText}`);
      }
      if (Array.isArray(conversationData.sectorExposure) && conversationData.sectorExposure.length > 0) {
        portfolioLines.push(`Sektorexponering: ${conversationData.sectorExposure.join(', ')}`);
      }
      const rebalancingFrequencyText = toText(conversationData.rebalancingFrequency);
      if (rebalancingFrequencyText) {
        portfolioLines.push(`Rebalanseringsfrekvens: ${rebalancingFrequencyText}`);
      }
      if (Array.isArray(conversationData.currentHoldings) && conversationData.currentHoldings.length > 0) {
        const holdingSummaries = conversationData.currentHoldings
          .map((holding: { name?: string; symbol?: string; quantity?: string | number; purchasePrice?: string | number }) => {
            const parts: string[] = [];
            if (typeof holding?.name === 'string' && holding.name.trim().length > 0) {
              parts.push(holding.name.trim());
            }
            if (typeof holding?.symbol === 'string' && holding.symbol.trim().length > 0) {
              parts.push(`(${holding.symbol.trim().toUpperCase()})`);
            }
            const quantity = typeof holding?.quantity === 'string' || typeof holding?.quantity === 'number'
              ? String(holding.quantity).trim()
              : '';
            const price = typeof holding?.purchasePrice === 'string' || typeof holding?.purchasePrice === 'number'
              ? String(holding.purchasePrice).trim()
              : '';
            const meta: string[] = [];
            if (quantity) meta.push(`${quantity} st`);
            if (price) meta.push(`à ${price} SEK`);
            if (meta.length > 0) {
              parts.push(meta.join(' '));
            }
            return parts.join(' ').trim();
          })
          .filter((summary) => summary.length > 0);
        if (holdingSummaries.length > 0) {
          portfolioLines.push(`Nuvarande innehav: ${holdingSummaries.join(', ')}`);
        }
      }
      if (portfolioLines.length > 0) {
        sections.push({ title: 'PORTFÖLJ & POSITIONER', lines: portfolioLines });
      }

      const behaviourLines: string[] = [];
      const marketCrashReactionText = toText(conversationData.marketCrashReaction);
      if (marketCrashReactionText) {
        behaviourLines.push(`Reaktion på börsfall: ${marketCrashReactionText}`);
      }
      if (typeof conversationData.maxDrawdownTolerance === 'number' && Number.isFinite(conversationData.maxDrawdownTolerance)) {
        behaviourLines.push(`Max drawdown-tolerans: ${conversationData.maxDrawdownTolerance}/10`);
      } else {
        const maxDrawdownText = toText(conversationData.maxDrawdownTolerance);
        if (maxDrawdownText) {
          behaviourLines.push(`Max drawdown-tolerans: ${maxDrawdownText}`);
        }
      }
      const portfolioHelpText = toText(conversationData.portfolioHelp);
      if (portfolioHelpText) {
        behaviourLines.push(`Behov av portföljhjälp: ${portfolioHelpText}`);
      }
      const marketExperienceText = toText(conversationData.marketExperience);
      if (marketExperienceText) {
        behaviourLines.push(`Marknadserfarenhet: ${marketExperienceText}`);
      }
      const specificGoalAmountText = toText(conversationData.specificGoalAmount);
      if (specificGoalAmountText) {
        behaviourLines.push(`Specifikt målbelopp: ${specificGoalAmountText}`);
      }
      if (behaviourLines.length > 0) {
        sections.push({ title: 'BETEENDE & PRIORITERINGAR', lines: behaviourLines });
      }

      if (sections.length > 0) {
        contextInfo += `\n\nKONSULTATIONSDATA (HÄMTA FRÅN SENASTE RÅDGIVNINGEN):`;
        sections.forEach((section) => {
          contextInfo += `\n- ${section.title}:`;
          section.lines.forEach((line) => {
            contextInfo += `\n  • ${line}`;
          });
        });
        contextInfo += `\n- Utnyttja dessa datapunkter för att välja en ny infallsvinkel (t.ex. kassaflöde, riskbalans, scenario) och knyt råden till användarens läge utan att upprepa tidigare svar.`;
      }
    }

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

    if (aiMemory && typeof aiMemory === 'object') {
      const memoryLines: string[] = [];

      const communicationStyleRaw = typeof aiMemory.communication_style === 'string'
        ? aiMemory.communication_style.trim().toLowerCase()
        : '';
      const communicationStyleDescription = communicationStyleRaw === 'detailed'
        ? 'Uppskattar när du resonerar i detalj med tydliga mellanrubriker.'
        : communicationStyleRaw === 'concise'
          ? 'Föredrar raka och koncisa svar utan onödiga utvikningar.'
          : communicationStyleRaw;
      if (communicationStyleDescription) {
        memoryLines.push(`- Kommunikationsstil: ${communicationStyleDescription}`);
      }

      const preferredLengthRaw = typeof aiMemory.preferred_response_length === 'string'
        ? aiMemory.preferred_response_length.trim().toLowerCase()
        : '';
      const preferredLengthDescription = preferredLengthRaw === 'detailed'
        ? 'Ge gärna längre, uppbyggda svar med fler resonemangsexempel.'
        : preferredLengthRaw === 'concise'
          ? 'Håll resonemangen korta och fokuserade.'
          : preferredLengthRaw;
      if (preferredLengthDescription) {
        memoryLines.push(`- Önskad svarslängd: ${preferredLengthDescription}`);
      }

      const favoriteSectors = Array.isArray(aiMemory.favorite_sectors)
        ? aiMemory.favorite_sectors
        : typeof aiMemory.favorite_sectors === 'string'
          ? aiMemory.favorite_sectors.split(',').map((sector: string) => sector.trim()).filter(Boolean)
          : [];
      if (favoriteSectors.length > 0) {
        memoryLines.push(`- Favoritsektorer: ${favoriteSectors.join(', ')}`);
      }

      const preferredCompanies = Array.isArray(aiMemory.preferred_companies)
        ? aiMemory.preferred_companies
        : typeof aiMemory.preferred_companies === 'string'
          ? aiMemory.preferred_companies.split(',').map((company: string) => company.trim()).filter(Boolean)
          : [];
      if (preferredCompanies.length > 0) {
        memoryLines.push(`- Favoritbolag att återkoppla till: ${preferredCompanies.join(', ')}`);
      }

      const currentGoals = Array.isArray(aiMemory.current_goals)
        ? aiMemory.current_goals
        : typeof aiMemory.current_goals === 'string'
          ? aiMemory.current_goals.split(',').map((goal: string) => goal.trim()).filter(Boolean)
          : [];
      if (currentGoals.length > 0) {
        memoryLines.push(`- Aktuella mål: ${currentGoals.join(', ')}`);
      }

      const recurringTopics = Array.isArray(aiMemory.frequently_asked_topics)
        ? aiMemory.frequently_asked_topics
        : typeof aiMemory.frequently_asked_topics === 'string'
          ? aiMemory.frequently_asked_topics.split(',').map((topic: string) => topic.trim()).filter(Boolean)
          : [];
      if (recurringTopics.length > 0) {
        memoryLines.push(`- Återkommande teman: ${recurringTopics.join(', ')}`);
      }

      if (memoryLines.length > 0) {
        contextInfo += `\n\nAI-MINNESANTECKNINGAR (ANVÄND FÖR VARIATION):`;
        memoryLines.forEach(line => {
          contextInfo += `\n${line}`;
        });
        contextInfo += `\n- Använd dessa preferenser för att variera ton, exempel och vinklar så att svaret känns personligt och inte upprepar tidigare svar.`;
      }
    }

// Add response structure requirements
contextInfo += `\n\nSVARSSTRUKTUR (REKOMMENDERAD OCH ANPASSNINGSBAR):
- Anpassa svar efter frågans komplexitet
- Vid enkla frågor: ge ett kort konversationssvar (2–5 meningar) och avsluta med en öppen motfråga
- Vid mer komplexa frågor eller när användaren ber om en detaljerad plan: använd elementen nedan i den ordning som passar bäst
- Variera rubriker och emojis (synonymer, nya kombinationer) för att hålla svaren levande och individanpassade
- Välj en tydlig huvudvinkel i varje svar (fundamental, teknisk, kassaflöde, scenario m.m.) och låt den styra valet av sektioner

EMOJI-REGLER:
- Vid aktieanalys: Använd relevanta emojis för att göra svaret mer engagerande
- Exempel: 📈 för positiva trender, 📉 för negativa, 💼 för företag, ⚠️ för risker, 🎯 för mål, 💡 för tips, 🔍 för analys, 🌟 för rekommendationer, 💪 för starka positioner, ⚖️ för balans, 🚀 för tillväxt

FÖRSLAG PÅ SEKTIONER (plocka de som passar, kombinera eller byt namn vid behov):

**Situation & Analys** 🔍
[Kort sammanfattning av situationen/frågan]

**Rekommendation** 🌟
[Konkreta råd med specifika aktier/fonder och symboler där relevant]

**Risker & Överväganden** ⚠️
[Viktiga risker och faktorer att beakta]

**Åtgärdsplan / Checklista** 📋
□ [Konkret åtgärd 1]
□ [Konkret åtgärd 2]
□ [Konkret åtgärd 3]

**Disclaimer:** Detta är endast i utbildningssyfte. Konsultera alltid en licensierad rådgivare.

VIKTIGT:
- Ta endast med "Åtgärdsplan / Checklista" när frågan kräver konkreta steg.
- Vid aktieanalys: Använd emojis genomgående för att göra analysen mer visuellt tilltalande och lättläst
- Avsluta alltid svaret med en öppen fråga för att bjuda in till vidare dialog.`;


    // Force using gpt-4o to avoid streaming restrictions and reduce cost
    const model = 'gpt-4o';

    console.log('Selected model:', model, 'for request type:', {
      isStockAnalysis: isStockAnalysisRequest,
      isPortfolioOptimization: isPortfolioOptimizationRequest,
      messageLength: message.length,
      historyLength: chatHistory.length
    });

    // Build messages array with enhanced context
    let tavilyContext = '';
    if (requiresRealTimeSearch(message)) {
      console.log('Fråga upptäckt som realtidsfråga – anropar Tavily.');
      tavilyContext = await fetchTavilyContext(message);
      if (tavilyContext) {
        console.log('Tavily-kontent hämtad och läggs till i kontexten.');
      }
    }

    const messages = [
      { role: 'system', content: contextInfo + marketDataContext + tavilyContext },
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
      hasMarketData: !!marketDataContext,
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
              hasMarketData: !!marketDataContext,
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
                          hasMarketData: !!marketDataContext,
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