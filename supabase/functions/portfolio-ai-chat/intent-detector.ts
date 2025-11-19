import { IntentDetectionResult, IntentType } from './intent-types.ts';

const INTENT_MODEL = Deno.env.get('OPENAI_INTENT_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

type ResponsesApiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const toResponsesInput = (messages: ResponsesApiMessage[]) =>
  messages.map((m) => ({
    role: m.role,
    content: [
      {
        type: 'input_text' as const,
        text: m.content,
      },
    ],
  }));

const extractResponsesApiText = (data: any): string => {
  const contentParts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) =>
        Array.isArray(item?.content) ? item.content : []
      )
    : [];

  for (const part of contentParts) {
    if ((part as any)?.parsed !== undefined) {
      const parsedPayload = (part as any).parsed;
      if (typeof parsedPayload === 'string') {
        const trimmed = parsedPayload.trim();
        if (trimmed) return trimmed;
      } else if (parsedPayload !== null && parsedPayload !== undefined) {
        try {
          const stringified = JSON.stringify(parsedPayload);
          if (stringified) return stringified;
        } catch {
          // ignore and fall back to text handling
        }
      }
    }

    if ((part as any)?.json !== undefined) {
      const jsonPayload = (part as any).json;
      if (typeof jsonPayload === 'string') {
        const trimmed = jsonPayload.trim();
        if (trimmed) return trimmed;
      } else if (jsonPayload !== null && jsonPayload !== undefined) {
        try {
          const stringified = JSON.stringify(jsonPayload);
          if (stringified) return stringified;
        } catch {
          // ignore and fall back to text handling
        }
      }
    }
  }

  const textPayload = contentParts
    .map((part: { text?: string }) => (typeof part?.text === 'string' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n')
    .trim();

  if (textPayload) {
    return textPayload;
  }

  if (Array.isArray(data?.output_text) && data.output_text.length > 0) {
    const text = data.output_text.join('\n').trim();
    if (text) return text;
  }

  const fallbackText = data?.choices?.[0]?.message?.content;
  if (typeof fallbackText === 'string' && fallbackText.trim()) {
    return fallbackText.trim();
  }

  return '';
};

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
    const messages: ResponsesApiMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...EXAMPLE_CLASSIFICATIONS.flatMap(example => [
        { role: 'user', content: example.user },
        { role: 'assistant', content: JSON.stringify(example.assistant) },
      ]),
      { role: 'user', content: message.trim() },
    ];

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: INTENT_MODEL,
          reasoning: {
            effort: 'none',
          },
          text: {
            format: {
              type: 'json_schema',
              name: INTENT_SCHEMA.name,
              schema: INTENT_SCHEMA.schema,
            },
            verbosity: 'low',
          },
          input: toResponsesInput(messages),
        }),
      });

    if (!response.ok) {
      console.warn('Intent interpreter request failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = extractResponsesApiText(data);

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
