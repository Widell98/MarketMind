import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { IntentType } from './intent-types.ts';
import { detectUserIntentWithOpenAI } from './intent-detector.ts';
import { unifiedRouter, type UnifiedRouterResult } from './unified-router.ts';
import { buildBasePrompt, buildIntentPrompt, buildHeadingDirectives, buildPersonalizationPrompt, type BasePromptOptions, type IntentPromptContext, type PersonalizationPromptInput, type HeadingDirectiveInput, detectMacroThemeFromMessages, getMacroInstruction, isAnalysisAngle, getAnalysisAngleInstruction, isMacroTheme } from './prompt-builder.ts';
import { fetchUserContext } from './user-context.ts';
import { fetchTavilyContext, planRealtimeSearchWithLLM, type TavilyContextPayload, type TavilyLLMPlan, type TavilySearchOptions, RECENT_FINANCIAL_DATA_MAX_DAYS, DEFAULT_UNDATED_FINANCIAL_DOMAINS, SWEDISH_PRIORITY_TAVILY_DOMAINS, INTERNATIONAL_PRIORITY_TAVILY_DOMAINS, TRUSTED_TAVILY_DOMAINS, FINANCIAL_RELEVANCE_KEYWORDS, STOCK_TOOL } from './tavily-service.ts';
import { fetchStockData, formatStockDataForContext } from './stock-service.ts';
import { searchPolymarketMarkets, formatPolymarketContext, type PolymarketMarket } from './polymarket-service.ts';
import { rerankDocumentChunks, selectTopChunks, type DocumentChunk } from './document-reranker.ts';
import { AI_RESPONSE_SCHEMA, type AIResponse, type StockSuggestion } from './response-schema.ts';
import type { ChatMessage, MacroTheme, AnalysisAngle, AnalysisFocusSignals, HoldingRecord } from './types.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

const PRIMARY_CHAT_MODEL = Deno.env.get('OPENAI_PORTFOLIO_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

const LIGHTWEIGHT_CHAT_MODEL = Deno.env.get('OPENAI_PORTFOLIO_LIGHT_MODEL')
  || 'gpt-4o-mini';

const INLINE_INTENT_MODEL = Deno.env.get('OPENAI_INTENT_MODEL')
  || PRIMARY_CHAT_MODEL;

const selectChatModel = ({
  hasRealTimeTrigger,
  isDocumentSummaryRequest,
  isSimplePersonalAdviceRequest,
  userIntent,
}: {
  hasRealTimeTrigger: boolean;
  isDocumentSummaryRequest: boolean;
  isSimplePersonalAdviceRequest: boolean;
  userIntent: IntentType;
}): string => {
  if (hasRealTimeTrigger
    || isDocumentSummaryRequest
    || userIntent === 'news_update'
    || userIntent === 'general_news'
    || userIntent === 'market_analysis'
  ) {
    return PRIMARY_CHAT_MODEL;
  }

  if (isSimplePersonalAdviceRequest && userIntent === 'general_advice') {
    return LIGHTWEIGHT_CHAT_MODEL;
  }

  return PRIMARY_CHAT_MODEL;
};

// BasePromptOptions and buildBasePrompt are now imported from prompt-builder.ts

const SWEDISH_LANGUAGE_KEYWORDS = ['och', 'det', 'inte', 'gärna', 'snälla', 'sparande', 'portfölj', 'aktien', 'bolaget', 'köpa', 'sälja'];

const detectSwedishLanguage = (text: string, interpreterLanguage?: string | null): boolean => {
  if (interpreterLanguage && interpreterLanguage.toLowerCase().startsWith('sv')) {
    return true;
  }

  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalized = text.toLowerCase();
  let score = /[åäö]/i.test(text) ? 2 : 0;
  SWEDISH_LANGUAGE_KEYWORDS.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score += 1;
    }
  });

  return score >= 3;
};

// ChatMessage is now imported from types.ts

const RECENT_CHAT_HISTORY_LIMIT = 8;
const MAX_CHAT_MESSAGE_LENGTH = 1200;
const HISTORY_SUMMARY_MAX_LENGTH = 2000;

const normalizeChatHistory = (history: unknown): ChatMessage[] => {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const role = typeof entry?.role === 'string' ? entry.role as string : '';
      const content = typeof entry?.content === 'string' ? entry.content.trim() : '';

      if (!content || !['user', 'assistant'].includes(role)) {
        return null;
      }

      return {
        role: role as ChatMessage['role'],
        content: content.slice(0, MAX_CHAT_MESSAGE_LENGTH),
      } as ChatMessage;
    })
    .filter((entry): entry is ChatMessage => Boolean(entry));
};

const prepareChatHistory = (
  chatHistory: unknown
): { recentMessages: ChatMessage[]; summaryMessage: { role: 'system'; content: string } | null; totalEntries: number } => {
  const normalizedHistory = normalizeChatHistory(chatHistory);

  if (normalizedHistory.length === 0) {
    return { recentMessages: [], summaryMessage: null, totalEntries: 0 };
  }

  const recentMessages = normalizedHistory.slice(-RECENT_CHAT_HISTORY_LIMIT);
  const olderMessages = normalizedHistory.slice(0, Math.max(0, normalizedHistory.length - RECENT_CHAT_HISTORY_LIMIT));

  if (olderMessages.length === 0) {
    return { recentMessages, summaryMessage: null, totalEntries: normalizedHistory.length };
  }

  const summaryLines = olderMessages.map((entry) => {
    const speaker = entry.role === 'assistant' ? 'AI' : 'Användare';
    return `${speaker}: ${entry.content}`;
  });

  const joinedSummary = summaryLines.join('\n');
  const truncatedSummary =
    joinedSummary.length > HISTORY_SUMMARY_MAX_LENGTH
      ? `${joinedSummary.slice(0, HISTORY_SUMMARY_MAX_LENGTH)}...`
      : joinedSummary;

  const summaryMessage = {
    role: 'system' as const,
    content: `Sammanfattning av äldre historik (serverside-kortad):\n${truncatedSummary}`
  };

  return { recentMessages, summaryMessage, totalEntries: normalizedHistory.length };
};

// MacroTheme, AnalysisAngle, and AnalysisFocusSignals are now imported from types.ts
// Macro theme and analysis angle functions are now imported from prompt-builder.ts

// Helper function to detect analysis angles from text (still needed locally)
const detectAnalysisAnglesInText = (text: string): AnalysisAngle[] => {
  if (!text) return [];
  const found = new Set<AnalysisAngle>();
  const anglePatterns: Record<AnalysisAngle, RegExp[]> = {
    cash_flow: [/kassaflöde/i, /cash flow/i, /fritt kassaflöde/i],
    margin_focus: [/marginal/i, /lönsamhet/i, /ebit/i, /ebitda/i],
    demand: [/orderbok/i, /pipeline/i, /kundtillväxt/i, /orderingång/i],
    capital_allocation: [/återköp/i, /utdelning/i, /kapitalallokering/i, /kapitalstruktur/i],
  };
  (Object.keys(anglePatterns) as AnalysisAngle[]).forEach((angle) => {
    if (anglePatterns[angle].some(pattern => pattern.test(text))) {
      found.add(angle);
    }
  });
  return Array.from(found);
};

const extractAnalysisFocusSignals = (text: string): AnalysisFocusSignals => {
  const lower = text.toLowerCase();
  return {
    wantsOverview: /(vad gör|översikt|affärsmodell|beskriv bolaget)/i.test(text),
    wantsTriggers: /(trigger|katalysator|drivare|kommande händelse|katalyst)/i.test(text),
    wantsRisks: /(risk|nedsida|worst case|oro|riskerna)/i.test(text),
    wantsValuation: /(värdering|multipel|p\/e|pe-tal|ev\/ebitda|riktkurs|target)/i.test(text),
    wantsFinancials: /(omsättning|intäkt|marginal|resultat|nyckeltal|kassaflöde|guidance)/i.test(text),
    wantsRecommendation: /(köp|sälj|behåll|rekommendation|skall jag|bör jag)/i.test(lower),
    wantsAlternatives: /(alternativ|andra bolag|ersätta|istället|liknande)/i.test(text)
  };
};

// buildIntentPrompt, buildHeadingDirectives, and buildPersonalizationPrompt are now imported from prompt-builder.ts
// IntentPromptContext, HeadingDirectiveInput, and PersonalizationPromptInput types are also imported

const DOCUMENT_CONTEXT_MATCH_COUNT = 8;
const DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT = 60000;
const DOCUMENT_SUMMARY_PATTERNS: RegExp[] = [
  /sammanfatta/i,
  /sammanfattning/i,
  /summering/i,
  /sammanställ/i,
  /sammanstall/i,
  /summary/i,
  /summarize/i,
  /summarise/i,
  /key points?/i,
  /key takeaways?/i,
  /nyckelpunkter/i,
  /huvudpunkter/i,
  /huvudinsikter/i,
  /övergripande bild/i,
  /helhetsbild/i,
];

const SWEDISH_TAVILY_DOMAINS = [
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

const INTERNATIONAL_TAVILY_DOMAINS = [
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

const TRUSTED_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

const SWEDISH_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

const INTERNATIONAL_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...INTERNATIONAL_TAVILY_DOMAINS,
  ...SWEDISH_TAVILY_DOMAINS,
]));

