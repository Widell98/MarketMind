// Tavily service for handling all Tavily search, filtering, and domain rules

import { IntentType } from './intent-types.ts';

// ============================================================================
// Tavily Types
// ============================================================================

export type TavilySearchResult = {
  title?: string;
  content?: string;
  snippet?: string;
  url?: string;
  published_date?: string;
  raw_content?: string;
};

export type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

export type TavilyTopic = 'general' | 'news' | 'finance';

export type TavilyContextPayload = {
  formattedContext: string;
  sources: string[];
  error?: string;
  fallbackUsed?: boolean;
};

export type TavilySearchDepth = 'basic' | 'advanced';

export type TavilyLocalePreference = 'se' | 'global';

export type TavilyLLMPlanInput = {
  message: string;
  entityAwareQuery?: string | null;
  userIntent?: IntentType;
  recentMessages?: string[];
  openAIApiKey: string;
  inlineIntentModel?: string;
};

export type TavilyLLMPlan = {
  shouldSearch: boolean;
  query?: string;
  topic?: TavilyTopic;
  depth?: TavilySearchDepth;
  freshnessDays?: number;
  preferredLocales?: TavilyLocalePreference[];
  reason?: string;
};

export type TavilySearchOptions = {
  query?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  topic?: TavilyTopic;
  timeRange?: string;
  days?: number;
  searchDepth?: TavilySearchDepth;
  maxResults?: number;
  includeRawContent?: boolean;
  timeoutMs?: number;
  requireRecentDays?: number;
  allowUndatedFromDomains?: string[];
};

export type TavilyFormattingOptions = {
  requireRecentDays?: number;
  allowUndatedFromDomains?: string[];
};

// ============================================================================
// Tavily Domain Constants
// ============================================================================

export const SWEDISH_TAVILY_DOMAINS = [
  'di.se',
  'affarsvarlden.se',
  'placera.se',
  'www.placera.se',
  'www.placera.se/skribenter/199',
  'placera.se/skribenter/199',
  'privataaffarer.se',
  'svd.se',
  'dn.se',
  'efn.se',
  'breakit.se',
  'news.cision.com',
];

export const INTERNATIONAL_TAVILY_DOMAINS = [
  'reuters.com',
  'bloomberg.com',
  'ft.com',
  'cnbc.com',
  'wsj.com',
  'marketwatch.com',
  'finance.yahoo.com',
  'investing.com',
  'morningstar.com',
  'marketscreener.com',
  'seekingalpha.com',
  'benzinga.com',
  'globenewswire.com',
  'sec.gov',
];

export const TRUSTED_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

export const SWEDISH_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

export const INTERNATIONAL_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...INTERNATIONAL_TAVILY_DOMAINS,
  ...SWEDISH_TAVILY_DOMAINS,
]));

export const EXTENDED_TAVILY_DOMAINS = Array.from(new Set([
  ...TRUSTED_TAVILY_DOMAINS,
  'marketbeat.com',
  'stockanalysis.com',
  'themotleyfool.com',
  'barrons.com',
  'forbes.com',
  'economist.com',
  'polymarket.com', 
  'kalshi.com'
]));

export const DEFAULT_EXCLUDED_TAVILY_DOMAINS = [
  'reddit.com',
  'www.reddit.com',
  'quora.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'medium.com',
  'stocktwits.com',
  'discord.com',
  'pinterest.com',
];

export const RECENT_NEWS_MAX_DAYS = 3;
export const RECENT_MARKET_NEWS_MAX_DAYS = 7;
export const RECENT_FINANCIAL_DATA_MAX_DAYS = 45;
export const DEFAULT_UNDATED_FINANCIAL_DOMAINS = ['stockanalysis.com'];

// ============================================================================
// Financial Relevance Keywords
// ============================================================================

