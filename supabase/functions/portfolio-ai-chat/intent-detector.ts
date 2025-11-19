import { OPENAI_RESPONSES_URL, extractResponseText } from '../../lib/openai.ts';
import { IntentDetectionResult, IntentType } from './intent-types.ts';

const INTENT_MODEL = Deno.env.get('OPENAI_INTENT_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

const ALLOWED_INTENTS: IntentType[] = [
  'stock_analysis',
  'portfolio_optimization',
  'buy_sell_decisions',
  'market_analysis',
  'general_news',
  'news_update',
  'general_advice',
  'document_summary',
];

const SYSTEM_PROMPT = [
  'Du är en svensk finansiell assistent som tolkar användares frågor.',
  '',
  'Instruktioner:',
  `- Identifiera vilka av följande intents som passar: ${ALLOWED_INTENTS.join(', ')}.`,
  '- Välj en eller flera intents som bäst matchar frågan.',
  '- Om användaren ber om en sammanfattning av bifogat material eller hänvisar till uppladdade dokument, välj intenten document_summary.',
  '- Identifiera viktiga entiteter som bolag, tickers, index, sektorer eller makroteman.',
  '- Ange språket som "sv" om användaren skriver på svenska, annars "en".',
  '- Returnera alltid ett giltigt JSON-objekt med fälten intent (lista), entities (lista), language (sträng).',
  '- Om inget passar, välj endast general_advice.',
  '- Svara ENDAST med JSON, inga förklaringar.'
].join('\n');

const EXAMPLE_CLASSIFICATIONS = [
  {
    user: 'Måste jag sälja Tesla nu?',
    assistant: {
      intent: ['stock_analysis', 'buy_sell_decisions'],
      entities: ['Tesla', 'TSLA'],
      language: 'sv',
    },
  },
  {
    user: 'Har det hänt något med OMXS30 idag?',
    assistant: {
      intent: ['news_update', 'market_analysis'],
      entities: ['OMXS30'],
      language: 'sv',
    },
  },
  {
    user: 'Can you help me rebalance my portfolio towards green energy?',
    assistant: {
      intent: ['portfolio_optimization'],
      entities: ['Green energy'],
      language: 'en',
    },
  },
  {
    user: 'Kan du sammanfatta det bifogade dokumentet?',
    assistant: {
      intent: ['document_summary'],
      entities: [],
      language: 'sv',
    },
  },
];

const INTENT_SCHEMA = {
  name: 'intent_detection_result',
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
      },
      entities: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1,
        },
        default: [],
      },
      language: {
        type: 'string',
        enum: ['sv', 'en'],
        default: 'sv',
      },
    },
    required: ['intent', 'entities', 'language'],
    additionalProperties: false,
  },
} as const;

const sanitizeEntity = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= 8 ? trimmed.replace(/\s+/g, ' ') : trimmed;
};

const normalizeIntent = (value: unknown): IntentType | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim() as IntentType;
  return (ALLOWED_INTENTS as string[]).includes(normalized) ? normalized : null;
};

export const detectUserIntentWithOpenAI = async (
  message: string,
  apiKey: string,
): Promise<IntentDetectionResult | null> => {
  if (!apiKey || !message || !message.trim()) {
    return null;
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...EXAMPLE_CLASSIFICATIONS.flatMap(example => [
        { role: 'user', content: example.user },
        { role: 'assistant', content: JSON.stringify(example.assistant) },
      ]),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: INTENT_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_schema', json_schema: INTENT_SCHEMA },
        input: messages,
      }),
    });

    if (!response.ok) {
      console.warn('Intent interpreter request failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = extractResponseText(data);

    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse intent interpreter response:', error);
      return null;
    }

    const intentsRaw = Array.isArray((parsed as any)?.intent) ? (parsed as any).intent : [];
    const entitiesRaw = Array.isArray((parsed as any)?.entities) ? (parsed as any).entities : [];
    const languageRaw = typeof (parsed as any)?.language === 'string' ? (parsed as any).language : null;

    const intents = intentsRaw
      .map(normalizeIntent)
      .filter((intent): intent is IntentType => Boolean(intent));

    const entities = Array.from(
      new Set(
        entitiesRaw
          .map(sanitizeEntity)
          .filter((entity): entity is string => Boolean(entity))
          .slice(0, 6),
      ),
    );

    if (intents.length === 0) {
      intents.push('general_advice');
    }

    return {
      intents,
      entities,
      language: languageRaw ? languageRaw.toLowerCase() : null,
      raw: rawContent,
    };
  } catch (error) {
    console.error('Intent interpreter error:', error);
    return null;
  }
};
