// supabase/functions/portfolio-ai-chat/conversation-planner.ts

import { IntentType } from './intent-types.ts';

export type ConversationPlan = {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  needsRealtimeData: boolean;
  searchQuery: string | null;
  searchTopic: 'news' | 'finance' | 'general' | null;
  searchDepth: 'basic' | 'advanced';
  searchDays: number;
  detectedEntities: string[]; // Tickers eller bolagsnamn
  language: 'sv' | 'en';
  requiresProfileContext: boolean; // Behöver vi användarens portfölj/riskprofil?
  reasoning: string; // Kort motivering för debug
};

const PLANNER_SCHEMA = {
  name: 'conversation_plan',
  schema: {
    type: 'object',
    properties: {
      primaryIntent: {
        type: 'string',
        enum: [
          'stock_analysis',
          'portfolio_optimization',
          'buy_sell_decisions',
          'market_analysis',
          'general_news',
          'news_update',
          'general_advice',
          'document_summary',
          'prediction_analysis',
        ],
        description: 'Det huvudsakliga syftet med användarens fråga.',
      },
      secondaryIntents: {
        type: 'array',
        items: { type: 'string' },
        description: 'Andra relevanta intents om frågan är komplex.',
      },
      needsRealtimeData: {
        type: 'boolean',
        description: 'Sätt till true om frågan kräver dagsaktuell information (kurser, nyheter, rapporter).',
      },
      searchQuery: {
        type: 'string',
        description: 'En optimerad söksträng för Tavily om realtidsdata behövs. Annars null.',
      },
      searchTopic: {
        type: 'string',
        enum: ['news', 'finance', 'general'],
        description: 'Vilken typ av källor som är mest relevanta.',
      },
      searchDepth: {
        type: 'string',
        enum: ['basic', 'advanced'],
        description: 'Använd advanced för djupgående analyser eller rapporter.',
      },
      searchDays: {
        type: 'integer',
        description: 'Hur många dagar bakåt sökningen ska sträcka sig (max 30).',
      },
      detectedEntities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista på identifierade tickers (t.ex. VOLV-B) eller bolagsnamn.',
      },
      language: {
        type: 'string',
        enum: ['sv', 'en'],
        description: 'Språket användaren skriver på.',
      },
      requiresProfileContext: {
        type: 'boolean',
        description: 'Krävs information om användarens innehav eller riskprofil för att svara bra?',
      },
      reasoning: {
        type: 'string',
        description: 'Kort tankegång kring varför denna plan valdes.',
      },
    },
    required: ['primaryIntent', 'needsRealtimeData', 'language', 'reasoning'],
    additionalProperties: false,
  },
} as const;

export const planConversationWithOpenAI = async (
  message: string,
  recentHistory: string[],
  hasPortfolio: boolean,
  hasUploadedDocuments: boolean,
  apiKey: string
): Promise<ConversationPlan> => {
  const systemPrompt = `
Du är hjärnan i en finansiell AI-rådgivare. Din uppgift är att analysera användarens inkommande fråga och skapa en EXEKVERINGSPLAN.

Regler:
1.  **Intent:** Avgör vad användaren *egentligen* vill. Om de nämner specifika aktier, välj 'stock_analysis'. Om de pratar om sin portfölj, välj 'portfolio_optimization' eller 'news_update'.
2.  **Realtidsdata:** Var generös med 'needsRealtimeData' om frågan rör marknadsläget, specifika aktier eller nyheter. Vi vill inte gissa.
3.  **Sökning:** Om realtidsdata behövs, konstruera en 'searchQuery' som är bättre än användarens fråga (t.ex. lägg till "latest earnings report" eller "stock analysis").
4.  **Dokument:** Om 'hasUploadedDocuments' är sant och frågan rör dokumenten, välj 'document_summary'.
5.  **Kontext:** Om användaren frågar "borde jag sälja X?" eller "hur går min portfölj?", sätt 'requiresProfileContext' till true.

Användare har portföljdata: ${hasPortfolio ? 'Ja' : 'Nej'}
Uppladdade dokument finns: ${hasUploadedDocuments ? 'Ja' : 'Nej'}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Snabb och billig, men smart nog för planering
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Historik:\n${recentHistory.join('\n')}\n\nNuvarande fråga: "${message}"` },
        ],
        response_format: { type: 'json_schema', json_schema: PLANNER_SCHEMA },
      }),
    });

    if (!response.ok) {
      throw new Error(`Planner API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (!content) throw new Error('No content in planner response');

    const plan = JSON.parse(content) as ConversationPlan;
    
    // Fallback/Säkerhetställning
    if (!plan.secondaryIntents) plan.secondaryIntents = [];
    if (!plan.detectedEntities) plan.detectedEntities = [];
    
    return plan;

  } catch (error) {
    console.error('Master Planner failed, falling back to defaults:', error);
    // Returnera en säker default-plan om något kraschar
    return {
      primaryIntent: 'general_advice',
      secondaryIntents: [],
      needsRealtimeData: false,
      searchQuery: null,
      searchTopic: 'general',
      searchDepth: 'basic',
      searchDays: 7,
      detectedEntities: [],
      language: 'sv',
      requiresProfileContext: true,
      reasoning: 'Fallback due to error',
    };
  }
};
