// Unified Router: Combines intent detection, realtime decision, and Tavily planning into a single LLM call

import { IntentType, IntentDetectionResult } from './intent-types.ts';
import type { TavilyLLMPlan, TavilyTopic, TavilySearchDepth, TavilyLocalePreference } from './tavily-service.ts';

// ============================================================================
// Unified Router Types
// ============================================================================

export type UnifiedRouterInput = {
  message: string;
  recentMessages?: string[];
  hasPortfolio?: boolean;
  hasUploadedDocuments?: boolean;
  detectedTickers?: string[];
  entityAwareQuery?: string | null;
  openAIApiKey: string;
  model?: string;
};

export type UnifiedRouterResult = {
  intent: IntentType;
  intents: IntentType[];
  entities: string[];
  language: string | null;
  needsRealtime: boolean;
  realtimeReason?: string;
  questionType?: string;
  recommendationPreference?: 'yes' | 'no';
  tavilySearch: {
    shouldSearch: boolean;
    query?: string;
    topic?: TavilyTopic;
    depth?: TavilySearchDepth;
    freshnessDays?: number;
    preferredLocales?: TavilyLocalePreference[];
    reason?: string;
  };
  source: 'unified' | 'fallback';
};

// ============================================================================
// Unified Router Schema
// ============================================================================

const ALLOWED_INTENTS: IntentType[] = [
  'stock_analysis',
  'portfolio_optimization',
  'buy_sell_decisions',
  'market_analysis',
  'general_news',
  'news_update',
  'general_advice',
  'document_summary',
  'prediction_analysis',
];

const UNIFIED_ROUTER_SCHEMA = {
  name: 'unified_router_result',
  schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'array',
        items: {
          type: 'string',
          enum: ALLOWED_INTENTS,
        },
        minItems: 1,
        description: 'Lista av intents som matchar användarens fråga. Första intenten är primär.',
      },
      entities: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1,
        },
        default: [],
        description: 'Viktiga entiteter som bolag, tickers, index, sektorer eller makroteman.',
      },
      language: {
        type: 'string',
        enum: ['sv', 'en'],
        default: 'sv',
        description: 'Språket som användaren använder.',
      },
      needsRealtime: {
        type: 'boolean',
        description: 'Om realtidsdata (nyheter, kurser, rapporter) behövs för att besvara frågan pålitligt.',
      },
      realtimeReason: {
        type: 'string',
        maxLength: 200,
        description: 'Kort svensk motivering till varför realtidsdata behövs eller inte.',
      },
      questionType: {
        type: 'string',
        enum: ['latest_news', 'recent_report', 'intraday_price', 'macro_event', 'portfolio_update', 'prediction_market', 'strategy_or_education', 'other'],
        description: 'Typ av fråga som ställs.',
      },
      recommendationPreference: {
        type: 'string',
        enum: ['yes', 'no'],
        description: 'Om användaren uttryckligen ber om investeringsrekommendationer eller köp/sälj-råd.',
      },
      tavilySearch: {
        type: 'object',
        properties: {
          shouldSearch: {
            type: 'boolean',
            description: 'Om en Tavily-sökning ska göras för dagsaktuell finans- eller marknadskontext.',
          },
          query: {
            type: 'string',
            maxLength: 200,
            description: 'Kortfattad sökfras som hjälper Tavily att hitta relevanta nyheter eller rapporter.',
          },
          topic: {
            type: 'string',
            enum: ['general', 'news', 'finance'],
            description: 'Välj "news" för rubriker, "finance" för bolagsspecifika uppdateringar eller "general" vid osäkerhet.',
          },
          depth: {
            type: 'string',
            enum: ['basic', 'advanced'],
            description: 'Ange "advanced" när du behöver längre utdrag eller råinnehåll.',
          },
          freshnessDays: {
            type: 'integer',
            minimum: 1,
            maximum: 30,
            description: 'Maximalt antal dagar bakåt som källorna får vara.',
          },
          preferredLocales: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['se', 'global'],
            },
            description: 'Prioriterade geografiska marknader, t.ex. Sverige (se) eller globalt.',
          },
          reason: {
            type: 'string',
            maxLength: 200,
            description: 'Kort svensk motivering till varför Tavily-sökning behövs.',
          },
        },
        required: ['shouldSearch'],
        additionalProperties: false,
      },
    },
    required: ['intent', 'entities', 'language', 'needsRealtime', 'tavilySearch'],
    additionalProperties: false,
  },
} as const;