const EXTENDED_TAVILY_DOMAINS = Array.from(new Set([
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

const DEFAULT_EXCLUDED_TAVILY_DOMAINS = [
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

const RECENT_NEWS_MAX_DAYS = 3;
const RECENT_MARKET_NEWS_MAX_DAYS = 7;
const RECENT_FINANCIAL_DATA_MAX_DAYS = 45;
// Använd den exporterade listan från tavily-service.ts istället för lokal definition
// const DEFAULT_UNDATED_FINANCIAL_DOMAINS = ['stockanalysis.com']; // Ta bort lokal definition

const FINANCIAL_RELEVANCE_KEYWORDS = [
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

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const INTENT_EMBEDDING_CACHE_KEY = 'intent_centroids_v1';
const EMBEDDING_SIMILARITY_THRESHOLD = 0.78;

const INTENT_EXAMPLES: Record<IntentType, string[]> = {
  stock_analysis: [
    'Kan du analysera Volvo-aktien åt mig?',
    'Vad är din syn på Evolution Gaming just nu?',
    'Hur ser fundamenta ut för Atlas Copco?',
  ],
  prediction_analysis: [ 
    'Vad är oddsen på Polymarket för valet?',
    'Tror du att Bitcoin når 100k innan nyår enligt marknaden?',
    'Analysera detta bet',
    'Vem vinner valet enligt oddsen?',
    'Är sannolikheten för räntesänkning prisad korrekt?',
    'Jag vill diskutera prediktionsmarknaden',
  ],
  portfolio_optimization: [
    'Hur kan jag balansera om min portfölj?',
    'Vilken viktning bör jag ha mellan teknik och hälsovård?',
    'Behöver jag justera min portfölj för att minska risken?',
  ],
  buy_sell_decisions: [
    'Ska jag sälja mina H&M-aktier nu?',
    'Är det läge att köpa mer Investor?',
    'Borde jag minska positionen i Tesla?',
  ],
  market_analysis: [
    'Vad händer på börsen den här veckan?',
    'Hur påverkar inflationen marknaden just nu?',
    'Kan du ge en översikt över makrotrenderna?',
  ],
  general_news: [
    'Ge mig en marknadssammanfattning för idag.',
    'Vilka är de största nyheterna på börsen den här veckan?',
    'Vad har hänt på marknaden nyligen?',
  ],
  news_update: [
    'Hur påverkade dagens rapporter min portfölj?',
    'Vad är senaste nytt om mina innehav?',
    'Finns det nyheter från igår som påverkar mina aktier?',
  ],
  general_advice: [
    'Hur bör jag tänka kring långsiktigt sparande?',
    'Har du några investeringsidéer för en nybörjare?',
    'Vilka aktier passar en balanserad strategi?',
  ],
  document_summary: [
    'Kan du sammanfatta det bifogade dokumentet?',
    'Vad står det i den uppladdade filen?',
    'Ge mig en översikt av dokumentet',
  ],
};

type IntentCentroidMap = Record<IntentType, number[]>;

let inMemoryIntentCentroids: IntentCentroidMap | null = null;
const messageEmbeddingCache = new Map<string, number[]>();

const averageVectors = (vectors: number[][]): number[] => {
  if (vectors.length === 0) return [];
  const dimension = vectors[0].length;
  const sums = new Array(dimension).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dimension; i += 1) {
      sums[i] += vector[i];
    }
  }

  return sums.map(value => value / vectors.length);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const fetchEmbedding = async (text: string, openAIApiKey: string): Promise<number[] | null> => {
  if (messageEmbeddingCache.has(text)) {
    return messageEmbeddingCache.get(text) ?? null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      console.warn('Embedding request failed with status', response.status);
      return null;
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (Array.isArray(embedding)) {
      messageEmbeddingCache.set(text, embedding);
      return embedding;
    }
  } catch (error) {
    console.warn('Failed to fetch embedding:', error);
  }

  return null;
};

const fetchCentroidsFromSupabase = async (supabase: any): Promise<IntentCentroidMap | null> => {
  try {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', INTENT_EMBEDDING_CACHE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Failed to load intent centroids from kv_store:', error.message ?? error);
      return null;
    }

    if (data?.value) {
      if (typeof data.value === 'string') {
        return JSON.parse(data.value);
      }
      return data.value as IntentCentroidMap;
    }
  } catch (error) {
    console.warn('Unexpected error when loading centroids:', error);
  }

  return null;
};

const persistCentroidsToSupabase = async (supabase: any, centroids: IntentCentroidMap): Promise<void> => {
  try {
    const payload = {
      key: INTENT_EMBEDDING_CACHE_KEY,
      value: JSON.stringify(centroids),
    };

    const { error } = await supabase
      .from('kv_store')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.warn('Failed to persist intent centroids:', error.message ?? error);
    }
  } catch (error) {
    console.warn('Unexpected error when persisting centroids:', error);
  }
};

const loadIntentCentroids = async (
  supabase: any,
  openAIApiKey: string,
): Promise<IntentCentroidMap | null> => {
  if (inMemoryIntentCentroids) {
    return inMemoryIntentCentroids;
  }

  const cached = await fetchCentroidsFromSupabase(supabase);
  if (cached) {
    inMemoryIntentCentroids = cached;
    return cached;
  }

  const centroids: Partial<IntentCentroidMap> = {};

  for (const [intent, examples] of Object.entries(INTENT_EXAMPLES) as [IntentType, string[]][]) {
    const vectors: number[][] = [];
    for (const example of examples) {
      const embedding = await fetchEmbedding(example, openAIApiKey);
      if (embedding) {
        vectors.push(embedding);
      }
    }

    if (vectors.length > 0) {
      centroids[intent] = averageVectors(vectors);
    }
  }

  const result = centroids as IntentCentroidMap;
  inMemoryIntentCentroids = result;

  await persistCentroidsToSupabase(supabase, result);

  return result;
};

const classifyIntentWithEmbeddings = async (
  message: string,
  supabase: any,
  openAIApiKey: string,
): Promise<IntentType | null> => {
  if (message.trim().length < 3) {
    return null;
  }

  const centroids = await loadIntentCentroids(supabase, openAIApiKey);
  if (!centroids) {
    return null;
  }

  const messageEmbedding = await fetchEmbedding(message, openAIApiKey);
  if (!messageEmbedding) {
    return null;
  }

  let bestIntent: IntentType | null = null;
  let bestScore = -1;

  for (const [intent, centroid] of Object.entries(centroids) as [IntentType, number[]][]) {
    const score = cosineSimilarity(messageEmbedding, centroid);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestIntent && bestScore >= EMBEDDING_SIMILARITY_THRESHOLD) {
    console.log('Intent classified via embeddings:', bestIntent, 'score:', bestScore.toFixed(3));
    return bestIntent;
  }

  console.log('Embedding classification below threshold. Best intent:', bestIntent, 'score:', bestScore.toFixed(3));
  return null;
};

const classifyIntentWithLLM = async (
  message: string,
  openAIApiKey: string,
): Promise<IntentType | null> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: LIGHTWEIGHT_CHAT_MODEL,
        temperature: 0,
        max_completion_tokens: 5,
        messages: [
          {
            role: 'system',
            content: 'Klassificera användarens fråga som en av följande kategorier: stock_analysis, news_update, general_news, market_analysis, portfolio_optimization, buy_sell_decisions, general_advice. Svara endast med etiketten.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('LLM intent classification failed with status', response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim()?.toLowerCase?.();
    const label = (content ?? '').replace(/[^a-z_]/g, '') as IntentType;
    if ((INTENT_EXAMPLES as Record<string, string[]>)[label]) {
      console.log('Intent classified via LLM:', label);
      return label;
    }
  } catch (error) {
    console.warn('LLM intent classification error:', error);
  }

  return null;
};

const extractEntityCandidates = (
  message: string,
  knownNames: string[] = [],
): string[] => {
  const entities = new Set<string>();

  const capitalizedPattern = /\b([A-ZÅÄÖ][\wÅÄÖåäö-]+(?:\s+[A-ZÅÄÖ][\wÅÄÖåäö-]+){0,2})\b/g;
  let match: RegExpExecArray | null;
  while ((match = capitalizedPattern.exec(message)) !== null) {
    const candidate = match[1];
    if (candidate && candidate.length > 2) {
      entities.add(candidate.trim());
    }
  }

  const lowerMessage = message.toLowerCase();
  for (const name of knownNames) {
    if (typeof name !== 'string') continue;
    const normalizedName = name.trim();
    if (!normalizedName) continue;
    const simple = normalizedName.toLowerCase();
    if (lowerMessage.includes(simple)) {
      entities.add(normalizedName);
    }
  }

  return Array.from(entities).slice(0, 5);
};

type EntityQueryInput = {
  message: string;
  tickers: string[];
  companyNames: string[];
  hasRealTimeTrigger: boolean;
  userIntent: IntentType;
  detectedEntities?: string[];
};

const buildEntityAwareQuery = ({
  message,
  tickers,
  companyNames,
  hasRealTimeTrigger,
  userIntent,
  detectedEntities,
}: EntityQueryInput): string | null => {
  
  // --- NY LOGIK FÖR PREDIKTIONER ---
  if (userIntent === 'prediction_analysis') {
    // Rensa bort onödiga ord för att få en ren söksträng
    const cleanMessage = message
      .replace(/diskutera|analysera|vad tror du om|prediktionsmarknaden/gi, '')
      .trim();
      
    // Tvinga sökningen att leta efter odds på Polymarket
    return `${cleanMessage} polymarket odds current probability`;
  }
  // ---------------------------------

  const entitySet = new Set<string>();
  for (const ticker of tickers.slice(0, 4)) {
    if (ticker) {
      entitySet.add(ticker.toUpperCase());
    }
  }

  if (Array.isArray(detectedEntities)) {
    detectedEntities.forEach(entity => {
      if (typeof entity === 'string' && entity.trim()) {
        const formatted = entity.trim();
        const maybeTicker = formatted.length <= 8 ? formatted.toUpperCase() : formatted;
        entitySet.add(maybeTicker);
      }
    });
  }

  for (const name of extractEntityCandidates(message, companyNames)) {
    entitySet.add(name);
  }

  if (entitySet.size === 0) {
    return hasRealTimeTrigger || userIntent === 'news_update' || userIntent === 'general_news'
      ? `${message} senaste nyheter`
      : null;
  }

  const entities = Array.from(entitySet).slice(0, 4);
  const descriptor = hasRealTimeTrigger || userIntent === 'news_update' || userIntent === 'general_news'
    ? 'senaste nyheter och rapporter'
    : 'fördjupad analys';

  return `${entities.join(' ')} ${descriptor}`;
};

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
  changePercent?: number | null;
  sector?: string | null;
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
  purchase_price?: number | string | null;
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

type ReturnQuestionType = 'total' | 'specific' | 'all' | 'ranking' | 'none';

type ReturnQuestionAnalysis = {
  isReturnQuestion: boolean;
  questionType: ReturnQuestionType;
  mentionedTickers: string[];
  mentionedCompanyNames: string[];
};

const RETURN_KEYWORD_PATTERNS = [
  // Huvudord (fångar stammar för att täcka alla böjningar)
  /avkast[a-z]*/i,      // Fångar: avkastning, avkastat, avkastar
  /vinst/i,             // Fångar: vinst, vinster
  /förlust/i,           // Fångar: förlust, förluster
  /resultat/i,
  /prester[a-z]*/i,     // Fångar: presterat, presterar, prestanda
  /utveckl[a-z]*/i,     // Fångar: utveckling, utvecklats (Väldigt vanligt ord!)
  
  // Specifika fraser för riktning/värde
  /(?:ligger|är|gick).*(?:plus|minus|upp|ner)/i, 
  /hur.*(?:går|gick).*det/i,
  /hur.*mycket.*tjänat/i,
  /hur.*mycket.*(?:förlorat|tappat)/i,
  
  // GAV och Inköp
  /inköps(?:kurs|pris|värde)/i,
  /gav/i,
  /snittpris/i,
  /genomsnittlig.*anskaffning/i,
  /break.?even/i,

  // Engelska termer (bra att ha kvar)
  /performance/i,
  /\breturn\b/i,
  /profit/i,
  /loss/i,
  /gain/i,
  /roi/i,
  /cagr/i
];

const TOTAL_RETURN_PATTERNS = [
  // Synonymer för totalt
  /(?:total|hela|sammanlagd|allt).*(?:avkast|upp|ner|plus|minus|vinst|utveckling)/i,
  /hur.*ligger.*jag.*till.*totalt/i,
  /portfölj(?:en)?s?.*(?:utveckling|prestanda|värdeökning)/i,
  /vad.*är.*(?:totalen|summan)/i
];

const ALL_HOLDINGS_PATTERNS = [
  // Listor och genomgångar
  /(?:alla|samtliga|mina).*(?:aktier|innehav|positioner).*(?:utveckling|avkast|prester)/i,
  /lista.*(?:utveckling|avkastning)/i,
  /hur.*går.*(?:alla|aktierna)/i,
  /översikt.*avkast/i
];

const RANKING_RETURN_PATTERNS = [
  // Den viktigaste fixen: Fångar din tidigare fråga genom att tillåta ord mellan "ranka" och "avkast..."
  /(?:rank|sortera|ordna).*(?:innehav|aktier|bolag)?.*(?:efter|utifrån)?.*(?:avkast|prester|utveckl|resultat|vinst)/i,

  // "Vilken gick bäst/sämst" (täcker ental och flertal)
  /(?:vilken|vilket|vilka|vad).*(?:har|är|gick).*(?:bäst|sämst|högst|lägst|mest|minst).*(?:avkast|prester|utveckl|gått|ökat|minskat)/i,

  // Specifika "topp"-fraser
  /(?:topp|top|botten).*(?:lista|aktier|innehav|förlorare|vinnare)/i,
  
  // "Bästa aktien"
  /(?:bästa|sämsta).*(?:innehav|aktie|position|investering)/i,
  
  // Engelska/Svengelska
  /best.*performing/i,
  /worst.*performing/i
];

const detectReturnQuestion = (
  message: string,
  detectedTickers: string[],
  detectedEntities: string[] = []
): ReturnQuestionAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  // Check if it's a return-related question at all
  const hasReturnKeywords = RETURN_KEYWORD_PATTERNS.some(pattern => pattern.test(message));

  if (!hasReturnKeywords) {
    return {
      isReturnQuestion: false,
      questionType: 'none',
      mentionedTickers: [],
      mentionedCompanyNames: [],
    };
  }

  // Check for total return questions
  const isTotalQuestion = TOTAL_RETURN_PATTERNS.some(pattern => pattern.test(message));
  if (isTotalQuestion) {
    return {
      isReturnQuestion: true,
      questionType: 'total',
      mentionedTickers: [],
      mentionedCompanyNames: [],
    };
  }

  // Check for ranking/comparison questions (vilka innehav har gett mest avkastning)
  const isRankingQuestion = RANKING_RETURN_PATTERNS.some(pattern => pattern.test(message));
  if (isRankingQuestion) {
    return {
      isReturnQuestion: true,
      questionType: 'ranking',
      mentionedTickers: [],
      mentionedCompanyNames: [],
    };
  }

  // Check for all holdings questions
  const isAllHoldingsQuestion = ALL_HOLDINGS_PATTERNS.some(pattern => pattern.test(message));
  if (isAllHoldingsQuestion) {
    return {
      isReturnQuestion: true,
      questionType: 'all',
      mentionedTickers: [],
      mentionedCompanyNames: [],
    };
  }

  // Extract mentioned tickers and company names
  const mentionedTickers = detectedTickers || [];
  const mentionedCompanyNames = detectedEntities.filter(entity => {
    // Filter out tickers (usually short uppercase strings)
    const isLikelyTicker = /^[A-Z0-9]{1,6}$/.test(entity);
    return !isLikelyTicker && entity.length > 2;
  });

  // If specific tickers or companies are mentioned, it's a specific question
  if (mentionedTickers.length > 0 || mentionedCompanyNames.length > 0) {
    return {
      isReturnQuestion: true,
      questionType: 'specific',
      mentionedTickers,
      mentionedCompanyNames,
    };
  }

  // Default to total if return keywords found but no specific pattern
  return {
    isReturnQuestion: true,
    questionType: 'total',
    mentionedTickers: [],
    mentionedCompanyNames: [],
  };
};

type HoldingWithReturn = {
  holding: HoldingRecord;
  value: HoldingValueBreakdown;
  investedValue: number;
  returnAmount: number;
  returnPercentage: number | null;
  hasPurchasePrice: boolean;
};

const matchHoldingsToQuestion = (
  questionAnalysis: ReturnQuestionAnalysis,
  holdingsWithReturns: HoldingWithReturn[]
): HoldingWithReturn[] => {
  if (questionAnalysis.questionType === 'total' || questionAnalysis.questionType === 'none') {
    return [];
  }

  if (questionAnalysis.questionType === 'ranking') {
    // Return all holdings with purchase price, sorted by return percentage (highest first)
    return holdingsWithReturns
      .filter(item => item.hasPurchasePrice && item.returnPercentage !== null)
      .sort((a, b) => {
        // Sort by return percentage descending (highest return first)
        const returnA = a.returnPercentage ?? 0;
        const returnB = b.returnPercentage ?? 0;
        return returnB - returnA;
      });
  }

  if (questionAnalysis.questionType === 'all') {
    // Return all holdings with purchase price, sorted by value
    return holdingsWithReturns
      .filter(item => item.hasPurchasePrice && item.returnPercentage !== null)
      .sort((a, b) => b.value.valueInSEK - a.value.valueInSEK);
  }

  // Specific question - match by ticker or company name
  const matchedHoldings: HoldingWithReturn[] = [];

  for (const holdingData of holdingsWithReturns) {
    if (!holdingData.hasPurchasePrice || holdingData.returnPercentage === null) {
      continue;
    }

    const holding = holdingData.holding;
    const symbol = typeof holding.symbol === 'string' ? holding.symbol.toUpperCase() : null;
    const name = typeof holding.name === 'string' ? holding.name.toLowerCase() : null;

    // Check ticker match
    const tickerMatch = questionAnalysis.mentionedTickers.some(ticker => {
      const normalizedTicker = ticker.toUpperCase();
      return symbol === normalizedTicker;
    });

    // Check company name match
    const nameMatch = questionAnalysis.mentionedCompanyNames.some(entity => {
      const normalizedEntity = entity.toLowerCase();
      if (!name) return false;
      return name.includes(normalizedEntity) || normalizedEntity.includes(name);
    });

    if (tickerMatch || nameMatch) {
      matchedHoldings.push(holdingData);
    }
  }

  return matchedHoldings;
};

type RealTimeAssessment = {
  needsRealtime: boolean;
  signals: string[];
  questionType?: string;
  recommendationPreference?: RecommendationPreference;
  usedLLM: boolean;
};

type NewsIntentEvaluationParams = {
  message: string;
  hasPortfolio: boolean;
  apiKey: string;
};

type NewsIntentLabel = 'news_update' | 'general_news' | 'none';

const NEWS_INTENT_SCHEMA = {
  name: 'news_intent_selection',
  schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['news_update', 'general_news', 'none'],
        default: 'none',
      },
    },
    required: ['intent'],
    additionalProperties: false,
  },
} as const;

const evaluateNewsIntentWithOpenAI = async ({
  message,
  hasPortfolio,
  apiKey,
}: NewsIntentEvaluationParams): Promise<IntentType | null> => {
  if (!apiKey || !message || !message.trim()) {
    return null;
  }

  try {
    const systemPrompt = `Du hjälper en svensk finansiell assistent att välja rätt typ av nyhetssvar.\n- Välj \"news_update\" om användaren sannolikt vill ha en uppdatering om sina innehav eller portfölj.\n- Välj \"general_news\" om användaren vill ha ett brett marknadsbrev eller nyhetssvep.\n- Returnera \"none\" om inget av alternativen passar.\nSvara alltid med giltig JSON.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Meddelande: "${message.trim()}"\nHar användaren portföljdata hos oss: ${hasPortfolio ? 'ja' : 'nej'}\nVilket nyhetssvar förväntas?`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: NEWS_INTENT_SCHEMA },
        messages,
      }),
    });

    if (!response.ok) {
      console.warn('News intent evaluation failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse news intent response:', error);
      return null;
    }

    const intentRaw = typeof (parsed as any)?.intent === 'string' ? (parsed as any).intent as NewsIntentLabel : 'none';

    if (intentRaw === 'news_update' || intentRaw === 'general_news') {
      return intentRaw;
    }

    return null;
  } catch (error) {
    console.warn('News intent evaluator error:', error);
    return null;
  }
};

type StockIntentEvaluationParams = {
  message: string;
  detectedTickers: string[];
  heuristicsTriggered: boolean;
  hasStockContext: boolean;
  analysisCue: boolean;
  apiKey: string;
};

type StockIntentEvaluationResult = {
  classification: 'stock_focus' | 'non_stock';
  rationale?: string;
};

const STOCK_INTENT_SCHEMA = {
  name: 'stock_intent_classification',
  schema: {
    type: 'object',
    properties: {
      classification: {
        type: 'string',
        enum: ['stock_focus', 'non_stock'],
        default: 'non_stock',
      },
      rationale: {
        type: 'string',
        maxLength: 200,
      },
    },
    required: ['classification'],
    additionalProperties: false,
  },
} as const;

const evaluateStockIntentWithOpenAI = async ({
  message,
  detectedTickers,
  heuristicsTriggered,
  hasStockContext,
  analysisCue,
  apiKey,
}: StockIntentEvaluationParams): Promise<StockIntentEvaluationResult | null> => {
  const trimmedMessage = message.trim();

  if (!apiKey || !trimmedMessage) {
    return null;
  }

  try {
    const systemPrompt = `Du hjälper en svensk finansiell assistent att avgöra hur svaret ska formuleras.\n- Välj \"stock_focus\" om användaren förväntar sig resonemang om ett specifikt bolag eller dess aktie.\n- Välj \"non_stock\" om frågan främst gäller portföljer, sparande, index, makro eller andra bredare ämnen.\n- Använd signalerna men gör en egen helhetsbedömning.\n- Svara alltid med giltig JSON enligt schemat.`;

    const tickerLine = detectedTickers.length > 0
      ? detectedTickers.join(', ')
      : 'inga';

    const userContent = [
      `Meddelande: "${trimmedMessage}"`,
      `Identifierade tickers: ${tickerLine}`,
      `Heuristik markerade som aktiefråga: ${heuristicsTriggered ? 'ja' : 'nej'}`,
      `Investerings- eller bolagskontext hittad: ${hasStockContext ? 'ja' : 'nej'}`,
      `Direkt analysfraser hittade: ${analysisCue ? 'ja' : 'nej'}`,
      'Avgör om detta ska besvaras som en aktiespecifik fråga.',
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: STOCK_INTENT_SCHEMA },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Stock intent evaluation failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse stock intent response:', error);
      return null;
    }

    const classificationRaw = typeof (parsed as any)?.classification === 'string'
      ? (parsed as any).classification as string
      : 'non_stock';

    if (classificationRaw !== 'stock_focus' && classificationRaw !== 'non_stock') {
      return null;
    }

    const rationaleRaw = typeof (parsed as any)?.rationale === 'string'
      ? (parsed as any).rationale.trim()
      : '';

    return {
      classification: classificationRaw,
      rationale: rationaleRaw.length > 0 ? rationaleRaw : undefined,
    };
  } catch (error) {
    console.warn('Stock intent evaluator error:', error);
    return null;
  }
};

type RealTimeDecisionInput = {
  message: string;
  userIntent?: IntentType;
  recentMessages?: string[];
  openAIApiKey: string;
};

type RecommendationPreference = 'yes' | 'no';

type RealTimeDecision = {
  decision: boolean;
  rationale?: string;
  questionType?: string;
  recommendationPreference?: RecommendationPreference;
  usedModel: boolean;
};