export const FINANCIAL_RELEVANCE_KEYWORDS = [
  'aktie',
  'aktien',
  'aktier',
  'börs',
  'marknad',
  'marknaden',
  'stock',
  'stocks',
  'share',
  'shares',
  'equity',
  'equities',
  'revenue',
  'omsättning',
  'earnings',
  'vinster',
  'profit',
  'net income',
  'eps',
  'utdelning',
  'dividend',
  'guidance',
  'forecast',
  'prognos',
  'resultat',
  'rapport',
  'kvartal',
  'quarter',
  'valuation',
  'värdering',
  'cash flow',
  'kassaflöde',
  'yield',
  'ränta',
  'interest',
  'inflation',
  'ekonomi',
  'economy',
  'market',
  'markets',
  'investor',
  'investment',
  'analyst',
  'nyckeltal',
  'price',
  'pris',
];

// ============================================================================
// Tavily Router Tool
// ============================================================================

export const TAVILY_ROUTER_TOOL = {
  type: 'function',
  function: {
    name: 'tavily_search',
    description: 'Planera en Tavily-sökning för dagsaktuell finans- eller marknadskontext innan rådgivaren svarar användaren.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Kortfattad sökfras som hjälper Tavily att hitta relevanta nyheter eller rapporter.'
        },
        topic: {
          type: 'string',
          enum: ['general', 'news', 'finance'],
          description: 'Välj "news" för rubriker, "finance" för bolagsspecifika uppdateringar eller "general" vid osäkerhet.'
        },
        depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Ange "advanced" när du behöver längre utdrag eller råinnehåll.'
        },
        freshnessDays: {
          type: 'integer',
          minimum: 1,
          maximum: 30,
          description: 'Maximalt antal dagar bakåt som källorna får vara.'
        },
        preferredLocales: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['se', 'global'],
          },
          description: 'Prioriterade geografiska marknader, t.ex. Sverige (se) eller globalt.'
        },
        reason: {
          type: 'string',
          description: 'Kort svensk motivering till varför realtidsdata behövs.'
        }
      },
      required: ['query'],
    },
  },
} as const;

// ============================================================================
// LLM Planning for Tavily Search
// ============================================================================