// ============================================================================
// Unified Router Implementation
// ============================================================================

export const unifiedRouter = async ({
  message,
  recentMessages = [],
  hasPortfolio = false,
  hasUploadedDocuments = false,
  detectedTickers = [],
  entityAwareQuery,
  openAIApiKey,
  model = 'gpt-4o',
}: UnifiedRouterInput): Promise<UnifiedRouterResult> => {
  if (!openAIApiKey || !message || !message.trim()) {
    return {
      intent: 'general_advice',
      intents: ['general_advice'],
      entities: [],
      language: null,
      needsRealtime: false,
      tavilySearch: { shouldSearch: false },
      source: 'fallback',
    };
  }

  try {
    const contextLines: string[] = [];

    if (hasPortfolio) {
      contextLines.push('Användaren har en portfölj registrerad.');
    }

    if (hasUploadedDocuments) {
      contextLines.push('Användaren har laddat upp dokument som kan sammanfattas.');
    }

    if (detectedTickers.length > 0) {
      contextLines.push(`Identifierade tickers: ${detectedTickers.join(', ')}.`);
    }

    if (entityAwareQuery && entityAwareQuery.trim().length > 0) {
      contextLines.push(`Föreslagen sökfras: ${entityAwareQuery.trim()}.`);
    }

    if (recentMessages.length > 0) {
      contextLines.push('Tidigare relaterade frågor:\n' + recentMessages.map((entry, index) => `${index + 1}. ${entry}`).join('\n'));
    }

    const systemPrompt = [
      'Du är en svensk finansiell assistent som analyserar användares frågor och planerar svar.',
      '',
      'Dina uppgifter:',
      '1. Identifiera användarens avsikt (intent) från följande alternativ:',
      `   - ${ALLOWED_INTENTS.join(', ')}.`,
      '   - Välj en eller flera intents som bäst matchar frågan.',
      '   - Om användaren frågar om ett specifikt köp, prisnivå eller aktiecase (t.ex. "var det bra att köpa på 20kr?"), välj stock_analysis. Välj INTE portfolio_optimization för detta.',
      '   - Välj portfolio_optimization ENDAST när användaren uttryckligen ber om råd kring portföljens sammansättning, viktning eller riskspridning.',
      '   - Om användaren ber om sammanfattning av bifogat material, välj document_summary.',
      '',
      '2. Identifiera viktiga entiteter: bolag, tickers, index, sektorer eller makroteman.',
      '',
      '3. Avgör om realtidsdata behövs:',
      '   - Realtidsdata behövs för: senaste nyheter, intradagspriser, färska rapporter, marknadshändelser.',
      '   - Realtidsdata behövs INTE för: historik, strategier, allmänna förklaringar, långsiktiga analyser.',
      '',
      '4. Planera Tavily-sökning (om realtidsdata behövs):',
      '   - Ange en kortfattad sökfras.',
      '   - Välj topic: "news" för rubriker, "finance" för bolagsspecifika uppdateringar.',
      '   - Välj depth: "advanced" för längre utdrag, "basic" för snabba svar.',
      '   - Ange freshnessDays: maximalt antal dagar bakåt (1-30).',
      '',
      '5. Ange språk: "sv" om användaren skriver på svenska, annars "en".',
      '',
      'Var konservativ med realtidsdata - använd bara när det verkligen behövs.',
      'Returnera alltid ett giltigt JSON-objekt.',
    ].join('\n');

    const userPrompt = [
      contextLines.length > 0 ? contextLines.join('\n\n') : '',
      `Användarens fråga:\n"""${message.trim()}"""`,
    ].filter(Boolean).join('\n\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 300,
        response_format: { type: 'json_schema', json_schema: UNIFIED_ROUTER_SCHEMA },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Unified router request failed', response.status, await response.text());
      return {
        intent: 'general_advice',
        intents: ['general_advice'],
        entities: [],
        language: null,
        needsRealtime: false,
        tavilySearch: { shouldSearch: false },
        source: 'fallback',
      };
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      return {
        intent: 'general_advice',
        intents: ['general_advice'],
        entities: [],
        language: null,
        needsRealtime: false,
        tavilySearch: { shouldSearch: false },
        source: 'fallback',
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse unified router response:', error);
      return {
        intent: 'general_advice',
        intents: ['general_advice'],
        entities: [],
        language: null,
        needsRealtime: false,
        tavilySearch: { shouldSearch: false },
        source: 'fallback',
      };
    }

    const parsedData = parsed as any;

    // Normalize intents
    const intentsRaw = Array.isArray(parsedData?.intent) ? parsedData.intent : [];
    const normalizedIntents = intentsRaw
      .map((intent: unknown) => {
        if (typeof intent === 'string' && (ALLOWED_INTENTS as string[]).includes(intent)) {
          return intent as IntentType;
        }
        return null;
      })
      .filter((intent): intent is IntentType => Boolean(intent));

    const primaryIntent = normalizedIntents[0] || 'general_advice';
    if (normalizedIntents.length === 0) {
      normalizedIntents.push(primaryIntent);
    }

    // Normalize entities
    const entitiesRaw = Array.isArray(parsedData?.entities) ? parsedData.entities : [];
    const entities: string[] = Array.from(
      new Set(
        entitiesRaw
          .map((entity: unknown) => {
            if (typeof entity === 'string') {
              const trimmed = entity.trim();
              return trimmed.length > 0 && trimmed.length <= 100 ? trimmed : null;
            }
            return null;
          })
          .filter((entity): entity is string => Boolean(entity))
          .slice(0, 6),
      ),
    );

    // Normalize language
    const languageRaw = typeof parsedData?.language === 'string' ? parsedData.language.toLowerCase() : null;
    const language = languageRaw === 'sv' || languageRaw === 'en' ? languageRaw : null;

    // Normalize realtime decision
    const needsRealtime = typeof parsedData?.needsRealtime === 'boolean' ? parsedData.needsRealtime : false;
    const realtimeReason = typeof parsedData?.realtimeReason === 'string' ? parsedData.realtimeReason.trim() : undefined;
    const questionType = typeof parsedData?.questionType === 'string' ? parsedData.questionType.trim() : undefined;
    const recommendationPreference = typeof parsedData?.recommendationPreference === 'string' &&
      (parsedData.recommendationPreference === 'yes' || parsedData.recommendationPreference === 'no')
      ? parsedData.recommendationPreference
      : undefined;

    // Normalize Tavily search plan
    const tavilyRaw = parsedData?.tavilySearch;
    const tavilySearch: UnifiedRouterResult['tavilySearch'] = {
      shouldSearch: typeof tavilyRaw?.shouldSearch === 'boolean' ? tavilyRaw.shouldSearch : false,
      query: typeof tavilyRaw?.query === 'string' && tavilyRaw.query.trim().length > 0
        ? tavilyRaw.query.trim().slice(0, 200)
        : undefined,
      topic: typeof tavilyRaw?.topic === 'string' && ['general', 'news', 'finance'].includes(tavilyRaw.topic)
        ? tavilyRaw.topic as TavilyTopic
        : undefined,
      depth: typeof tavilyRaw?.depth === 'string' && (tavilyRaw.depth === 'basic' || tavilyRaw.depth === 'advanced')
        ? tavilyRaw.depth as TavilySearchDepth
        : undefined,
      freshnessDays: typeof tavilyRaw?.freshnessDays === 'number' && Number.isFinite(tavilyRaw.freshnessDays)
        ? Math.min(30, Math.max(1, Math.round(tavilyRaw.freshnessDays)))
        : undefined,
      preferredLocales: Array.isArray(tavilyRaw?.preferredLocales)
        ? tavilyRaw.preferredLocales
          .map((locale: unknown) => (locale === 'se' || locale === 'global' ? locale : null))
          .filter((locale): locale is TavilyLocalePreference => Boolean(locale))
        : undefined,
      reason: typeof tavilyRaw?.reason === 'string' ? tavilyRaw.reason.trim().slice(0, 200) : undefined,
    };

    // Ensure Tavily search is only true if needsRealtime is true
    if (!needsRealtime) {
      tavilySearch.shouldSearch = false;
    }

    return {
      intent: primaryIntent,
      intents: normalizedIntents,
      entities,
      language,
      needsRealtime,
      realtimeReason,
      questionType,
      recommendationPreference,
      tavilySearch,
      source: 'unified',
    };
  } catch (error) {
    console.error('Unified router error:', error);
    return {
      intent: 'general_advice',
      intents: ['general_advice'],
      entities: [],
      language: null,
      needsRealtime: false,
      tavilySearch: { shouldSearch: false },
      source: 'fallback',
    };
  }
};

