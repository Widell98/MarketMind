// Response schema for structured output from the final LLM call

export const AI_RESPONSE_SCHEMA = {
  name: 'ai_chat_response',
  schema: {
    type: 'object',
    properties: {
      response: {
        type: 'string',
        description: 'Huvudsvarstexten till användaren på svenska. Inkludera all relevant information, analys och rådgivning.',
      },
      stock_suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Företagsnamnet (ex. "Volvo AB", "Evolution Gaming")',
            },
            ticker: {
              type: 'string',
              description: 'Börssymbolen i versaler (ex. "VOLV B", "EVO")',
              pattern: '^[A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?$',
            },
            reason: {
              type: 'string',
              description: 'Kort motivering till varför detta bolag föreslås (max 200 tecken)',
              maxLength: 200,
            },
          },
          required: ['name', 'ticker'],
          additionalProperties: false,
        },
        description: 'Array med aktieförslag om användaren ber om rekommendationer. Lämna tom om inga förslag behövs.',
        default: [],
      },
    },
    required: ['response'],
    additionalProperties: false,
  },
} as const;

export type StockSuggestion = {
  name: string;
  ticker: string;
  reason?: string;
};

export type AIResponse = {
  response: string;
  stock_suggestions?: StockSuggestion[];
};