export const planRealtimeSearchWithLLM = async ({
  message,
  entityAwareQuery,
  userIntent,
  recentMessages,
  openAIApiKey,
  inlineIntentModel = 'gpt-4o-mini',
}: TavilyLLMPlanInput): Promise<TavilyLLMPlan> => {
  try {
    const routerContext: string[] = [];
    if (userIntent) {
      routerContext.push(`Identifierad intent: ${userIntent}.`);
    }
    if (entityAwareQuery && entityAwareQuery.trim().length > 0) {
      routerContext.push(`Föreslagen sökfras: ${entityAwareQuery.trim()}`);
    }
    if (recentMessages && recentMessages.length > 0) {
      routerContext.push('Tidigare relaterade frågor:\n' + recentMessages.map((entry, index) => `${index + 1}. ${entry}`).join('\n'));
    }

    const routerPrompt = [
      'Du avgör om nästa svar behöver dagsaktuella källor innan rådgivaren svarar kunden.',
      'Om färska nyheter, intradagspris eller senaste rapporter krävs → anropa tavily_search exakt en gång.',
      'Om frågan gäller kommande lanseringar, "releases", spelkalender eller produktpipeline → anropa tavily_search för att hitta uppdaterade listor.',
      'Om äldre kunskap räcker → svara med JSON på formatet {"decision":"skip","reason":"kort svensk motivering"}.',
      'Ange alltid en motivering (på svenska) antingen i JSON:et eller i fältet reason när du anropar verktyget.',
      routerContext.join('\n\n'),
      `Användarens fråga:\n"""${message}"""`,
    ].filter(Boolean).join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: inlineIntentModel,
        temperature: 0,
        max_completion_tokens: 180,
        tool_choice: 'auto',
        tools: [TAVILY_ROUTER_TOOL],
        messages: [
          {
            role: 'system',
            content: 'Du är en researchplanerare som bara ska trigga Tavily vid behov av realtidsdata och annars förklara varför det inte behövs.',
          },
          { role: 'user', content: routerPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('LLM Tavily-router misslyckades med status', response.status);
      return { shouldSearch: false };
    }

    const data = await response.json();
    const choice = data?.choices?.[0]?.message;

    const toolCall = choice?.tool_calls?.find((call: any) => call?.function?.name === 'tavily_search');
    if (toolCall) {
      try {
        const argsRaw = toolCall.function?.arguments ?? '{}';
        const args = JSON.parse(argsRaw);
        const locales = Array.isArray(args?.preferredLocales)
          ? args.preferredLocales
            .map((value: string) => (value === 'se' || value === 'global') ? value : null)
            .filter(Boolean) as TavilyLocalePreference[]
          : undefined;
        const depth = args?.depth === 'advanced' || args?.depth === 'basic'
          ? args.depth
          : undefined;
        const topic = args?.topic === 'news' || args?.topic === 'finance' || args?.topic === 'general'
          ? args.topic
          : undefined;
        const freshnessDaysRaw = typeof args?.freshnessDays === 'number'
          ? args.freshnessDays
          : typeof args?.freshnessDays === 'string'
            ? Number(args.freshnessDays)
            : undefined;
        const freshnessDays = Number.isFinite(freshnessDaysRaw)
          ? Math.min(30, Math.max(1, Math.round(Number(freshnessDaysRaw))))
          : undefined;
        return {
          shouldSearch: true,
          query: typeof args?.query === 'string' ? args.query.trim() : undefined,
          topic,
          depth,
          freshnessDays,
          preferredLocales: locales,
          reason: typeof args?.reason === 'string' ? args.reason.trim() : undefined,
        };
      } catch (error) {
        console.warn('Kunde inte tolka Tavily-verktygsargument:', error);
        return { shouldSearch: true };
      }
    }

    const fallbackContent = typeof choice?.content === 'string' ? choice.content.trim() : '';
    if (fallbackContent) {
      try {
        const parsed = JSON.parse(fallbackContent);
        const normalizedDecision = typeof parsed?.decision === 'string'
          ? parsed.decision.toLowerCase()
          : '';
        const shouldSearch = normalizedDecision === 'search' || normalizedDecision === 'ja' || normalizedDecision === 'yes';
        return {
          shouldSearch,
          reason: typeof parsed?.reason === 'string' ? parsed.reason.trim() : undefined,
        };
      } catch (error) {
        const normalized = fallbackContent.toLowerCase();
        if (normalized.includes('search') || normalized.includes('realtid') || normalized.includes('tavily')) {
          return { shouldSearch: true, reason: fallbackContent };
        }
        return { shouldSearch: false, reason: fallbackContent };
      }
    }

    return { shouldSearch: false };
  } catch (error) {
    console.warn('Fel i LLM-planeringen för Tavily:', error);
    return { shouldSearch: false };
  }
};

// ============================================================================
// Tavily URL and Domain Helpers
// ============================================================================

export const normalizeHostname = (url: string): string | null => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    console.warn('Kunde inte tolka URL från Tavily-resultat:', url, error);
    return null;
  }
};

export const isAllowedDomain = (url: string, allowedDomains: string[]): boolean => {
  if (!url) return false;
  if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return true;
  }

  const hostname = normalizeHostname(url);
  if (!hostname) return false;

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
    return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
  });
};

export const hasFinancialRelevance = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const normalized = text.toLowerCase();
  return FINANCIAL_RELEVANCE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

// ============================================================================
// Tavily Result Formatting
// ============================================================================

const selectSnippetSource = (result: TavilySearchResult): string => {
  const snippetSource = typeof result.raw_content === 'string' && result.raw_content.trim().length > 0
    ? result.raw_content
    : typeof result.content === 'string' && result.content.trim().length > 0
      ? result.content
      : result.snippet;

  return typeof snippetSource === 'string' ? snippetSource.trim() : '';
};