const askLLMIfRealtimeNeeded = async ({
  message,
  userIntent,
  recentMessages,
  openAIApiKey,
}: RealTimeDecisionInput): Promise<RealTimeDecision> => {
  try {
    const contextLines: string[] = [];

    if (userIntent) {
      contextLines.push(`Identifierad intent: ${userIntent}.`);
    }

    if (recentMessages && recentMessages.length > 0) {
      const recentSnippet = recentMessages
        .map((entry, index) => `${index + 1}. ${entry}`)
        .join('\n');
      contextLines.push(`Tidigare relaterade användarmeddelanden:\n${recentSnippet}`);
    }

    const userPromptSections = [
      'Du analyserar vilken typ av fråga en användare ställer i en finansiell chatt.',
      '1. Klassificera frågan i en av följande kategorier:',
      '   - latest_news (ber om senaste nyheter, uppdateringar eller rubriker).',
      '   - recent_report (hänvisar till färska rapporter, kvartalsrapporter eller earnings calls).',
      '   - intraday_price (vill veta aktuell kurs, intradagsrörelser eller "hur går den nu").',
      '   - macro_event (handlar om dagsaktuella marknadshändelser, centralbanker eller makronyheter).',
      '   - portfolio_update (ber om dagsfärsk status för sin portfölj eller innehav).',
      '   - prediction_market (frågor om odds, Polymarket, sannolikheter för utfall, valresultat).',
      '   - strategy_or_education (förklaringar, historik, långsiktiga strategier).',
      '   - other (allt annat).',
      '2. Avgör om realtidsdata krävs för att besvara frågan pålitligt. Realtidsdata behövs främst för kategorierna latest_news, recent_report, intraday_price, macro_event och portfolio_update.',
      '3. Motivera kort på svenska varför realtidsdata behövs eller inte.',
      '4. Avgör om användaren uttryckligen ber om investeringsrekommendationer, konkreta portföljåtgärder eller köp/sälj-råd.',
      contextLines.join('\n\n'),
      `Nuvarande användarmeddelande:\n"""${message}"""`,
      'Returnera JSON i formatet {"realtime": "yes" eller "no", "reason": "...", "question_type": "...", "recommendations": "yes" eller "no"}.',
    ].filter(Boolean);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        max_completion_tokens: 60,
        messages: [
          {
            role: 'system',
            content: 'Du avgör om en investeringsfråga behöver realtidsdata. Var konservativ med ja-svar och motivera kort på svenska.',
          },
          {
            role: 'user',
            content: userPromptSections.join('\n\n'),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Realtime LLM check failed with status', response.status);
      return { decision: false, usedModel: false };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return { decision: false, usedModel: true };
    }

    try {
      const parsed = JSON.parse(text);
      const decisionText = String(parsed?.realtime ?? '').toLowerCase();
      const decision = decisionText === 'yes' || decisionText === 'ja';
      const rationale = typeof parsed?.reason === 'string' ? parsed.reason.trim() : undefined;
      const questionType = typeof parsed?.question_type === 'string'
        ? parsed.question_type.trim().toLowerCase()
        : undefined;
      const recommendationPreferenceRaw = typeof parsed?.recommendations === 'string'
        ? parsed.recommendations.trim().toLowerCase()
        : undefined;
      const recommendationPreference: RecommendationPreference | undefined =
        recommendationPreferenceRaw === 'yes' || recommendationPreferenceRaw === 'no'
          ? recommendationPreferenceRaw
          : undefined;
      return { decision, rationale, questionType, recommendationPreference, usedModel: true };
    } catch (jsonError) {
      console.warn('Failed to parse realtime LLM response as JSON:', jsonError, 'Raw response:', text);
      const normalized = text.toLowerCase();
      const decision = normalized.includes('ja') || normalized.includes('yes');
      return {
        decision,
        rationale: text,
        questionType: undefined,
        recommendationPreference: undefined,
        usedModel: true,
      };
    }
  } catch (error) {
    console.warn('Realtime LLM check encountered an error:', error);
    return { decision: false, recommendationPreference: undefined, usedModel: false };
  }
};

const determineRealTimeSearchNeed = async ({
  message,
  userIntent,
  recentMessages,
  openAIApiKey,
}: RealTimeDecisionInput): Promise<RealTimeAssessment> => {
  const signals: string[] = [];

  const {
    decision,
    rationale,
    questionType,
    recommendationPreference,
    usedModel,
  } = await askLLMIfRealtimeNeeded({
    message,
    userIntent,
    recentMessages,
    openAIApiKey,
  });

  if (questionType) {
    signals.push(`llm:question_type:${questionType}`);
  }

  if (recommendationPreference) {
    signals.push(`llm:recommendations:${recommendationPreference}`);
  }

  if (rationale) {
    signals.push(`llm:${rationale}`);
  } else {
    signals.push(decision ? 'llm:yes' : 'llm:no');
  }

  if (!usedModel) {
    const newsIntents = new Set<IntentType>(['news_update', 'general_news', 'stock_analysis', 'market_analysis']);
    if (userIntent && newsIntents.has(userIntent)) {
      signals.push('fallback:intent_requires_realtime');
      return {
        needsRealtime: true,
        signals,
        usedLLM: false,
      };
    }
  }

  return {
    needsRealtime: decision,
    signals,
    questionType,
    recommendationPreference,
    usedLLM: usedModel,
  };
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

type TavilyTopic = 'general' | 'news' | 'finance';

type TavilyContextPayload = {
  formattedContext: string;
  sources: string[];
};

type TavilySearchDepth = 'basic' | 'advanced';

type TavilyLocalePreference = 'se' | 'global';

type TavilyLLMPlanInput = {
  message: string;
  entityAwareQuery?: string | null;
  userIntent?: IntentType;
  recentMessages?: string[];
  openAIApiKey: string;
};

type TavilyLLMPlan = {
  shouldSearch: boolean;
  query?: string;
  topic?: TavilyTopic;
  depth?: TavilySearchDepth;
  freshnessDays?: number;
  preferredLocales?: TavilyLocalePreference[];
  reason?: string;
};

type TavilySearchOptions = {
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

const TAVILY_ROUTER_TOOL = {
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

const planRealtimeSearchWithLLM = async ({
  message,
  entityAwareQuery,
  userIntent,
  recentMessages,
  openAIApiKey,
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
        model: INLINE_INTENT_MODEL,
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

type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

type TavilyFormattingOptions = {
  requireRecentDays?: number;
  allowUndatedFromDomains?: string[];
};

const normalizeHostname = (url: string): string | null => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    console.warn('Kunde inte tolka URL från Tavily-resultat:', url, error);
    return null;
  }
};

const isAllowedDomain = (url: string, allowedDomains: string[]): boolean => {
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

const hasFinancialRelevance = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const normalized = text.toLowerCase();
  return FINANCIAL_RELEVANCE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

const selectSnippetSource = (result: TavilySearchResult): string => {
  const snippetSource = typeof result.raw_content === 'string' && result.raw_content.trim().length > 0
    ? result.raw_content
    : typeof result.content === 'string' && result.content.trim().length > 0
      ? result.content
      : result.snippet;

  return typeof snippetSource === 'string' ? snippetSource.trim() : '';
};

const formatTavilyResults = (
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
    const {
      requireRecentDays,
      allowUndatedFromDomains,
      ...searchOptions
    } = options ?? {};

    const effectiveIncludeDomains = Array.isArray(searchOptions.includeDomains) && searchOptions.includeDomains.length > 0
      ? searchOptions.includeDomains
      : TRUSTED_TAVILY_DOMAINS;

    const allowDomainFallback = (!Array.isArray(searchOptions.includeDomains) || searchOptions.includeDomains.length === 0)
      && EXTENDED_TAVILY_DOMAINS.length > 0;

    const effectiveExcludeDomains = Array.from(new Set([
      ...DEFAULT_EXCLUDED_TAVILY_DOMAINS,
      ...(Array.isArray(searchOptions.excludeDomains) ? searchOptions.excludeDomains : []),
    ]));

    const effectiveTopic: TavilyTopic = searchOptions.topic ?? 'finance';
    const shouldRequestRawContent = (searchOptions.includeRawContent ?? false)
      && (searchOptions.searchDepth ?? 'basic') === 'advanced';

    const timeout = typeof searchOptions.timeoutMs === 'number' && searchOptions.timeoutMs > 0
      ? searchOptions.timeoutMs
      : 30000; // Öka drastiskt till 30 sekunder

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
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
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
          console.error('Fel vid anrop till Tavily API:', errorText);
          return { context: { formattedContext: '', sources: [] }, rawResultCount: 0 };
        }

        const tavilyData = await response.json() as TavilySearchResponse;
        const context = formatTavilyResults(tavilyData, includeDomains, {
          requireRecentDays,
          allowUndatedFromDomains,
        });
        const rawResultCount = Array.isArray(tavilyData.results) ? tavilyData.results.length : 0;

        return { context, rawResultCount };
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
      console.warn('Tavily-förfrågan avbröts på grund av timeout.');
    } else {
      console.error('Undantag vid anrop till Tavily API:', error);
    }
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
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe, conversationData, stream, documentIds } = requestBody;

    const { recentMessages: preparedChatHistory, summaryMessage, totalEntries: totalHistoryEntries } = prepareChatHistory(chatHistory);

    const filteredDocumentIds: string[] = Array.isArray(documentIds)
      ? documentIds.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];

    const hasUploadedDocuments = filteredDocumentIds.length > 0;
    const normalizedSummaryCheckValue = message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
    const summaryPatternTriggered =
      DOCUMENT_SUMMARY_PATTERNS.some((pattern) => pattern.test(message)) ||
      DOCUMENT_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalizedSummaryCheckValue));
    let isDocumentSummaryRequest = hasUploadedDocuments && summaryPatternTriggered;

    console.log('Portfolio AI Chat function called with:', {
      message: message?.substring(0, 50) + '...',
      userId,
      portfolioId,
      sessionId,
      analysisType
    });

    const recentUserMessages = preparedChatHistory
      .filter((entry) => entry.role === 'user')
      .map((entry) => entry.content)
      .slice(-3);

    const riskKeywordPattern = /(riskprofil|risktolerans|riskniv[åa]|risktagande|riskjusterad|riskhantering|risknivån|risknivaan|risknivor|risk)/i;
    const mentionsRisk = (value?: string): boolean => typeof value === 'string' && riskKeywordPattern.test(value);
    const userExplicitRiskFocus = mentionsRisk(message) || recentUserMessages.some(mentionsRisk);

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

    // Get authorization header from incoming request to forward to list-sheet-tickers
    const authHeader = req.headers.get('Authorization');
    const invokeHeaders = authHeader ? { Authorization: authHeader } : {};

    // Fetch all independent data in parallel for better performance
    const [userContext, sheetTickerResult] = await Promise.all([
      fetchUserContext(supabase, userId),
      supabase.functions.invoke('list-sheet-tickers', {
        headers: invokeHeaders,
      }).catch((error) => {
        console.error('Failed to fetch Google Sheets tickers:', error);
        return { data: null, error };
      }),
    ]);

    const aiMemory = userContext.aiMemory;
    const riskProfile = userContext.riskProfile;
    const portfolio = userContext.portfolio;
    const holdings = userContext.holdings;
    const subscriber = userContext.subscriber;

    const aiMemoryRiskComfort = (aiMemory?.risk_comfort_patterns as Record<string, unknown> | null) ?? null;

    let sheetTickerSymbols: string[] = [];
    let sheetTickerNames: string[] = [];
    let sheetTickerCurrencyMap = new Map<string, string>();
    let sheetTickerPriceMap = new Map<string, { 
      price: number; 
      currency: string; 
      name: string;
      change?: number | null;
      changePercent?: number | null;
      high?: number | null;
      low?: number | null;
      open?: number | null;
      previousClose?: number | null;
      sector?: string | null;
    }>();
    let sheetCompanyNameToTickerMap = new Map<string, string[]>(); // Maps company names to ticker symbols
    let swedishTickerSymbols: string[] = [];
    let swedishCompanyNamesNormalized: string[] = [];

    try {
      const { data: sheetTickerData, error: sheetTickerError } = sheetTickerResult;

      if (sheetTickerError) {
        console.error('Failed to fetch Google Sheets tickers:', sheetTickerError);
      } else {
        const typedData = sheetTickerData as SheetTickerEdgeResponse | null;
        const rawTickers = Array.isArray(typedData?.tickers)
          ? (typedData?.tickers as SheetTickerEdgeItem[])
          : [];

        const symbolSet = new Set<string>();
        const nameSet = new Set<string>();
        const currencyMap = new Map<string, string>();
        const swedishSymbolSet = new Set<string>();
        const swedishNameSet = new Set<string>();

        for (const item of rawTickers) {
          if (!item || typeof item !== 'object') continue;

          const rawSymbol = typeof item.symbol === 'string' ? item.symbol : null;
          const currencyNormalized = typeof item.currency === 'string'
            ? item.currency.trim().toUpperCase()
            : null;
          const rawPrice = typeof item.price === 'number' && Number.isFinite(item.price)
            ? item.price
            : null;
          const rawName = typeof item.name === 'string' ? item.name : null;
          
          if (rawSymbol) {
            const trimmedSymbol = rawSymbol.trim();
            const withoutPrefix = trimmedSymbol.includes(':')
              ? trimmedSymbol.split(':').pop() ?? trimmedSymbol
              : trimmedSymbol;
            const cleanedSymbol = withoutPrefix.replace(/\s+/g, '').toUpperCase();
            const normalizedSymbol = cleanedSymbol.replace(/[^A-Za-z0-9]/g, '');
            const finalSymbol = normalizedSymbol.length > 0 ? normalizedSymbol : cleanedSymbol;
            if (finalSymbol.length > 0) {
              symbolSet.add(finalSymbol);
              if (currencyNormalized) {
                currencyMap.set(finalSymbol, currencyNormalized);
                if (currencyNormalized === 'SEK') {
                  swedishSymbolSet.add(finalSymbol);
                }
              }
              // Store price information if available
              if (rawPrice !== null && currencyNormalized && rawName) {
                const rawChangePercent = typeof item.changePercent === 'number' 
                  ? item.changePercent 
                  : null;
                const rawSector = typeof item.sector === 'string' 
                  ? item.sector 
                  : null;
                
                sheetTickerPriceMap.set(finalSymbol, {
                  price: rawPrice,
                  currency: currencyNormalized,
                  name: rawName,
                  changePercent: rawChangePercent,
                  sector: rawSector,
                });
              }
              
              // Map company name to ticker symbol (if we have a name)
              if (rawName) {
                const normalizedWhitespaceName = rawName.replace(/\s+/g, ' ').trim();
                if (normalizedWhitespaceName.length > 0) {
                  const normalizedName = normalizedWhitespaceName.toLowerCase();
                  
                  if (!sheetCompanyNameToTickerMap.has(normalizedName)) {
                    sheetCompanyNameToTickerMap.set(normalizedName, []);
                  }
                  if (!sheetCompanyNameToTickerMap.get(normalizedName)!.includes(finalSymbol)) {
                    sheetCompanyNameToTickerMap.get(normalizedName)!.push(finalSymbol);
                  }
                  
                  const diacriticsStripped = removeDiacritics(normalizedWhitespaceName).trim();
                  if (diacriticsStripped.length > 0 && diacriticsStripped !== normalizedWhitespaceName) {
                    const diacriticsName = diacriticsStripped.toLowerCase();
                    if (!sheetCompanyNameToTickerMap.has(diacriticsName)) {
                      sheetCompanyNameToTickerMap.set(diacriticsName, []);
                    }
                    if (!sheetCompanyNameToTickerMap.get(diacriticsName)!.includes(finalSymbol)) {
                      sheetCompanyNameToTickerMap.get(diacriticsName)!.push(finalSymbol);
                    }
                  }
                }
              }
            }
          }
          if (rawName) {
            const normalizedWhitespaceName = rawName.replace(/\s+/g, ' ').trim();
            if (normalizedWhitespaceName.length > 0) {
              nameSet.add(normalizedWhitespaceName);

              const diacriticsStripped = removeDiacritics(normalizedWhitespaceName).trim();
              if (diacriticsStripped.length > 0 && diacriticsStripped !== normalizedWhitespaceName) {
                nameSet.add(diacriticsStripped);
              }

              if (currencyNormalized === 'SEK') {
                const lowerName = normalizedWhitespaceName.toLowerCase();
                swedishNameSet.add(lowerName);
                if (diacriticsStripped.length > 0) {
                  swedishNameSet.add(diacriticsStripped.toLowerCase());
                }
              }
            }
          }
        }

        sheetTickerSymbols = Array.from(symbolSet);
        sheetTickerNames = Array.from(nameSet);
        sheetTickerCurrencyMap = currencyMap;
        swedishTickerSymbols = Array.from(swedishSymbolSet);
        swedishCompanyNamesNormalized = Array.from(swedishNameSet);

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
        { pattern: /(kort|0[-–]2|kortsiktig)/i, value: 'short' },
        { pattern: /(medel|3[-–]5|mellanlång)/i, value: 'medium' },
        { pattern: /(lång|5\+|långsiktig|över 5)/i, value: 'long' }
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
      {
        regex: /(?:nyhet(?:erna)?|senaste\s+nytt)\s+(?:om|kring|för|hos|i|på)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      ...sheetTickerSymbolPatterns,
      ...sheetTickerNamePatterns,
    ];

    const isStockAnalysisRequest = /(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) &&
      /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity)/i.test(message);

    // Stoppord: vanliga svenska ord som kan misstas för tickers
    const SWEDISH_STOP_WORDS = new Set([
      'DOM', 'DET', 'DEN', 'VAR', 'HAR', 'KAN', 'SKA', 'VID', 'MED', 
      'OCH', 'ATT', 'SOM', 'ELLER', 'MEN', 'INTE', 'FÖR', 'PÅ', 'AV', 
      'TILL', 'OM', 'ÄR', 'VI', 'DE', 'DU', 'JAG', 'HON', 'HAN'
    ]);

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
        
        // Hoppa över stoppord
        if (SWEDISH_STOP_WORDS.has(normalizedSymbol)) {
          continue;
        }
        
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
        timeoutMs: 30000, // Öka drastiskt till 30 sekunder
        requireRecentDays: RECENT_FINANCIAL_DATA_MAX_DAYS,
        allowUndatedFromDomains: DEFAULT_UNDATED_FINANCIAL_DOMAINS,
      });

      return targetedContext;
    };

    const detectedTickers = extractTickerSymbols(message);
    const primaryDetectedTicker = detectedTickers.length > 0 ? detectedTickers[0] : null;

    // Fetch prices for detected tickers immediately (if not already in Google Sheets)
    if (detectedTickers.length > 0) {
      console.log('Fetching prices for detected tickers:', detectedTickers);
      
      for (const ticker of detectedTickers) {
        const normalizedTicker = ticker.toUpperCase().replace(/[^A-Za-z0-9]/g, '');
        
        // First check if we already have the price from Google Sheets
        const existingPriceData = sheetTickerPriceMap.get(normalizedTicker);
        
        if (!existingPriceData) {
          // Ticker not found in Google Sheets, fetch from Finnhub via get-ticker-price
          try {
            console.log(`Ticker ${ticker} not found in Google Sheets, fetching from Finnhub via get-ticker-price`);
            const authHeader = req.headers.get('Authorization');
            const invokeHeaders = authHeader ? { Authorization: authHeader } : {};
            
            // ANROP TILL GET-TICKER-PRICE ISTÄLLET FÖR LIST-SHEET-TICKERS
            const { data: liveData, error: liveError } = await supabase.functions.invoke('get-ticker-price', {
              headers: invokeHeaders,
              body: { 
                symbol: normalizedTicker,
                includeProfile: true // För att få valuta om möjligt
              },
            });
            
            if (!liveError && liveData && typeof liveData.price === 'number') {
              const currency = liveData.currency || 'USD'; // Fallback till USD om valuta saknas
              
              // Spara i mappen så det kommer med i kontexten
              sheetTickerPriceMap.set(normalizedTicker, {
                price: liveData.price,
                currency: currency,
                name: ticker, // Finnhub quote ger inte namn, så vi använder tickern som namn
                change: typeof liveData.change === 'number' ? liveData.change : null,
                changePercent: typeof liveData.changePercent === 'number' ? liveData.changePercent : null,
                high: typeof liveData.high === 'number' ? liveData.high : null,
                low: typeof liveData.low === 'number' ? liveData.low : null,
                open: typeof liveData.open === 'number' ? liveData.open : null,
                previousClose: typeof liveData.previousClose === 'number' ? liveData.previousClose : null,
              });
              
              console.log(`Found live price for ${ticker} from Finnhub: ${liveData.price} ${currency}${typeof liveData.changePercent === 'number' ? ` (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%)` : ''}`);
            } else {
              console.warn(`Failed to fetch price for ${ticker} from Finnhub:`, liveError || 'No price in response');
            }
          } catch (error) {
            console.error(`Error fetching price for ${ticker}:`, error);
          }
        } else {
          console.log(`Using existing price for ${ticker} from Google Sheets: ${existingPriceData.price} ${existingPriceData.currency}`);
        }
      }
    }

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
    const mentionsPersonalPortfolio = /(?:min|mitt|mina|vår|vårt|våra)\s+(?:portfölj(?:en)?|innehav|investeringar|aktier)/i.test(message);
    const asksAboutPortfolioImpact = /påverkar.*(?:min|mitt|mina|vår|vårt|våra).*(?:portfölj|portföljen|innehav|investeringar|aktier|sparande)/i.test(lowerCaseMessage);
    const referencesPersonalInvestments = mentionsPersonalPortfolio || asksAboutPortfolioImpact;
    const isFinancialDataRequest = FINANCIAL_DATA_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));

    let isStockMentionRequest = stockMentionsInMessage || isStockAnalysisRequest || (isFinancialDataRequest && detectedTickers.length > 0);

    if (openAIApiKey) {
      const stockIntentAssessment = await evaluateStockIntentWithOpenAI({
        message,
        detectedTickers,
        heuristicsTriggered: isStockMentionRequest,
        hasStockContext,
        analysisCue: isStockAnalysisRequest,
        apiKey: openAIApiKey,
      });

      if (stockIntentAssessment) {
        console.log('Stock intent classification:', stockIntentAssessment.classification);
        if (stockIntentAssessment.rationale) {
          console.log('Stock intent rationale:', stockIntentAssessment.rationale);
        }

        isStockMentionRequest = stockIntentAssessment.classification === 'stock_focus';
      }
    }

    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    const userHasPortfolio = Array.isArray(holdings) &&
      holdings.some((holding: HoldingRecord) => holding?.holding_type !== 'recommendation');

    // UNIFIED ROUTER: Single LLM call for intent, realtime decision, and Tavily planning
    // Build a preliminary entity-aware query for context (unified router can refine it)
    const preliminaryEntityAwareQuery = detectedTickers.length > 0 || sheetTickerNames.length > 0
      ? buildEntityAwareQuery({
          message,
          tickers: detectedTickers,
          companyNames: sheetTickerNames,
          hasRealTimeTrigger: false, // Will be updated from unified result
          userIntent: 'general_advice', // Placeholder, will be updated
          detectedEntities: [],
        })
      : null;

    const unifiedResult = await unifiedRouter({
      message,
      recentMessages: recentUserMessages,
      hasPortfolio: userHasPortfolio,
      hasUploadedDocuments,
      detectedTickers,
      entityAwareQuery: preliminaryEntityAwareQuery,
      openAIApiKey,
      model: INLINE_INTENT_MODEL,
    });

    // Extract results from unified router
    let userIntent = unifiedResult.intent;
    let detectedIntents = unifiedResult.intents;
    let interpretedEntities = unifiedResult.entities;
    let interpretedLanguage = unifiedResult.language;
    let intentSource: 'unified' | 'fallback' = unifiedResult.source === 'unified' ? 'unified' : 'fallback';
    let hasRealTimeTrigger = unifiedResult.needsRealtime;
    let realTimeQuestionType = unifiedResult.questionType;
    let recommendationPreference = unifiedResult.recommendationPreference;
    let llmTavilyPlan: TavilyLLMPlan = unifiedResult.tavilySearch;

    // Match company names from interpretedEntities to tickers
    if (interpretedEntities.length > 0 && sheetCompanyNameToTickerMap.size > 0) {
      const additionalTickers = new Set<string>();
      
      for (const entity of interpretedEntities) {
        if (!entity || typeof entity !== 'string') continue;
        
        // Try exact match first
        const normalizedEntity = entity.toLowerCase().trim();
        const matchedTickers = sheetCompanyNameToTickerMap.get(normalizedEntity);
        
        if (matchedTickers && matchedTickers.length > 0) {
          matchedTickers.forEach(ticker => additionalTickers.add(ticker));
          console.log(`Matched company name "${entity}" to tickers: ${matchedTickers.join(', ')}`);
        } else {
          // Try partial match (e.g., "Volvo AB" should match "Volvo")
          for (const [companyName, tickers] of sheetCompanyNameToTickerMap.entries()) {
            if (normalizedEntity.includes(companyName) || companyName.includes(normalizedEntity)) {
              tickers.forEach(ticker => additionalTickers.add(ticker));
              console.log(`Matched company name "${entity}" (partial) to tickers: ${tickers.join(', ')}`);
              break;
            }
          }
        }
      }
      
      // Add matched tickers to detectedTickers if not already present
      if (additionalTickers.size > 0) {
        const newTickers = Array.from(additionalTickers).filter(ticker => !detectedTickers.includes(ticker));
        if (newTickers.length > 0) {
          detectedTickers.push(...newTickers);
          console.log(`Added ${newTickers.length} tickers from company name matching: ${newTickers.join(', ')}`);
          
          // Fetch prices for newly matched tickers
          for (const ticker of newTickers) {
            const normalizedTicker = ticker.toUpperCase().replace(/[^A-Za-z0-9]/g, '');
            
            // First check if we already have the price from Google Sheets
            const existingPriceData = sheetTickerPriceMap.get(normalizedTicker);
            
            if (!existingPriceData) {
              // Ticker not found in Google Sheets, fetch from Finnhub via get-ticker-price
              try {
                console.log(`Ticker ${ticker} not found in Google Sheets, fetching from Finnhub via get-ticker-price`);
                const authHeader = req.headers.get('Authorization');
                const invokeHeaders = authHeader ? { Authorization: authHeader } : {};
                
                const { data: liveData, error: liveError } = await supabase.functions.invoke('get-ticker-price', {
                  headers: invokeHeaders,
                  body: { 
                    symbol: normalizedTicker,
                    includeProfile: true
                  },
                });
                
                if (!liveError && liveData && typeof liveData.price === 'number') {
                  const currency = liveData.currency || 'USD';
                  
                  sheetTickerPriceMap.set(normalizedTicker, {
                    price: liveData.price,
                    currency: currency,
                    name: ticker,
                    change: typeof liveData.change === 'number' ? liveData.change : null,
                    changePercent: typeof liveData.changePercent === 'number' ? liveData.changePercent : null,
                    high: typeof liveData.high === 'number' ? liveData.high : null,
                    low: typeof liveData.low === 'number' ? liveData.low : null,
                    open: typeof liveData.open === 'number' ? liveData.open : null,
                    previousClose: typeof liveData.previousClose === 'number' ? liveData.previousClose : null,
                  });
                  
                  console.log(`Found live price for ${ticker} from Finnhub: ${liveData.price} ${currency}${typeof liveData.changePercent === 'number' ? ` (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%)` : ''}`);
                } else {
                  console.warn(`Failed to fetch price for ${ticker} from Finnhub:`, liveError || 'No price in response');
                }
              } catch (error) {
                console.error(`Error fetching price for ${ticker}:`, error);
              }
            } else {
              console.log(`Using existing price for ${ticker} from Google Sheets: ${existingPriceData.price} ${existingPriceData.currency}`);
            }
          }
        }
      }
    }

    // Fallback to old system if unified router failed or returned fallback
    if (intentSource === 'fallback' || !userIntent || userIntent === 'general_advice') {
      console.log('Unified router returned fallback, using legacy intent detection');
      const interpreterResult = await detectUserIntentWithOpenAI(message, openAIApiKey);
      const interpreterIntents = interpreterResult?.intents ?? [];
      const interpreterEntities = interpreterResult?.entities ?? [];
      const interpreterLanguage = interpreterResult?.language ?? null;

      let primaryIntent = interpreterIntents[0];
      if (!primaryIntent) {
        const embeddingIntent = await classifyIntentWithEmbeddings(message, supabase, openAIApiKey);
        if (embeddingIntent) {
          primaryIntent = embeddingIntent;
        }
      }

      if (!primaryIntent) {
        const llmIntent = await classifyIntentWithLLM(message, openAIApiKey);
        if (llmIntent) {
          primaryIntent = llmIntent;
        }
      }

      if (!primaryIntent) {
        if (hasUploadedDocuments && summaryPatternTriggered) {
          primaryIntent = 'document_summary';
        } else if (isStockMentionRequest) {
          primaryIntent = 'stock_analysis';
        } else {
          const newsIntent = await evaluateNewsIntentWithOpenAI({
            message,
            hasPortfolio: userHasPortfolio,
            apiKey: openAIApiKey,
          });
          primaryIntent = newsIntent || 'general_advice';
        }
      }

      userIntent = primaryIntent ?? 'general_advice';
      detectedIntents = interpreterIntents.length > 0 ? interpreterIntents : [userIntent];
      interpretedEntities = interpreterEntities;
      interpretedLanguage = interpreterLanguage;
        intentSource = 'fallback';

      // Fallback realtime assessment
      const realTimeAssessment = await determineRealTimeSearchNeed({
        message,
        userIntent,
        recentMessages: recentUserMessages,
        openAIApiKey,
      });
      hasRealTimeTrigger = realTimeAssessment.needsRealtime;
      realTimeQuestionType = realTimeAssessment.questionType;
      recommendationPreference = realTimeAssessment.recommendationPreference;

      // Fallback Tavily planning
      const entityAwareQuery = buildEntityAwareQuery({
        message,
        tickers: detectedTickers,
        companyNames: sheetTickerNames,
        hasRealTimeTrigger,
        userIntent,
        detectedEntities: interpretedEntities,
      });

      llmTavilyPlan = await planRealtimeSearchWithLLM({
        message,
        entityAwareQuery,
        userIntent,
        recentMessages: recentUserMessages,
        openAIApiKey,
      });
    }

    if (hasUploadedDocuments && (userIntent === 'document_summary' || detectedIntents.includes('document_summary'))) {
      isDocumentSummaryRequest = true;
    }