export const formatTavilyResults = (
  data: TavilySearchResponse | null,
  allowedDomains: string[],
  options: TavilyFormattingOptions = {},
): TavilyContextPayload => {
  if (!data) {
    return { formattedContext: '', sources: [] };
  }

  const sections: string[] = [];
  const sourceSet = new Set<string>();
  const { requireRecentDays, allowUndatedFromDomains } = options;
  const requireFreshness = typeof requireRecentDays === 'number'
    && Number.isFinite(requireRecentDays)
    && requireRecentDays > 0;

  const normalizedUndatedDomains = Array.isArray(allowUndatedFromDomains)
    ? allowUndatedFromDomains
      .map(domain => domain.replace(/^www\./, '').toLowerCase())
      .filter(Boolean)
    : [];

  const recencyThresholdMs = requireFreshness
    ? requireRecentDays * 24 * 60 * 60 * 1000
    : 0;
  const nowMs = Date.now();

  const isUndatedAllowed = (url: string): boolean => {
    if (!requireFreshness) return true;
    const hostname = normalizeHostname(url);
    if (!hostname) {
      return false;
    }

    return normalizedUndatedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  };

  const isRecentEnough = (url: string, publishedDate?: string): boolean => {
    if (!requireFreshness) {
      return true;
    }

    if (typeof publishedDate === 'string' && publishedDate.trim().length > 0) {
      const parsed = Date.parse(publishedDate);
      if (!Number.isNaN(parsed)) {
        const ageMs = nowMs - parsed;
        if (ageMs < 0) {
          return true;
        }

        if (ageMs <= recencyThresholdMs) {
          return true;
        }

        console.log('Filtrerar bort Tavily-resultat som är äldre än tillåten gräns:', url, 'datum:', publishedDate);
        return false;
      }

      console.log('Kunde inte tolka publiceringsdatum för Tavily-resultat:', url, 'datum:', publishedDate);
      return isUndatedAllowed(url);
    }

    if (!isUndatedAllowed(url)) {
      console.log('Filtrerar bort Tavily-resultat utan publiceringsdatum när färska källor krävs:', url);
      return false;
    }

    return true;
  };

  if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
    sections.push(`Sammanfattning från realtidssökning: ${data.answer.trim()}`);
  }

  if (Array.isArray(data.results)) {
    const filteredResults = data.results
      .filter((result: TavilySearchResult) => {
        const url = typeof result.url === 'string' ? result.url : '';
        if (!url || !isAllowedDomain(url, allowedDomains)) {
          if (url) {
            console.log('Filtrerar bort otillåten domän från Tavily-resultat:', url);
          }
          return false;
        }

        const snippetText = selectSnippetSource(result);
        const combinedText = [result.title, snippetText].filter(Boolean).join(' ');
        if (!combinedText) {
          console.log('Filtrerar bort Tavily-resultat utan relevant innehåll:', url);
          return false;
        }

        const hasRelevance = hasFinancialRelevance(combinedText);
        if (!hasRelevance && combinedText.length < 60) {
          console.log('Filtrerar bort Tavily-resultat med låg finansiell relevans:', url);
          return false;
        }

        if (!isRecentEnough(url, result.published_date)) {
          return false;
        }

        return true;
      })
      .slice(0, 3);

    if (filteredResults.length > 0) {
      const resultLines = filteredResults.map((result: TavilySearchResult, index: number) => {
        const title = typeof result.title === 'string' ? result.title : `Resultat ${index + 1}`;
        const trimmedSnippet = selectSnippetSource(result);
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

// ============================================================================
// Main Tavily Context Fetcher
// ============================================================================

export const fetchTavilyContext = async (
  message: string,
  options: TavilySearchOptions = {},
): Promise<TavilyContextPayload & { error?: string; fallbackUsed?: boolean }> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över realtidssökning.');
    return { formattedContext: '', sources: [], error: 'API key missing', fallbackUsed: true };
  }

  // Öka timeout-tiden för obegränsade sökningar (releaser) som kan ta längre tid
  const isUnrestrictedSearch = Array.isArray(options.includeDomains) && options.includeDomains.length === 0;
  const defaultTimeout = isUnrestrictedSearch ? 15000 : 12000;
  const timeout = typeof options.timeoutMs === 'number' && options.timeoutMs > 0
    ? options.timeoutMs
    : defaultTimeout;

  // Create search promise with graceful degradation
  const searchPromise = (async (): Promise<TavilyContextPayload> => {
    try {
      const {
        requireRecentDays,
        allowUndatedFromDomains,
        ...searchOptions
      } = options ?? {};

      // Om includeDomains är explicit satt till tom array ([]), låt Tavily söka överallt
      // Annars använd TRUSTED_TAVILY_DOMAINS som standard
      // Om includeDomains är undefined eller inte är en array, använd standard
      const isExplicitlyUnrestricted = Array.isArray(searchOptions.includeDomains) && searchOptions.includeDomains.length === 0;
      
      // Automatisk upptäckt av releaser-frågor som kräver bred sökning
      const queryText = (searchOptions.query ?? message).toLowerCase();
      const isReleaseRelatedQuery = /\b(releaser?|lansering|pipeline|spelkalender|upcoming releases?|product launch|product pipeline)\b/i.test(queryText);
      
      const effectiveIncludeDomains = isExplicitlyUnrestricted || isReleaseRelatedQuery
        ? []
        : (Array.isArray(searchOptions.includeDomains) && searchOptions.includeDomains.length > 0
          ? searchOptions.includeDomains
          : TRUSTED_TAVILY_DOMAINS);

      // Om vi har explicit obegränsad sökning, hoppa över domain fallback
      const allowDomainFallback = !isExplicitlyUnrestricted && !isReleaseRelatedQuery
        && (!Array.isArray(searchOptions.includeDomains) || searchOptions.includeDomains.length > 0)
        && EXTENDED_TAVILY_DOMAINS.length > 0;

      const effectiveExcludeDomains = Array.from(new Set([
        ...DEFAULT_EXCLUDED_TAVILY_DOMAINS,
        ...(Array.isArray(searchOptions.excludeDomains) ? searchOptions.excludeDomains : []),
      ]));

      // Använd 'general' topic för releaser-frågor, annars använd angiven topic eller default 'finance'
      const effectiveTopic: TavilyTopic = isReleaseRelatedQuery 
        ? 'general' 
        : (searchOptions.topic ?? 'finance');
      const shouldRequestRawContent = (searchOptions.includeRawContent ?? false)
        && (searchOptions.searchDepth ?? 'basic') === 'advanced';

    const domainAttempts: string[][] = [];
    if (effectiveIncludeDomains.length > 0) {
      domainAttempts.push(effectiveIncludeDomains);
    } else {
      domainAttempts.push([]);
    }

    if (allowDomainFallback) {
      const fallbackDomains = Array.from(new Set(EXTENDED_TAVILY_DOMAINS));
      const isDifferentList = fallbackDomains.length !== effectiveIncludeDomains.length
        || fallbackDomains.some((domain, index) => domain !== effectiveIncludeDomains[index]);
      if (isDifferentList) {
        domainAttempts.push(fallbackDomains);
      }
    }

    const performSearch = async (includeDomains: string[]): Promise<{
      context: TavilyContextPayload;
      rawResultCount: number;
    }> => {
      const payload: Record<string, unknown> = {
        api_key: tavilyApiKey,
        query: searchOptions.query ?? message,
        search_depth: searchOptions.searchDepth ?? 'basic',
        include_answer: true,
        max_results: searchOptions.maxResults ?? 5,
      };

      if (shouldRequestRawContent) {
        payload.include_raw_content = true;
      }

      if (includeDomains.length > 0) {
        payload.include_domains = includeDomains;
      }

      if (effectiveExcludeDomains.length > 0) {
        payload.exclude_domains = effectiveExcludeDomains;
      }

      if (effectiveTopic) {
        payload.topic = effectiveTopic;
      }

      if (typeof searchOptions.timeRange === 'string' && searchOptions.timeRange.trim().length > 0) {
        payload.time_range = searchOptions.timeRange.trim();
      }

      if (typeof searchOptions.days === 'number' && Number.isFinite(searchOptions.days)) {
        payload.days = searchOptions.days;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`Tavily-sökning timeout efter ${timeout}ms för query: ${payload.query}`);
        controller.abort();
      }, timeout);

      try {
        console.log('Gör Tavily-sökning med payload:', JSON.stringify({
          query: payload.query,
          topic: payload.topic,
          search_depth: payload.search_depth,
          max_results: payload.max_results,
          include_domains: includeDomains.length > 0 ? includeDomains.slice(0, 5) : 'alla domäner',
          timeout_ms: timeout,
        }));

        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fel vid anrop till Tavily API:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            query: payload.query,
          });
          return { context: { formattedContext: '', sources: [] }, rawResultCount: 0 };
        }

        const tavilyData = await response.json() as TavilySearchResponse;
        
        // Logga Tavily-svaret
        console.log('Tavily API-svar mottaget:', {
          query: payload.query,
          hasAnswer: !!tavilyData.answer,
          answerLength: tavilyData.answer?.length || 0,
          resultsCount: Array.isArray(tavilyData.results) ? tavilyData.results.length : 0,
          resultTitles: Array.isArray(tavilyData.results) 
            ? tavilyData.results.slice(0, 3).map(r => r.title || 'No title').filter(Boolean)
            : [],
        });

        const context = formatTavilyResults(tavilyData, includeDomains, {
          requireRecentDays,
          allowUndatedFromDomains,
        });
        const rawResultCount = Array.isArray(tavilyData.results) ? tavilyData.results.length : 0;

        console.log('Tavily-kontext formaterad:', {
          formattedContextLength: context.formattedContext.length,
          sourcesCount: context.sources.length,
          rawResultCount: rawResultCount,
        });

        return { context, rawResultCount };
      } catch (fetchError) {
        // Logga specifik information om timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.error('Tavily-sökning avbruten (timeout):', {
            query: payload.query,
            timeout: timeout,
            error: fetchError.name,
            message: fetchError.message,
          });
        } else {
          console.error('Tavily-sökning misslyckades med fel:', {
            query: payload.query,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            errorType: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError,
          });
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let lastContext: TavilyContextPayload = { formattedContext: '', sources: [] };

    for (let attemptIndex = 0; attemptIndex < domainAttempts.length; attemptIndex++) {
      const domainSet = domainAttempts[attemptIndex];
      const { context, rawResultCount } = await performSearch(domainSet);

      if (context.formattedContext || context.sources.length > 0) {
        return context;
      }

      lastContext = context;

      const hasMoreAttempts = attemptIndex < domainAttempts.length - 1;
      if (hasMoreAttempts) {
        const logMessage = rawResultCount === 0
          ? 'Tavily-sökning gav inga resultat för prioriterade finansdomäner, testar med utökad lista.'
          : 'Tavily-sökning gav inga relevanta resultat inom prioriterade finansdomäner, försöker med utökad lista.';
        console.log(logMessage);
      }
    }

      return lastContext;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Tavily-förfrågan avbröts på grund av timeout:', {
          message: message.substring(0, 100),
          query: options.query?.substring(0, 100),
          timeout: timeout,
          errorType: error.name,
          errorMessage: error.message,
        });
        return { formattedContext: '', sources: [], error: 'Timeout', fallbackUsed: true };
      } else {
        console.error('Undantag vid anrop till Tavily API:', {
          message: message.substring(0, 100),
          query: options.query?.substring(0, 100),
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        return { 
          formattedContext: '', 
          sources: [], 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: true 
        };
      }
    }
  })();

  // Create timeout promise for graceful degradation
  const timeoutPromise = new Promise<TavilyContextPayload>((resolve) => {
    setTimeout(() => {
      console.warn(`Tavily-sökning tog för lång tid (>${timeout}ms), använder fallback.`);
      resolve({ 
        formattedContext: '', 
        sources: [], 
        error: 'Timeout - sökningen tog för lång tid',
        fallbackUsed: true 
      });
    }, timeout);
  });

  // Race between search and timeout - return whichever completes first
  return Promise.race([searchPromise, timeoutPromise]);
};