const personalIntentTypes = new Set<IntentType>(['portfolio_optimization', 'buy_sell_decisions']);
    let shouldIncludePersonalContext = personalIntentTypes.has(userIntent)
      || isPersonalAdviceRequest
      || isPortfolioOptimizationRequest
      || referencesPersonalInvestments;

    if (conversationData?.predictionMarket) {
  shouldIncludePersonalContext = false; 
}

    if (isDocumentSummaryRequest) {
      shouldIncludePersonalContext = false;
    }

    if ((userIntent === 'market_analysis' || userIntent === 'general_news')
      && !referencesPersonalInvestments
      && !isPersonalAdviceRequest) {
      shouldIncludePersonalContext = false;
    }

    // For stock_analysis without explicit portfolio reference, exclude portfolio context
    if (userIntent === 'stock_analysis'
      && !referencesPersonalInvestments
      && !isPersonalAdviceRequest) {
      shouldIncludePersonalContext = false;
    }

    console.log('Detected user intent:', userIntent, 'source:', intentSource, 'all intents:', detectedIntents.join(', '));
    if (interpretedEntities.length > 0) {
      console.log('Interpreter entities:', interpretedEntities.join(', '));
    }
    if (interpretedLanguage) {
      console.log('Interpreter language guess:', interpretedLanguage);
    }

    if (unifiedResult.realtimeReason) {
      console.log('Realtime reason:', unifiedResult.realtimeReason);
    }

    if (realTimeQuestionType) {
      console.log('LLM question type:', realTimeQuestionType);
    }

    if (recommendationPreference) {
      console.log('LLM recommendation preference:', recommendationPreference);
    }

    if (llmTavilyPlan.reason) {
      console.log('LLM Tavily-plan:', llmTavilyPlan.reason);
    }


    const isSimplePersonalAdviceRequest = (
      isPersonalAdviceRequest || isPortfolioOptimizationRequest
    ) &&
      !isStockMentionRequest &&
      !hasRealTimeTrigger &&
      detectedTickers.length === 0;

    // Fetch Polymarket data for prediction_analysis intent
    let polymarketContext = '';
    if (userIntent === 'prediction_analysis' || detectedIntents.includes('prediction_analysis')) {
      console.log('Fetching Polymarket data for prediction analysis');
      try {
        // Build entity-aware query for Polymarket search
        const entityAwareQueryForPolymarket = buildEntityAwareQuery({
          message,
          tickers: detectedTickers,
          companyNames: sheetTickerNames,
          hasRealTimeTrigger: hasRealTimeTrigger,
          userIntent,
          detectedEntities: interpretedEntities,
        });
        const searchQuery = entityAwareQueryForPolymarket || message;
        const polymarketResults = await searchPolymarketMarkets(searchQuery, 5);
        if (polymarketResults.markets.length > 0) {
          polymarketContext = formatPolymarketContext(polymarketResults.markets, searchQuery);
          console.log(`Found ${polymarketResults.markets.length} Polymarket markets`);
        } else {
          console.log('No Polymarket markets found for query');
        }
      } catch (error) {
        console.error('Error fetching Polymarket data:', error);
      }
    }

// --- 1. Avgör om sökning behövs ---
    const shouldFetchTavily = !hasUploadedDocuments && !isDocumentSummaryRequest && !isSimplePersonalAdviceRequest && llmTavilyPlan.shouldSearch;

    // Variabel för att lagra sökresultat
    let tavilyContext: TavilyContextPayload = { formattedContext: '', sources: [] };

    // --- 2. Utför sökning (Antingen via Perplexity "Sonar" eller Tavily) ---
    if (shouldFetchTavily) {
      console.log('Hämtar realtidsdata...');

      // Alternativ A: Perplexity (Billigare & Snabbare)
// Alternativ A: Perplexity (Billigare & Snabbare)
      if (PERPLEXITY_API_KEY) {
        console.log('Använder Perplexity (Sonar) som sökverktyg...');
        try {
          const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar', // Den snabba, billiga modellen
              max_tokens: 600, // Begränsar svaret till ca 450 ord (lagom för sammanfattning)
              messages: [
                {
                  role: 'system',
                  content: 'Du är en avancerad finansiell sökmotor. Din uppgift är att hitta relevant kontext, nyheter och bakgrundsinformation för finansfrågor.\n\nFOKUS:\n- Hitta orsaker bakom marknadsrörelser.\n- Leta efter specifika händelser, rapporter, pressmeddelanden och makronyheter.\n- Sammanfatta marknadssentiment och analytikerkommentarer.\n\nUNDANTAG:\n- Du behöver INTE leta efter exakta aktiekurser eller daglig procentuell utveckling.\n\nFORMAT:\n- Svara inte som en chattbot (inget småprat).\n- Leverera enbart en faktaspäckad sammanfattning av informationen du hittar.'
                },
                {
                  role: 'user',
                  content: message // Användarens fråga
                }
              ],
              stream: false // Vi vill ha hela datan direkt
            }),
          });

          if (searchResponse.ok) {
            const data = await searchResponse.json();
            const content = data.choices?.[0]?.message?.content || '';
            const citations = data.citations || [];

            // Spara resultatet i kontext-variabeln så GPT-5.1 kan läsa det
            tavilyContext = {
              formattedContext: `Sammanfattning från realtidssökning (via Perplexity):\n${content}`,
              sources: citations
            };
            console.log(`Perplexity-sökning klar. Hittade ${citations.length} källor.`);
          } else {
            console.warn('Perplexity-sökning misslyckades:', await searchResponse.text());
          }
        } catch (error) {
          console.error('Fel vid Perplexity-sökning:', error);
        }
      }
      
      // Alternativ B: Tavily (Körs om ingen Perplexity-nyckel finns)
      else {
        // --- DIN GAMLA TAVILY-KOD (Flyttad hit) ---
        const logMessage = llmTavilyPlan.reason
          ? `LLM begärde Tavily-sökning: ${llmTavilyPlan.reason}`
          : 'LLM begärde Tavily-sökning – hämtar realtidskällor.';
        console.log(logMessage);

        const shouldPrioritizeStockAnalysis = primaryDetectedTicker && (isStockAnalysisRequest || isFinancialDataRequest);

        // Hjälpfunktioner för Tavily (flyttade in hit för scope-säkerhet eller återanvändning)
        const determineTavilyTopic = (): TavilyTopic => {
          if (llmTavilyPlan.topic) return llmTavilyPlan.topic;
          if (hasRealTimeTrigger || userIntent === 'general_news' || userIntent === 'news_update' || userIntent === 'market_analysis') return 'news';
          if (isStockAnalysisRequest || isFinancialDataRequest) return 'finance';
          return 'finance';
        };

        const shouldUseAdvancedDepthFallback = shouldPrioritizeStockAnalysis
          || isFinancialDataRequest
          || userIntent === 'news_update'
          || userIntent === 'market_analysis'
          || hasRealTimeTrigger;
        const selectedDepth: TavilySearchDepth = llmTavilyPlan.depth ?? (shouldUseAdvancedDepthFallback ? 'advanced' : 'basic');
        const shouldUseAdvancedDepth = selectedDepth === 'advanced';

        // ... (Kopiera in normalizeTickerToken, swedishTickerLookup osv om de behövs lokalt, 
        // men för enkelhetens skull antar vi att de globala funktionerna finns tillgängliga eller att vi återanvänder logiken)

        // Här lägger vi in logiken för att bygga Tavily-options direkt:
        // (Förkortad version baserad på din kod för att passa i blocket)
        const determineIncludeDomains = (): string[] => {
           // ... (Din domänlogik, här förenklad för att fungera direkt)
           // Om du har globala variabler som swedishScore, se till att de är tillgängliga.
           // Annars, använd standardlistor:
           return TRUSTED_TAVILY_DOMAINS; 
        };

        // Bygg entity-aware query
        const entityAwareQueryForTavily = buildEntityAwareQuery({
          message,
          tickers: detectedTickers,
          companyNames: sheetTickerNames,
          hasRealTimeTrigger,
          userIntent,
          detectedEntities: interpretedEntities,
        });

        const buildDefaultTavilyOptions = (): TavilySearchOptions => {
          // Upptäck om frågan handlar om releaser för att öka timeout
          const normalizedMessage = message.toLowerCase();
          const isReleaseRelatedQuery = /\b(releaser?|lansering|pipeline|spelkalender|upcoming releases?|product launch|product pipeline)\b/i.test(normalizedMessage);
          
          const baseTimeout = hasRealTimeTrigger ? 30000 : 35000;
          const timeoutMs = isReleaseRelatedQuery ? Math.max(baseTimeout * 1.3, 45000) : baseTimeout;
          
          const options: TavilySearchOptions = {
            query: (llmTavilyPlan.query && llmTavilyPlan.query.length > 2)
              ? llmTavilyPlan.query
              : entityAwareQueryForTavily ?? undefined,
            includeDomains: determineIncludeDomains(), // Eller TRUSTED_TAVILY_DOMAINS
            excludeDomains: DEFAULT_EXCLUDED_TAVILY_DOMAINS,
            includeRawContent: shouldUseAdvancedDepth,
            topic: determineTavilyTopic(),
            searchDepth: selectedDepth,
            maxResults: 6,
            timeoutMs: timeoutMs,
          };

          // Tidsfilter logik
          if (typeof llmTavilyPlan.freshnessDays === 'number' && llmTavilyPlan.freshnessDays > 0) {
            options.requireRecentDays = llmTavilyPlan.freshnessDays;
            options.days = llmTavilyPlan.freshnessDays;
            options.timeRange = llmTavilyPlan.freshnessDays <= 3 ? 'day' : 'week';
          } else if (hasRealTimeTrigger || userIntent === 'news_update') {
            options.timeRange = 'day';
            options.requireRecentDays = RECENT_NEWS_MAX_DAYS;
          } else if (userIntent === 'general_news' || userIntent === 'market_analysis') {
            options.timeRange = 'week';
            options.requireRecentDays = RECENT_MARKET_NEWS_MAX_DAYS;
          }

          if (isFinancialDataRequest) {
            options.requireRecentDays = RECENT_FINANCIAL_DATA_MAX_DAYS;
            options.allowUndatedFromDomains = DEFAULT_UNDATED_FINANCIAL_DOMAINS;
          }

          return options;
        };

        if (shouldPrioritizeStockAnalysis) {
          console.log(`Försöker hämta finansiell data för ${primaryDetectedTicker} från stockanalysis.com.`);
          tavilyContext = await fetchStockAnalysisFinancialContext(primaryDetectedTicker, message);

          if (tavilyContext.formattedContext) {
            console.log('Lyckades hämta data från stockanalysis.com.');
          } else {
            console.log('Inga resultat från stockanalysis.com, försöker med bredare Tavily-sökning.');
            tavilyContext = await fetchTavilyContext(message, buildDefaultTavilyOptions());
          }
        } else {
          tavilyContext = await fetchTavilyContext(message, buildDefaultTavilyOptions());
        }

        if (tavilyContext.formattedContext) {
          console.log('Tavily-kontent hämtad och läggs till i kontexten.');
        } else if ((tavilyContext as any).fallbackUsed) {
          console.log('Tavily-sökning misslyckades eller tog för lång tid.');
        }
      }
    }
    // AI Memory update function
    const updateAIMemory = async (
      supabase: any,
      userId: string,
      userMessage: string,
      aiResponse: string,
      existingMemory: any,
      detectedIntent: IntentType,
    ) => {
      try {
        const normalizedMessage = userMessage.toLowerCase();
        const interests: string[] = [];
        const companies: string[] = [];

        const techKeywords = ['teknik', 'ai', 'mjukvara', 'innovation', 'digitalisering'];
        const healthKeywords = ['hälsa', 'medicin', 'bioteknik', 'läkemedel', 'vård'];
        const energyKeywords = ['energi', 'förnybar', 'miljö', 'hållbarhet', 'grön'];

        if (techKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Teknik');
        }
        if (healthKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Hälsovård');
        }
        if (energyKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Förnybar energi');
        }

        const companyPattern = /\b([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*)\b/g;
        const matches = userMessage.match(companyPattern);
        if (matches) {
          companies.push(...matches.map(item => item.trim()).filter(Boolean).slice(0, 5));
        }

        const wantsConcise = /(håll.*kort|kortfattat|kort svar|snabb sammanfattning|bara det viktigaste)/i.test(userMessage);
        const wantsDetailed = /(mer detaljer|djupare analys|kan du utveckla|förklara mer|utförligt)/i.test(userMessage);

        let preferredResponseLength: 'concise' | 'detailed' | string = existingMemory?.preferred_response_length || (userMessage.length > 120 ? 'detailed' : 'concise');
        if (wantsConcise) {
          preferredResponseLength = 'concise';
        } else if (wantsDetailed) {
          preferredResponseLength = 'detailed';
        }

        let communicationStyle: 'concise' | 'detailed' | string = existingMemory?.communication_style || (userMessage.length > 60 ? 'detailed' : 'concise');
        if (wantsConcise) {
          communicationStyle = 'concise';
        } else if (wantsDetailed) {
          communicationStyle = 'detailed';
        }

        const goalPatterns: Array<{ pattern: RegExp; label: string }> = [
          { pattern: /pension/i, label: 'pension' },
          { pattern: /passiv(?:\s+|-)inkomst/i, label: 'passiv inkomst' },
          { pattern: /utdelning/i, label: 'utdelningsfokus' },
          { pattern: /långsiktig|långsiktigt/i, label: 'långsiktig tillväxt' },
          { pattern: /barnspar/i, label: 'barnsparande' },
        ];

        const detectedGoals = new Set<string>(Array.isArray(existingMemory?.current_goals) && existingMemory.current_goals.length > 0
          ? existingMemory.current_goals
          : ['långsiktig tillväxt']);
        goalPatterns.forEach(({ pattern, label }) => {
          if (pattern.test(userMessage) || pattern.test(aiResponse)) {
            detectedGoals.add(label);
          }
        });

        const updatedFavoriteSectors = Array.from(new Set([...(existingMemory?.favorite_sectors || []), ...interests])).slice(0, 6);
        const updatedPreferredCompanies = Array.from(new Set([...(existingMemory?.preferred_companies || []), ...companies])).slice(0, 6);

        let expertiseLevel: 'beginner' | 'intermediate' | 'advanced' = (existingMemory?.expertise_level as 'beginner' | 'intermediate' | 'advanced') || 'beginner';
        if (riskProfile?.investment_experience && ['beginner', 'intermediate', 'advanced'].includes(riskProfile.investment_experience)) {
          expertiseLevel = riskProfile.investment_experience as 'beginner' | 'intermediate' | 'advanced';
        }
        if ((isStockAnalysisRequest || isPortfolioOptimizationRequest) && expertiseLevel !== 'advanced') {
          expertiseLevel = expertiseLevel === 'beginner' ? 'intermediate' : 'advanced';
        }

        const existingRiskComfort = (existingMemory?.risk_comfort_patterns as Record<string, unknown> | null) ?? {};
        const followUpPreference = wantsConcise
          ? 'skip'
          : (typeof (existingRiskComfort as { follow_up_preference?: unknown }).follow_up_preference === 'string'
            ? (existingRiskComfort as { follow_up_preference: string }).follow_up_preference
            : 'auto');

        const conversationTexts = [userMessage, aiResponse].filter((value): value is string => typeof value === 'string' && value.length > 0);
        const macroThemeFromConversation = detectMacroThemeFromMessages(conversationTexts);
        const macroFocusTopic = macroThemeFromConversation
          || (isMacroTheme((existingRiskComfort as { macro_focus_topic?: unknown }).macro_focus_topic as string)
            ? (existingRiskComfort as { macro_focus_topic: MacroTheme }).macro_focus_topic
            : null)
          || null;
        const analysisAnglesFromConversation = detectAnalysisAnglesInText(conversationTexts.join('\n'));
        const existingAngles = Array.isArray((existingRiskComfort as { analysis_focus_preferences?: unknown }).analysis_focus_preferences)
          ? ((existingRiskComfort as { analysis_focus_preferences: unknown[] }).analysis_focus_preferences).filter(isAnalysisAngle)
          : [];
        const mergedAnalysisAngles = Array.from(new Set<AnalysisAngle>([
          ...existingAngles,
          ...analysisAnglesFromConversation,
        ])).slice(0, 4);

        const mergedRiskComfort: Record<string, unknown> = {
          ...existingRiskComfort,
          follow_up_preference: followUpPreference,
          last_detected_intent: detectedIntent,
          macro_focus_topic: macroFocusTopic,
          analysis_focus_preferences: mergedAnalysisAngles,
        };

        const memoryData = {
          user_id: userId,
          total_conversations: (existingMemory?.total_conversations || 0) + 1,
          communication_style: communicationStyle,
          preferred_response_length: preferredResponseLength,
          expertise_level: expertiseLevel,
          frequently_asked_topics: [
            ...(existingMemory?.frequently_asked_topics || []),
            ...(isStockAnalysisRequest ? ['aktieanalys'] : []),
            ...(isPortfolioOptimizationRequest ? ['portföljoptimering'] : [])
          ].slice(0, 6),
          favorite_sectors: updatedFavoriteSectors,
          preferred_companies: updatedPreferredCompanies,
          current_goals: Array.from(detectedGoals).slice(0, 6),
          risk_comfort_patterns: mergedRiskComfort,
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

    // Build enhanced context with intent-specific prompts
    const normalizePreference = (value: string | null | undefined): 'concise' | 'balanced' | 'detailed' | null => {
      if (!value) return null;
      if (value === 'concise' || value === 'detailed') {
        return value;
      }
      if (value === 'balanced') {
        return 'balanced';
      }
      return null;
    };

    const expertiseFromMemory = typeof aiMemory?.expertise_level === 'string'
      && ['beginner', 'intermediate', 'advanced'].includes(aiMemory.expertise_level)
      ? aiMemory.expertise_level as 'beginner' | 'intermediate' | 'advanced'
      : null;
    const expertiseFromProfile = typeof riskProfile?.investment_experience === 'string'
      && ['beginner', 'intermediate', 'advanced'].includes(riskProfile.investment_experience)
      ? riskProfile.investment_experience as 'beginner' | 'intermediate' | 'advanced'
      : null;

    let preferredLength = normalizePreference(aiMemory?.preferred_response_length);
    if (!preferredLength) {
      if (message.length < 120) {
        preferredLength = 'concise';
      } else if (message.length > 240) {
        preferredLength = 'detailed';
      } else {
        preferredLength = 'balanced';
      }
    }

    const followUpPreference = typeof (aiMemoryRiskComfort as { follow_up_preference?: unknown })?.follow_up_preference === 'string'
      ? (aiMemoryRiskComfort as { follow_up_preference: string }).follow_up_preference
      : 'auto';
    let shouldOfferFollowUp = followUpPreference !== 'skip' && aiMemory?.communication_style !== 'concise';
    if (['general_news'].includes(userIntent) && followUpPreference !== 'force') {
      shouldOfferFollowUp = false;
    }

    const combinedRecentMessages = [message, ...recentUserMessages];
    const macroThemeFromMessages = detectMacroThemeFromMessages(combinedRecentMessages);
    const analysisAnglesFromMessages = detectAnalysisAnglesInText(combinedRecentMessages.join('\n'));
    const focusSignals = extractAnalysisFocusSignals(message);
    const shouldBridgeLanguage = detectSwedishLanguage(message, interpretedLanguage);
    const includeEmojiGuidance = userIntent !== 'document_summary';
    const includeHeadingGuidance = userIntent !== 'document_summary';
    const enforceTickerFormat = isStockMentionRequest
      || ['stock_analysis', 'buy_sell_decisions', 'general_advice', 'portfolio_optimization'].includes(userIntent);

    const basePrompt = buildBasePrompt({
      shouldOfferFollowUp,
      expertiseLevel: expertiseFromMemory ?? expertiseFromProfile ?? null,
      preferredResponseLength: preferredLength,
      respectRiskProfile: userExplicitRiskFocus,
        includeTranslationDirective: shouldBridgeLanguage,
        enableEmojiGuidance: includeEmojiGuidance,
        enableHeadingGuidance: includeHeadingGuidance,
        enforceTickerFormat,
        intent: userIntent,
      });

    const headingDirective = buildHeadingDirectives({ intent: userIntent });
    const intentPrompt = buildIntentPrompt({
      intent: userIntent,
      focus: focusSignals,
      referencesPersonalInvestments,
      macroTheme: macroThemeFromMessages,
    });

    const favoriteSectorCandidates = new Set<string>();
    if (Array.isArray(aiMemory?.favorite_sectors)) {
      aiMemory.favorite_sectors.forEach((sector: string) => {
        if (typeof sector === 'string' && sector.trim()) {
          favoriteSectorCandidates.add(sector.trim());
        }
      });
    }
    if (Array.isArray(riskProfile?.sector_interests)) {
      riskProfile.sector_interests.forEach((sector: string) => {
        if (typeof sector === 'string' && sector.trim()) {
          favoriteSectorCandidates.add(sector.trim());
        }
      });
    }

    const personalizationPrompt = buildPersonalizationPrompt({
      aiMemory,
      favoriteSectors: Array.from(favoriteSectorCandidates),
      currentGoals: Array.isArray(aiMemory?.current_goals) ? aiMemory.current_goals : undefined,
      recentMessages: combinedRecentMessages,
      macroTheme: macroThemeFromMessages,
      analysisAngles: analysisAnglesFromMessages,
      intent: userIntent,
    });

    const contextSections = [basePrompt];
    if (headingDirective) {
      contextSections.push(headingDirective);
    }
    contextSections.push(intentPrompt);
    if (recommendationPreference === 'no') {
      contextSections.push('REKOMMENDATIONSPOLICY:\n- Användaren har inte bett om investeringsrekommendationer eller köp/sälj-råd.\n- Fokusera på att beskriva nuläget, risker och observationer utan att föreslå specifika affärer eller omviktningar.\n- Om du nämner bevakningspunkter, håll dem neutrala och undvik att säga åt användaren att agera.');
    } else if (recommendationPreference === 'yes') {
      contextSections.push('REKOMMENDATIONSPOLICY:\n- Användaren vill ha konkreta investeringsrekommendationer. Leverera tydliga råd med motivering när det är relevant.');
    }
  if (shouldIncludePersonalContext && personalizationPrompt) {
      contextSections.push(`PERSONLIGA PREFERENSER:\n${personalizationPrompt}`);
    }

    let contextInfo = contextSections.join('\n\n');


    // Enhanced user context with current holdings and performance
    if (shouldIncludePersonalContext && riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL (använd denna info, fråga ALDRIG efter den igen):
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Investeringshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (0–2 år)' : riskProfile.investment_horizon === 'medium' ? 'Medellång (3–5 år)' : 'Lång (5+ år)'}
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
    if (conversationData?.predictionMarket) {
      const pm = conversationData.predictionMarket;
      
      // Helper functions for formatting
      const formatNumber = (num: number | string | undefined): string => {
        if (num === undefined || num === null) return 'N/A';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return 'N/A';
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
        return n.toFixed(0);
      };

      const formatLiquidity = (liq: number | string | undefined): string => {
        if (liq === undefined || liq === null) return 'Ej angiven';
        return formatNumber(liq);
      };

      const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('sv-SE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } catch {
          return dateStr;
        }
      };
      
      // Formatera sannolikheten snyggt
      let probDisplay = 'Okänd';
      if (typeof pm.probability === 'number') {
        probDisplay = pm.probability <= 1 
          ? `${(pm.probability * 100).toFixed(1)}%` 
          : `${pm.probability.toFixed(1)}%`;
      } else if (typeof pm.probability === 'string') {
        probDisplay = pm.probability;
      }

      // Formatera outcomes
      const outcomesText = pm.outcomes && Array.isArray(pm.outcomes) && pm.outcomes.length > 0
        ? pm.outcomes.map((o: any) => 
            `  - ${o.title || 'Okänd'}: ${typeof o.price === 'number' ? o.price.toFixed(1) : o.price || 'N/A'}%`
          ).join('\n')
        : '  - Ingen data tillgänglig';
      
      // Formatera prishistorik
      const historyText = pm.priceHistory ? `
- Prisutveckling:
  - Nuvarande: ${pm.priceHistory.current || 0}%
  - 24h högsta: ${pm.priceHistory.high24h || 0}%
  - 24h lägsta: ${pm.priceHistory.low24h || 0}%
  - Förändring 24h: ${pm.priceHistory.change24h > 0 ? '+' : ''}${pm.priceHistory.change24h?.toFixed(1) || 0}%
  - Trend: ${pm.priceHistory.trend === 'up' ? 'Uppåt' : pm.priceHistory.trend === 'down' ? 'Nedåt' : 'Stabil'}` : '';
      
      // Formatera metadata
      const metadataLines: string[] = [];
      if (pm.endDate) {
        metadataLines.push(`- Slutdatum: ${formatDate(pm.endDate)}`);
      }
      if (pm.tags && Array.isArray(pm.tags) && pm.tags.length > 0) {
        metadataLines.push(`- Taggar: ${pm.tags.join(', ')}`);
      }
      if (pm.liquidity !== undefined && pm.liquidity !== null) {
        metadataLines.push(`- Likviditet: ${formatLiquidity(pm.liquidity)}`);
      }
      if (pm.closed === true) {
        metadataLines.push(`- Status: Stängd`);
      } else if (pm.active === true || pm.active === undefined) {
        metadataLines.push(`- Status: Aktiv`);
      }
      const metadataText = metadataLines.length > 0 ? metadataLines.join('\n') : '';

      contextInfo += `\n\nPREDIKTIONSMARKNAD (Detta är ämnet för diskussionen):
- Marknadsfråga: "${pm.question || 'Okänd marknad'}"
- Beskrivning: ${pm.description || '-'}
- Marknads-ID: ${pm.id || '-'}
${pm.slug ? `- Slug: ${pm.slug}` : ''}

OUTCOMES OCH SANNOLIKHETER:
${outcomesText}${historyText}

MARKNADSDATA:
- Volym: ${pm.volume || 'Ej angiven'}${pm.volumeNum ? ` (${formatNumber(pm.volumeNum)})` : ''}
${metadataText}

INSTRUKTION FÖR PREDIKTIONER:
- Du har fått exakt realtidsdata ovan. Användaren ser detta just nu.
- Om användaren frågar "vad är oddsen?" eller "vad är sannolikheten?", svara direkt med ${probDisplay} och analysera vad det innebär.
- Använd prishistoriken för att diskutera trender och förändringar.
- Jämför nuvarande sannolikhet med historiska nivåer (högsta/lägsta) för att ge kontext.
- Diskutera om ${probDisplay} verkar högt eller lågt baserat på nyhetsläget och trender.
- Om det finns flera outcomes, diskutera alla alternativ, inte bara primära.
- Använd taggar och metadata för att ge mer kontext om marknaden.`;
    }

    // Add current portfolio context with latest valuations
    if (shouldIncludePersonalContext && holdings && holdings.length > 0) {
      const actualHoldings: HoldingRecord[] = (holdings as HoldingRecord[]).filter((h) => h.holding_type !== 'recommendation');
      if (actualHoldings.length > 0) {
        const holdingsWithValues = actualHoldings.map((holding) => ({
          holding,
          value: resolveHoldingValue(holding),
        }));

        const totalValue = holdingsWithValues.reduce((sum, item) => sum + item.value.valueInSEK, 0);

        // Calculate return data
        let totalInvested = 0;
        const holdingsWithReturns = holdingsWithValues.map(({ holding, value }) => {
          const purchasePrice = parseNumericValue(holding.purchase_price);
          const quantity = value.quantity;
          const currentValue = value.valueInSEK;
          
          let investedValue = 0;
          let returnPercentage: number | null = null;
          let returnAmount = 0;
          const hasPurchasePrice = purchasePrice !== null && purchasePrice > 0 && quantity > 0;
          
          if (hasPurchasePrice) {
            // Get currency for purchase price (use holding currency or price currency)
            const purchaseCurrency = typeof holding.currency === 'string' && holding.currency.trim().length > 0
              ? holding.currency.trim().toUpperCase()
              : typeof holding.price_currency === 'string' && holding.price_currency.trim().length > 0
                ? holding.price_currency.trim().toUpperCase()
                : value.priceCurrency;
            
            const purchaseValueInOriginalCurrency = purchasePrice * quantity;
            investedValue = convertToSEK(purchaseValueInOriginalCurrency, purchaseCurrency);
            returnAmount = currentValue - investedValue;
            returnPercentage = investedValue > 0 ? (returnAmount / investedValue) * 100 : 0;
            totalInvested += investedValue;
          }
          
          return {
            holding,
            value,
            investedValue,
            returnAmount,
            returnPercentage,
            hasPurchasePrice,
          };
        });

        const totalReturn = totalValue - totalInvested;
        const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : null;

        const actualHoldingsLookup = new Map<string, { label: string; percentage: number; valueInSEK: number }>();

        holdingsWithReturns.forEach(({ holding, value }) => {
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

        const topHoldings = [...holdingsWithReturns]
          .sort((a, b) => b.value.valueInSEK - a.value.valueInSEK)
          .slice(0, 5);

        const topHoldingsDetails = topHoldings.map(({ holding, value, returnPercentage }) => {
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
            returnPercentage,
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
  - Antal innehav: ${actualHoldings.length}`;

        // Add return data if available
        if (totalInvested > 0 && totalReturnPercentage !== null) {
          const totalInvestedFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(totalInvested));
          const totalReturnFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, signDisplay: 'always' }).format(Math.round(totalReturn));
          const totalReturnPercentageFormatted = totalReturnPercentage >= 0 
            ? `+${totalReturnPercentage.toFixed(1)}` 
            : totalReturnPercentage.toFixed(1);
          
          contextInfo += `\n  - Totalt investerat: ${totalInvestedFormatted} SEK
  - Total avkastning: ${totalReturnFormatted} SEK (${totalReturnPercentageFormatted}%)`;
        }

        contextInfo += `\n  - Största positioner: ${holdingsSummary || 'Inga registrerade innehav'}`;

        // Dynamically add per-holding returns only when user asks about specific returns
        const returnQuestionAnalysis = detectReturnQuestion(message, detectedTickers, interpretedEntities);
        
        if (returnQuestionAnalysis.isReturnQuestion && returnQuestionAnalysis.questionType !== 'total') {
          const relevantHoldings = matchHoldingsToQuestion(returnQuestionAnalysis, holdingsWithReturns);
          
          if (relevantHoldings.length > 0) {
            const returnsSummary = relevantHoldings
              .map(({ holding, value, returnPercentage, investedValue, returnAmount }, index) => {
                const label = holding.symbol || holding.name || 'Okänt innehav';
                const percentage = totalValue > 0 ? (value.valueInSEK / totalValue) * 100 : 0;
                const returnSign = returnPercentage! >= 0 ? '+' : '';
                const investedFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(investedValue));
                const currentFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(value.valueInSEK));
                const returnFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, signDisplay: 'always' }).format(Math.round(returnAmount));
                
                // Add ranking number for ranking questions
                const prefix = returnQuestionAnalysis.questionType === 'ranking' 
                  ? `${index + 1}. ` 
                  : '    • ';
                
                return `${prefix}${label} (${percentage.toFixed(1)}%): ${returnSign}${returnPercentage!.toFixed(1)}% sedan köp (investerat: ${investedFormatted} SEK, nuvarande värde: ${currentFormatted} SEK, vinst/förlust: ${returnFormatted} SEK)`;
              })
              .join('\n');
            
            const questionTypeLabel = returnQuestionAnalysis.questionType === 'ranking'
              ? 'dina innehav sorterade efter avkastning (högst först)'
              : returnQuestionAnalysis.questionType === 'all' 
                ? 'dina innehav' 
                : returnQuestionAnalysis.questionType === 'specific'
                  ? 'dina nämnda innehav'
                  : 'dina innehav';
            
            contextInfo += `\n  - Avkastning för ${questionTypeLabel}:\n${returnsSummary}`;
          }
        }

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

          if (userExplicitRiskFocus && portfolio.risk_score) {
            contextInfo += `\n- Portföljens riskpoäng: ${portfolio.risk_score}`;
          } else if (!userExplicitRiskFocus && portfolio.risk_score) {
            contextInfo += `\n- Riskprofil: Finns sparad men ska endast användas om användaren efterfrågar riskanalys.`;
          }

          contextInfo += `\n- Förväntad årlig avkastning: ${portfolio.expected_return || 'Ej beräknad'}%`;
        }

        // Add instructions for using return data
        if (totalInvested > 0 && totalReturnPercentage !== null) {
          contextInfo += `\n\nAVKASTNINGSINFORMATION:
- Använd avkastningsdata när användaren frågar om portföljens prestanda eller resultat.
- Formulera svar som "du är upp X% sedan investeringen påbörjades" eller "portföljen har genererat X% avkastning" när det är relevant.
- När detaljerad per-holding avkastning finns i kontexten (ovan), använd den för att ge specifika svar om de nämnda aktierna.
- När användaren frågar om "vilka innehav har gett mest avkastning" eller liknande ranking-frågor, använd den sorterade listan som finns i kontexten (redan sorterad efter avkastning, högst först).
- Jämför avkastning mellan olika innehav när det är meningsfullt och användaren frågar om det.
- Observera att inköpsdatum saknas, så du kan INTE beräkna årlig avkastning eller tidsbaserade mått - använd endast total avkastning i procent.
- När användaren frågar om "hur mycket är jag upp totalt" eller liknande, referera till den totala avkastningen i procent som anges ovan.
- Om användaren frågar om specifika aktiers avkastning och den informationen finns i kontexten, använd den detaljerade avkastningsdata som inkluderar investerat belopp, nuvarande värde och vinst/förlust.`;
        }
      }
    }

    // Add ticker price information if any tickers were detected
    if (detectedTickers.length > 0 && sheetTickerPriceMap.size > 0) {
      const tickerPriceInfo: string[] = [];
      const yahooPriceInfo: string[] = [];
      
      for (const ticker of detectedTickers) {
        const normalizedTicker = ticker.toUpperCase().replace(/[^A-Za-z0-9]/g, '');
        const priceData = sheetTickerPriceMap.get(normalizedTicker);
        
        if (priceData) {
          const formattedPrice = priceData.price.toLocaleString('sv-SE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          
          let priceLine = `- ${priceData.name} (${ticker}): ${formattedPrice} ${priceData.currency}`;
          
          // Prioritize changePercent from Google Sheets if available, otherwise use Finnhub data
          // Check if we have changePercent from Google Sheets (no 'change' field means it's from Google Sheets)
          if (priceData.changePercent !== null && priceData.changePercent !== undefined && 
              (priceData.change === null || priceData.change === undefined)) {
            // This is from Google Sheets (only has changePercent, no change field)
            const changeSign = priceData.changePercent >= 0 ? '+' : '';
            priceLine += ` (Idag: ${changeSign}${priceData.changePercent.toFixed(2)}%)`;
          } else if (priceData.change !== null && priceData.change !== undefined && 
                     priceData.changePercent !== null && priceData.changePercent !== undefined) {
            // This is from Finnhub (has both change and changePercent)
            const changeSign = priceData.change >= 0 ? '+' : '';
            const changeFormatted = priceData.change.toLocaleString('sv-SE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            priceLine += ` (${changeSign}${changeFormatted} ${priceData.currency}, ${changeSign}${priceData.changePercent.toFixed(2)}%)`;
          } else if (priceData.changePercent !== null && priceData.changePercent !== undefined) {
            // Fallback: only changePercent available (could be from either source)
            const changeSign = priceData.changePercent >= 0 ? '+' : '';
            priceLine += ` (Idag: ${changeSign}${priceData.changePercent.toFixed(2)}%)`;
          }
          
          // Add sector from Google Sheets if available
          if (priceData.sector) {
            priceLine += ` | Sektor: ${priceData.sector}`;
          }
          
          if (priceData.high && priceData.low) {
            const highFormatted = priceData.high.toLocaleString('sv-SE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            const lowFormatted = priceData.low.toLocaleString('sv-SE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            priceLine += ` | Dagens intervall: ${lowFormatted} - ${highFormatted} ${priceData.currency}`;
          }
          
          if (priceData.open) {
            const openFormatted = priceData.open.toLocaleString('sv-SE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            priceLine += ` | Öppning: ${openFormatted} ${priceData.currency}`;
          }
          
          if (priceData.previousClose) {
            const prevCloseFormatted = priceData.previousClose.toLocaleString('sv-SE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            priceLine += ` | Stängning igår: ${prevCloseFormatted} ${priceData.currency}`;
          }
          
          // Check if this ticker was in the original Google Sheets list
          const wasInOriginalSet = sheetTickerSymbols.includes(normalizedTicker);
          if (wasInOriginalSet) {
            tickerPriceInfo.push(priceLine);
          } else {
            // This price was fetched from Finnhub (live price)
            yahooPriceInfo.push(priceLine);
          }
        }
      }
      
      if (tickerPriceInfo.length > 0) {
        contextInfo += `\n\nAKTIEKURSER FRÅN GOOGLE SHEETS:\n${tickerPriceInfo.join('\n')}\n\nVIKTIGT: Dessa priser är FAKTA. När användaren nämner dessa tickers eller frågar om priser, presentera ENDAST dessa faktiska priser naturligt och direkt. Inkludera ALLTID dagsutveckling (förändring i procent, markerat som "Idag: +X%") om den finns tillgänglig i listan ovan. Om användaren frågar "hur har dom gått idag?" eller "hur går [ticker] idag?", använd dagsutvecklingen från listan ovan. Inkludera också relevanta nyckeltal som dagens högsta/lägsta, öppningskurs och stängningskurs från föregående dag om de finns. Presentera informationen naturligt, t.ex. "Volvo (VOLV B) står i 245,50 SEK (Idag: +0,95%). Dagens intervall: 243,20 - 246,80 SEK. Öppning: 244,00 SEK." Om sektor finns i listan, inkludera den också när det är relevant. Spekulera INTE eller hitta på priser - använd bara de priser som finns här. Nämn INTE varifrån priserna kommer (inte "enligt prislista", "enligt Google Sheets" etc.) - presentera bara priset direkt.`;
      }
      
      if (yahooPriceInfo.length > 0) {
        contextInfo += `\n\nAKTUELLA LIVE-KURSER FRÅN FINNHUB (realtidsdata):\n${yahooPriceInfo.join('\n')}\n\nVIKTIGT: Dessa priser är FAKTA och aktuella realtidskurser. När användaren nämner dessa tickers eller frågar om priser, presentera ENDAST dessa faktiska priser naturligt och direkt. Inkludera ALLTID dagsutveckling (förändring i absolut värde och procent) om den finns tillgänglig. Inkludera också relevanta nyckeltal som dagens högsta/lägsta, öppningskurs och stängningskurs från föregående dag om de finns. Presentera informationen naturligt, t.ex. "Apple (AAPL) står i 185,64 USD (+1,23 USD, +0,67%). Dagens intervall: 184,50 - 186,20 USD. Öppning: 184,80 USD." Om användaren frågar "vad står [ticker] i?" eller "hur går [ticker] nu?" eller "hur har dom gått idag?", svara direkt med det faktiska priset och dagsutvecklingen. Spekulera INTE eller hitta på priser - använd bara de priser som finns här. Nämn INTE varifrån priserna kommer (inte "enligt Finnhub", "enligt prislista" etc.) - presentera bara priset direkt.`;
      }
    }

    let documentContextHandled = false;
    // Initialize document matches variable for telemetry (needs to be in outer scope)
    let documentMatchesForTelemetry: any[] = [];

    if (filteredDocumentIds.length > 0) {
      if (isDocumentSummaryRequest) {
        try {
          const { data: documentRecords, error: documentRecordsError } = await supabase
            .from('chat_documents')
            .select('id, user_id, name, metadata, chunk_count')
            .in('id', filteredDocumentIds)
            .eq('user_id', userId);

          if (documentRecordsError) {
            console.error('Failed to fetch document metadata for summary', documentRecordsError);
          } else {
            const documentMetaMap = new Map<string, { name: string; metadata: Record<string, unknown> | null; chunkCount: number | null }>();
            const authorizedDocumentIds: string[] = [];

            (documentRecords ?? []).forEach((record) => {
              if (
                record &&
                typeof record.id === 'string' &&
                typeof record.user_id === 'string' &&
                record.user_id === userId
              ) {
                authorizedDocumentIds.push(record.id);
                documentMetaMap.set(record.id, {
                  name: typeof record.name === 'string' && record.name.trim().length > 0 ? record.name.trim() : 'Dokument',
                  metadata: (record.metadata ?? null) as Record<string, unknown> | null,
                  chunkCount: typeof record.chunk_count === 'number' ? record.chunk_count : null,
                });
              }
            });

            if (authorizedDocumentIds.length === 0) {
              console.warn('No authorized documents found for summary request', { filteredDocumentIds, userId });
            }

            const { data: chunkData, error: chunkError } = authorizedDocumentIds.length === 0
              ? { data: null, error: null }
              : await supabase
                .from('chat_document_chunks')
                .select('document_id, content, metadata, chunk_index')
                .in('document_id', authorizedDocumentIds)
                .order('document_id', { ascending: true })
                .order('chunk_index', { ascending: true });

            if (chunkError) {
              console.error('Failed to fetch document chunks for summary', chunkError);
            } else if (Array.isArray(chunkData) && chunkData.length > 0) {
              const groupedChunks = new Map<string, Array<{ content: string; metadata: { page_number?: number } | null; chunk_index: number | null }>>();

              chunkData.forEach((entry) => {
                if (!entry || typeof entry.document_id !== 'string') {
                  return;
                }

                const existing = groupedChunks.get(entry.document_id) ?? [];
                const metadata = (entry.metadata ?? null) as { page_number?: number } | null;
                existing.push({
                  content: typeof entry.content === 'string' ? entry.content : '',
                  metadata,
                  chunk_index: typeof entry.chunk_index === 'number' ? entry.chunk_index : null,
                });
                groupedChunks.set(entry.document_id, existing);
              });

              const summaryContextSections: string[] = [];
              let sourceCounter = 1;

              for (const [documentId, entries] of groupedChunks.entries()) {
                const sortedEntries = entries.sort((a, b) => (a.chunk_index ?? 0) - (b.chunk_index ?? 0));
                const meta = documentMetaMap.get(documentId);
                const documentName = meta?.name ?? 'Dokument';
                const metadataRecord = meta?.metadata as { page_count?: unknown } | null;
                const pageCount = typeof metadataRecord?.page_count === 'number' ? metadataRecord.page_count : null;
                const chunkCount = meta?.chunkCount ?? sortedEntries.length;

                const headerParts: string[] = [documentName];
                if (pageCount) {
                  headerParts.push(`${pageCount} sidor`);
                }
                headerParts.push(`${chunkCount} textavsnitt`);

                const aggregatedContent = sortedEntries
                  .map((entry) => {
                    const pageNumberRaw = typeof entry.metadata?.page_number === 'number'
                      ? entry.metadata.page_number
                      : null;
                    const pagePrefix = pageNumberRaw !== null ? `[Sida ${pageNumberRaw}] ` : '';
                    return `${pagePrefix}${entry.content}`.trim();
                  })
                  .filter((value) => value.length > 0)
                  .join('\n\n');

                if (aggregatedContent.length === 0) {
                  continue;
                }

                const truncatedContent = aggregatedContent.length > DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT
                  ? `${aggregatedContent.slice(0, DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT)}\n[Texten har kortats för att passa sammanfattningsuppdraget.]`
                  : aggregatedContent;

                summaryContextSections.push(`Källa ${sourceCounter}: ${headerParts.join(' – ')}\n${truncatedContent}`);
                sourceCounter += 1;
              }

              if (summaryContextSections.length > 0) {
                contextInfo += `\n\nFULLSTÄNDIGT DOKUMENTUNDERLAG FÖR SAMMANFATTNING:\n${summaryContextSections.join('\n\n')}`;
                contextInfo += `\n\nSAMMANFATTNINGSUPPDRAG:\n- Läs igenom hela textunderlaget ovan som representerar användarens uppladdade dokument.\n- Basera hela svaret på dokumentinnehållet som primär källa och komplettera endast med egna resonemang.\n- Identifiera dokumentets syfte, struktur och viktigaste slutsatser.\n- Destillera 5–7 centrala nyckelpunkter med relevanta siffror eller citat och hänvisa till sidnummer när det går.\n- Presentera en heltäckande men kondenserad sammanfattning med tydliga rubriker (t.ex. \"Översikt\", \"Nyckelpunkter\", \"Fördjupning\").\n- Avsluta med en sektion \"VD´ns ord och reflektioner\" om dokumentet antyder åtgärder eller uppföljning.\n- Undvik att återge långa textstycken ordagrant – fokusera på analys och tolkning.`;
                documentContextHandled = true;
              }
            }
          }
        } catch (error) {
          console.error('Failed to prepare document summary context', error);
        }
      }

      if (!documentContextHandled) {
        try {
          const queryEmbedding = await fetchEmbedding(message, openAIApiKey);
          if (queryEmbedding) {
            const { data: documentMatches, error: documentMatchError } = await supabase.rpc('match_chat_document_chunks', {
              p_query_embedding: queryEmbedding,
              p_match_count: DOCUMENT_CONTEXT_MATCH_COUNT * 2, // Get more chunks for re-ranking
              p_user_id: userId,
              p_document_ids: filteredDocumentIds.length > 0 ? filteredDocumentIds : null,
            });
            
            // Store for telemetry
            documentMatchesForTelemetry = Array.isArray(documentMatches) ? documentMatches : [];

            if (documentMatchError) {
              console.error('Document match RPC failed', documentMatchError);
            } else if (Array.isArray(documentMatches) && documentMatches.length > 0) {
              // Re-rank chunks for better relevance
              const chunks: DocumentChunk[] = (documentMatches as Array<{
                document_id: string;
                document_name?: string | null;
                content: string;
                metadata?: { page_number?: number } | null;
                similarity?: number | null;
                chunk_index?: number | null;
              }>).map(match => ({
                document_id: match.document_id,
                document_name: match.document_name,
                content: match.content,
                metadata: match.metadata as { page_number?: number } | null,
                similarity: typeof match.similarity === 'number' ? match.similarity : null,
                chunk_index: typeof match.chunk_index === 'number' ? match.chunk_index : null,
              }));

              const rerankedChunks = await rerankDocumentChunks(chunks, message, openAIApiKey);
              const topChunks = selectTopChunks(rerankedChunks, DOCUMENT_CONTEXT_MATCH_COUNT, 0.3);
              
              // Store document processing info for telemetry (will be used later)
              documentMatchesForTelemetry = documentMatches;

              const groupedMatches = new Map<string, { name: string; entries: Array<{ content: string; metadata: { page_number?: number }; similarity: number | null; rerankScore?: number }> }>();

              topChunks.forEach((chunk) => {
                if (!chunk.document_id) {
                  return;
                }

                const existing = groupedMatches.get(chunk.document_id) ?? {
                  name: typeof chunk.document_name === 'string' && chunk.document_name.trim().length > 0
                    ? chunk.document_name.trim()
                    : 'Dokument',
                  entries: [],
                };

                existing.entries.push({
                  content: chunk.content,
                  metadata: (chunk.metadata ?? {}) as { page_number?: number },
                  similarity: chunk.similarity ?? null,
                  rerankScore: chunk.rerankScore,
                });

                groupedMatches.set(chunk.document_id, existing);
              });

              const documentContextLines: string[] = [];
              let sourceCounter = 1;

              for (const [, value] of groupedMatches) {
                // Sort entries by rerank score if available
                const sortedEntries = value.entries.sort((a, b) => {
                  const scoreA = a.rerankScore ?? a.similarity ?? 0;
                  const scoreB = b.rerankScore ?? b.similarity ?? 0;
                  return scoreB - scoreA;
                });

                const topEntries = sortedEntries.slice(0, 3);
                topEntries.forEach((entry) => {
                  const pageNumber = typeof entry.metadata?.page_number === 'number' ? entry.metadata.page_number : undefined;
                  const score = entry.rerankScore ?? entry.similarity ?? null;
                  const similarityText = score !== null ? ` (Relevans ${(score * 100).toFixed(1)}%)` : '';
                  const header = `${value.name}${pageNumber ? ` – Sida ${pageNumber}` : ''}${similarityText}`;
                  documentContextLines.push(`Källa ${sourceCounter}: ${header}\n${entry.content}`);
                  sourceCounter += 1;
                });
              }

              if (documentContextLines.length > 0) {
                contextInfo += `\n\nDOKUMENTUNDERLAG FRÅN UPPLADDADE FILER:\n${documentContextLines.join('\n\n')}`;
                contextInfo += `\n\nSÅ HANTERAR DU UPPLADDADE DOKUMENT:\n- Utgå från dokumentet som primär källa och dra dina slutsatser med det som bas.\n- Lyft fram konkreta siffror och nyckeltal från underlagen när de stärker din analys (t.ex. omsättning, resultat, kassaflöden).\n- Ange tydligt vilken källa och sida siffrorna kommer från, exempelvis "Årsredovisning 2023 – Sida 12".\n- Knyt rekommendationer och slutsatser till dessa dokumenterade fakta när det är relevant.`;
              }
            }
          }
        } catch (error) {
          console.error('Failed to enrich chat with document context', error);
        }
      }
    }

    // Add response structure requirements
    const structureLines = [
      'SVARSSTRUKTUR (ANPASSNINGSBAR):',
      '- Anpassa alltid svarens format efter frågans karaktär och utveckla resonemanget så långt som behövs för att svaret ska bli komplett – det finns ingen strikt begränsning på längden.',
      '- Vid generella marknadsfrågor: använd en nyhetsbrevsliknande ton och rubriker enligt variationen ovan.',
      '- Vid djupgående analyser: använd de rubriker som angavs tidigare (analys, rekommendation, risker, åtgärder) men ta enbart med sektioner som tillför värde.',
    ];

    if (isDocumentSummaryRequest) {
      structureLines.push('- Vid dokumentsammanfattningar: läs igenom hela underlaget, leverera en strukturerad översikt och inkludera sektioner för Översikt, Nyckelpunkter samt VD´ns ord och reflektioner när materialet motiverar det.');
    }

    if (recommendationPreference === 'no') {
      structureLines.push('- Ge inga investeringsrekommendationer, köp/sälj-råd eller portföljjusteringar i detta svar. Fokusera på att ge lägesbild och analys.');
    } else if (recommendationPreference === 'yes') {
      structureLines.push('- Om användaren efterfrågar vägledning, formulera det som bevakningspunkter eller saker att hålla koll på i stället för direkta köp-/säljrekommendationer.');
    } else {
      structureLines.push('- Lyft endast fram bevakningspunkter när de verkligen behövs och undvik direkta rekommendationer.');
    }

    const emojiLines = [
      'EMOJI-ANVÄNDNING:',
      '- Använd relevanta emojis för att förstärka budskapet, men max en per sektion och undvik emojis i avsnitt som beskriver allvarliga risker eller förluster.',
      '- Rotera emojis och rubriker enligt instruktionen ovan för att undvika monotona svar.',
    ];

    let recommendationSectionLine: string;
    if (recommendationPreference === 'no') {
      recommendationSectionLine = '- "Håll koll på detta" – Hoppa över denna sektion om användaren inte uttryckligen ber om bevakningspunkter.';
    } else if (recommendationPreference === 'yes') {
      recommendationSectionLine = '- "Håll koll på detta" – Om du anser att det tillför värde, lyft 1–2 viktiga observationer att bevaka i stället för konkreta rekommendationer.';
    } else {
      recommendationSectionLine = '- "Håll koll på detta" – Använd endast när det verkligen behövs och begränsa dig till korta bevakningspunkter.';
    }

    const optionalSections = isDocumentSummaryRequest
      ? [
          'MÖJLIGA SEKTIONER (välj flexibelt utifrån behov):',
          '- Översikt – Ge en kort bakgrund till dokumentet och dess huvudsakliga syfte.',
          '- Nyckelpunkter – Lista 5–7 huvudinsikter med sidreferenser när det är möjligt.',
          '- Fördjupning – Använd när specifika avsnitt kräver extra analys eller kontext.',
          recommendationSectionLine,
          '- Risker & Överväganden – Endast om dokumentet tar upp begränsningar eller riskmoment.',
          '- VD´ns ord och reflektioner – Lyft sammanfattade budskap eller nästa steg som framgår av dokumentet.',
          '- Uppföljning – Använd för att föreslå hur användaren kan arbeta vidare med materialet.',
        ]
      : [
          'MÖJLIGA SEKTIONER (välj flexibelt utifrån behov):',
          '- Analys/Insikt – Sammanfatta situationen eller frågan.',
          recommendationSectionLine,
          '- Risker & Överväganden – Endast om det finns relevanta risker att lyfta.',
          '- Åtgärdsplan/Nästa steg – Använd vid komplexa frågor som kräver steg-för-steg.',
          '- Nyhetsöversikt – Använd vid frågor om senaste nyheter eller marknadshändelser.',
          '- Uppföljning – Använd när du föreslår fortsatta analyser eller handlingar.',
        ];

    const importantLines = [
      'VIKTIGT:',
      '- Använd aldrig hela strukturen slentrianmässigt – välj endast sektioner som ger värde.',
      '- Variera rubriker och emojis för att undvika repetitiva svar.',
      '- Avsluta endast med en öppen fråga när det känns naturligt och svaret inte redan är komplett.',
      '- Lägg endast till en sektion "Källor:" när du fick realtidsdata via Tavily, och lista då länkarna exakt i den ordning du fick dem. I alla andra fall ska ingen källsektion eller källa nämnas.',
    ];

    if (isDocumentSummaryRequest) {
      importantLines.push('- Vid dokumentsammanfattningar: inkludera sidreferenser när du nämner nyckelfakta och fokusera på att destillera det viktigaste i stället för att citera långa textavsnitt.');
    }

    contextInfo += `
${structureLines.join('\n')}

${emojiLines.join('\n')}

${optionalSections.join('\n')}

${importantLines.join('\n')}
`;


    const model = selectChatModel({
      hasRealTimeTrigger,
      isDocumentSummaryRequest,
      isSimplePersonalAdviceRequest,
      userIntent,
    });

    console.log('Selected model:', model, 'for request type:', {
      isStockAnalysis: isStockAnalysisRequest,
      isPortfolioOptimization: isPortfolioOptimizationRequest,
      messageLength: message.length,
      historyLength: totalHistoryEntries,
      hasRealTimeTrigger,
      isDocumentSummaryRequest,
      isSimplePersonalAdviceRequest,
      userIntent
    });

    const hasMarketData = tavilyContext.formattedContext.length > 0;
    const tavilyFallbackUsed = (tavilyContext as any).fallbackUsed === true;
    let tavilySourceInstruction = '';
    let tavilyAnswerInstruction = '';
    
    // Kontrollera om Tavily-sammanfattningen finns (den börjar med "Sammanfattning från realtidssökning")
    const hasTavilyAnswer = tavilyContext.formattedContext.includes('Sammanfattning från realtidssökning:');
    if (hasTavilyAnswer) {
      // Instruera huvud-LLM att vikta Tavily-sammanfattningen högre
      tavilyAnswerInstruction = '\n\nVIKTIGT OM TAVILY-SAMMANFATTNINGEN:\nTavily-sammanfattningen ovan är en sammanställning baserad på flera källor. Vikta denna sammanfattning högre än de individuella resultaten när du svarar - den representerar en syntes av informationen. Du kan referera till detaljerna nedan för specifika fakta, men använd sammanfattningen som primär källa för ditt svar för att undvika hallucinationer och spara tokens.';
    }
    
    if (tavilyFallbackUsed && !hasMarketData) {
      // Add fallback note to system prompt when Tavily fails
      tavilySourceInstruction = `\n\nVIKTIGT: Realtidssökning kunde inte genomföras på grund av timeout eller fel. Svara baserat på din befintliga kunskap och nämn tydligt i slutet av ditt svar att du inte har tillgång till senaste nyheterna eller kurserna just nu.`;
    } else if (tavilyContext.sources.length > 0) {
      const formattedSourcesList = tavilyContext.sources
        .map((url, index) => `${index + 1}. ${url}`)
        .join('\n');
      tavilySourceInstruction = `\n\nKÄLLHÄNVISNINGAR FÖR AGENTEN:\n${formattedSourcesList}\n\nINSTRUKTION: Dessa länkar kommer från din realtidssökning – väv in dem i resonemanget när du hänvisar till faktan och avsluta svaret med en sektion "Källor:" som listar exakt samma länkar i samma ordning, en per rad. Ange inga andra källor.`;
    }

    // Build messages array with enhanced context
    let messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; name?: string; tool_calls?: any[] }> = [
      { role: 'system', content: contextInfo + tavilyAnswerInstruction + tavilyContext.formattedContext + tavilySourceInstruction + (polymarketContext ? `\n\n${polymarketContext}` : '') },
      ...(summaryMessage ? [summaryMessage] : []),
      ...preparedChatHistory,
      { role: 'user', content: message }
    ];

    // Helper function to handle tool calls and return tool responses
    const handleToolCalls = async (toolCalls: any[], messagesArray: typeof messages): Promise<Array<{ role: 'tool'; tool_call_id: string; name: string; content: string }>> => {
      const toolResponses: Array<{ role: 'tool'; tool_call_id: string; name: string; content: string }> = [];
      
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'get_stock_data') {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            const ticker = args.ticker;
            
            if (!ticker || typeof ticker !== 'string') {
              console.warn('Invalid ticker in get_stock_data call:', args);
              toolResponses.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: 'get_stock_data',
                content: 'Kunde inte hitta ticker i förfrågan. Försök söka med Tavily istället.'
              });
              continue;
            }

            console.log(`AI vill hämta aktiedata för: ${ticker}`);
            
            const stockData = await fetchStockData(ticker);
            
            let toolOutput = '';
            if (stockData) {
              toolOutput = formatStockDataForContext(stockData);
            } else {
              // VIKTIGT: Berätta för AI:n att det misslyckades så att den kan använda Tavily istället
              toolOutput = `FEL: Kunde inte hämta realtidsdata för ${ticker} från API. Försök att söka manuellt med 'tavily_search' efter "nuvarande aktiekurs och P/E-tal för ${ticker}" istället.`;
            }
            
            toolResponses.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'get_stock_data',
              content: toolOutput
            });
          } catch (error) {
            console.error('Error handling get_stock_data tool call:', error);
            toolResponses.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'get_stock_data',
              content: 'Ett fel uppstod vid hämtning av aktiedata. Försök söka med Tavily istället.'
            });
          }
        }
      }
      
      return toolResponses;
    };

    // Enhanced telemetry logging with decision tracking
    const requestId = crypto.randomUUID();
    const decisionLog = {
      intent: {
        primary: userIntent,
        all: detectedIntents,
        source: intentSource,
        confidence: null, // Confidence not available from unified router
      },
      realtime: {
        needed: hasRealTimeTrigger,
        questionType: realTimeQuestionType ?? null,
        tavilyPlan: llmTavilyPlan.shouldSearch ? {
          query: llmTavilyPlan.query,
          topic: llmTavilyPlan.topic,
          depth: llmTavilyPlan.depth,
          reason: llmTavilyPlan.reason,
        } : null,
        tavilySuccess: !tavilyFallbackUsed && hasMarketData,
        tavilyFallback: tavilyFallbackUsed,
      },
      polymarket: {
        fetched: polymarketContext.length > 0,
        marketsFound: polymarketContext.length > 0 ? 'yes' : 'no',
      },
      documents: {
        hasDocuments: hasUploadedDocuments,
        documentCount: filteredDocumentIds.length,
        chunksRetrieved: documentMatchesForTelemetry.length,
        rerankingUsed: documentMatchesForTelemetry.length > 3,
      },
      model: {
        selected: model,
        reason: hasRealTimeTrigger ? 'realtime_trigger' : 
                isDocumentSummaryRequest ? 'document_summary' :
                isSimplePersonalAdviceRequest ? 'simple_advice' : 'default',
      },
      entities: {
        tickers: detectedTickers,
        companies: interpretedEntities,
        language: interpretedLanguage ?? 'unknown',
      },
    };

    const telemetryData = {
      requestId,
      userId,
      sessionId,
      messageType: isStockAnalysisRequest ? 'stock_analysis' : isPersonalAdviceRequest ? 'personal_advice' : 'general',
      model,
      timestamp: new Date().toISOString(),
      hasMarketData,
      isPremium,
      decisionLog,
    };

    console.log('TELEMETRY START:', telemetryData);

    // Save decision log to database
    try {
      await supabase
        .from('ai_chat_decision_logs')
        .insert({
          request_id: requestId,
          user_id: userId,
          session_id: sessionId,
          decision_data: decisionLog,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to save decision log:', error);
      // Don't fail the request if logging fails
    }

    // Save user message to database first
    if (sessionId) {
      try {
        const userMessageContext: Record<string, unknown> = {
          analysisType,
          requestId,
          timestamp: new Date().toISOString()
        };

        if (filteredDocumentIds.length > 0) {
          userMessageContext.documentIds = filteredDocumentIds;
        }

        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: message,
            message_type: 'user',
            context_data: userMessageContext
          });
        console.log('User message saved to database');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // If the client requests non-streaming, return JSON instead of SSE
    if (stream === false) {
      // Handle tool calls with a loop (structured output doesn't support tools in the same call)
      let currentMessages = [...messages];
      let maxToolIterations = 3;
      let toolIteration = 0;
      let aiMessage = '';
      let stockSuggestions: StockSuggestion[] = [];
      
      while (toolIteration < maxToolIterations) {
        const requestBody: any = {
          model,
          messages: currentMessages,
          stream: false,
          tools: [STOCK_TOOL],
        };
        
        const nonStreamResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!nonStreamResp.ok) {
          const errorBody = await nonStreamResp.text();
          console.error('OpenAI API error response:', errorBody);
          console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
          throw new Error(`OpenAI API error: ${nonStreamResp.status} - ${errorBody}`);
        }

        const nonStreamData = await nonStreamResp.json();
        const assistantMessage = nonStreamData.choices?.[0]?.message;
        const toolCalls = assistantMessage?.tool_calls;
        
        // If there are tool calls, handle them
        if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
          // Add assistant message with tool calls to history
          currentMessages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: toolCalls
          });
          
          // Handle tool calls and get responses
          const toolResponses = await handleToolCalls(toolCalls, currentMessages);
          // Add tool responses to messages
          currentMessages.push(...toolResponses);
          toolIteration++;
          continue;
        }
        
        // No tool calls, we have a response but need structured output
        // Make final call with structured output
        const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: currentMessages,
            stream: false,
            response_format: { type: 'json_schema', json_schema: AI_RESPONSE_SCHEMA },
          }),
        });
        
        if (!finalResp.ok) {
          const errorBody = await finalResp.text();
          console.error('OpenAI API error response (final call):', errorBody);
          throw new Error(`OpenAI API error: ${finalResp.status} - ${errorBody}`);
        }
        
        const finalData = await finalResp.json();
        const rawContent = finalData.choices?.[0]?.message?.content || '';
        
        try {
          const parsedResponse = JSON.parse(rawContent) as AIResponse;
          aiMessage = parsedResponse.response || rawContent;
          stockSuggestions = parsedResponse.stock_suggestions || [];
        } catch (parseError) {
          // Fallback if JSON parsing fails
          console.warn('Failed to parse structured response, using raw content:', parseError);
          aiMessage = rawContent;
          stockSuggestions = [];
        }
        
        break;
      }
      
      // If we hit max iterations, make one final call with structured output
      if (toolIteration >= maxToolIterations) {
        const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: currentMessages,
            stream: false,
            response_format: { type: 'json_schema', json_schema: AI_RESPONSE_SCHEMA },
          }),
        });
        
        if (!finalResp.ok) {
          const errorBody = await finalResp.text();
          throw new Error(`OpenAI API error: ${finalResp.status} - ${errorBody}`);
        }
        
        const finalData = await finalResp.json();
        const rawContent = finalData.choices?.[0]?.message?.content || '';
        
        try {
          const parsedResponse = JSON.parse(rawContent) as AIResponse;
          aiMessage = parsedResponse.response || rawContent;
          stockSuggestions = parsedResponse.stock_suggestions || [];
        } catch (parseError) {
          console.warn('Failed to parse structured response, using raw content:', parseError);
          aiMessage = rawContent;
          stockSuggestions = [];
        }
      }

      // Update AI memory and optionally save to chat history
      await updateAIMemory(supabase, userId, message, aiMessage, aiMemory, userIntent);
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
          stock_suggestions: stockSuggestions,
          tavilyFallbackUsed: tavilyFallbackUsed,
          requiresConfirmation: profileChangeDetection.requiresConfirmation,
          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: streaming SSE response
    // For streaming, we don't use structured output to enable real-time text streaming
    // Instead, we add format instructions to the prompt and parse stock suggestions from text
    let streamingMessages = [
      ...messages.slice(0, -1), // All messages except the last user message
      {
        role: 'user' as const,
        content: `${messages[messages.length - 1].content}\n\nVIKTIGT: Om du föreslår aktier, formatera dem som: **Företagsnamn (TICKER)** - Kort motivering.`
      }
    ];

    // Handle tool calls before streaming (similar to non-streaming path)
    let maxToolIterations = 3;
    let toolIteration = 0;
    
    while (toolIteration < maxToolIterations) {
      const requestBody: any = {
        model,
        messages: streamingMessages,
        stream: false, // Don't stream while handling tools
        tools: [STOCK_TOOL],
      };

      const toolCheckResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!toolCheckResp.ok) {
        const errorBody = await toolCheckResp.text();
        console.error('OpenAI API error response:', errorBody);
        console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
        throw new Error(`OpenAI API error: ${toolCheckResp.status} - ${errorBody}`);
      }

      const toolCheckData = await toolCheckResp.json();
      const assistantMessage = toolCheckData.choices?.[0]?.message;
      const toolCalls = assistantMessage?.tool_calls;
      
      // If there are tool calls, handle them
      if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
        // Add assistant message with tool calls
        streamingMessages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: toolCalls
        });
        
        // Handle tool calls
        const toolResponses = await handleToolCalls(toolCalls, streamingMessages);
        streamingMessages.push(...toolResponses);
        toolIteration++;
        continue;
      }
      
      // No tool calls, break and proceed with streaming
      break;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, // Detta är din GPT-5.1 (eller vald modell)
        max_completion_tokens: 2000,
        messages: streamingMessages,
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
    let controllerClosed = false;
    
    const streamResp = new ReadableStream({
      async start(controller) {
        // Helper function to safely enqueue data
        const safeEnqueue = (data: Uint8Array) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(data);
            } catch (e) {
              controllerClosed = true;
            }
          }
        };

        // Helper function to safely close controller
        const safeClose = () => {
          if (!controllerClosed) {
            try {
              controller.close();
              controllerClosed = true;
            } catch (e) {
              controllerClosed = true;
            }
          }
        };

        // Helper function to safely error controller
        const safeError = (error: Error) => {
          if (!controllerClosed) {
            try {
              controller.error(error);
              controllerClosed = true;
            } catch (e) {
              controllerClosed = true;
            }
          }
        };

        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let aiMessage = '';
          let stockSuggestions: StockSuggestion[] = [];
          
          // NYTT: Buffer för att hantera splittrade nätverkspaket
          let buffer = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Hantera eventuell kvarvarande data i buffern om streamen stängs
              if (buffer.trim()) {
                 // Här kan man logga att streamen slutade med ofullständig data, 
                 // men oftast är det bara tomrum.
              }
              break;
            }

            // Lägg till ny data i buffern
            buffer += decoder.decode(value, { stream: true });
            
            // Splitta på rader
            const lines = buffer.split('\n');
            
            // Spara den sista raden i buffern (den kan vara ofullständig)
            // och ta bort den från lines-arrayen för att bearbetas i nästa loop
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim(); // Trimma bort extra whitespace
                
                if (data === '[DONE]') {
                  // --- SLUTHANTERING (Samma som förut) ---
                  
                  // Extract stock suggestions if any
                  if (aiMessage && !stockSuggestions.length) {
                    try {
                      const suggestionPattern = /\*\*([^*()]+?)\s*\(([A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?)\)\*\*(?:\s*[-–—:]\s*(.*?))?(?=\n|$)/gi;
                      const matches = Array.from(aiMessage.matchAll(suggestionPattern));
                      stockSuggestions = matches.map(match => ({
                        name: match[1].trim(),
                        ticker: match[2].toUpperCase(),
                        reason: match[3]?.trim() || 'AI-rekommendation',
                      })).slice(0, 10);
                    } catch (e) {
                      console.warn('Failed to extract stock suggestions:', e);
                    }
                  }
                  
                  // Update AI memory
                  await updateAIMemory(supabase, userId, message, aiMessage, aiMemory, userIntent);
                  
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
                  
                  // Send final message with stock suggestions
                  safeEnqueue(encoder.encode(`data: ${JSON.stringify({ 
                    done: true,
                    stock_suggestions: stockSuggestions,
                    tavilyFallbackUsed: tavilyFallbackUsed,
                    profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                    requiresConfirmation: profileChangeDetection.requiresConfirmation
                  })}\n\n`));
                  
                  safeClose();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  // Stream content directly
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    aiMessage += content;
                    
                    // Stream content immediately to client
                    safeEnqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content,
                      profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                      requiresConfirmation: profileChangeDetection.requiresConfirmation
                    })}\n\n`));
                  } 
                  // Perplexity kan ibland skicka citations i en separat delta eller i rooten
                  // Vi ignorerar dem för nu för att inte krascha streamen
                  else if (parsed.citations) {
                    // (Valfritt: Spara citations om du vill använda dem senare)
                  }
                } catch (e) {
                  // Ignore JSON parse errors for non-JSON lines (keep-alive messages etc)
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          console.error('TELEMETRY STREAM ERROR:', { ...telemetryData, error: error instanceof Error ? error.message : String(error) });
          safeError(error instanceof Error ? error : new Error(String(error)));
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
