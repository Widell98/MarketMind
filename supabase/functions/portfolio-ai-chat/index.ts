
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, portfolioId, sessionId, contextType } = await req.json();

    if (!message || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's risk profile and portfolio data
    const [riskProfileResult, portfolioResult] = await Promise.all([
      supabaseClient
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      portfolioId ? supabaseClient
        .from('user_portfolios')
        .select(`
          *,
          portfolio_holdings (
            id,
            stock_symbol,
            stock_name,
            quantity,
            purchase_price,
            current_price,
            market_value,
            percentage_of_portfolio
          )
        `)
        .eq('id', portfolioId)
        .single() : Promise.resolve({ data: null, error: null })
    ]);

    if (riskProfileResult.error) {
      console.error('Error fetching risk profile:', riskProfileResult.error);
    }

    if (portfolioResult.error && portfolioId) {
      console.error('Error fetching portfolio:', portfolioResult.error);
    }

    const riskProfile = riskProfileResult.data;
    const portfolio = portfolioResult.data;

    // Detect if the user is asking for stock recommendations
    const isRequestingRecommendations = detectRecommendationIntent(message);
    
    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(riskProfile, portfolio, isRequestingRecommendations);

    // Get recent conversation history for context
    const historyResult = await supabaseClient
      .from('portfolio_chat_history')
      .select('message, message_type, created_at')
      .eq('user_id', userId)
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(6);

    const conversationHistory: ChatMessage[] = [];
    if (historyResult.data) {
      // Reverse to get chronological order and convert to chat format
      const recentHistory = historyResult.data.reverse();
      for (const hist of recentHistory) {
        conversationHistory.push({
          role: hist.message_type === 'user' ? 'user' : 'assistant',
          content: hist.message
        });
      }
    }

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Save both user message and AI response to chat history
    const timestamp = new Date().toISOString();
    
    const chatHistoryInserts = [
      {
        user_id: userId,
        chat_session_id: sessionId,
        message: message,
        message_type: 'user',
        portfolio_id: portfolioId,
        context_data: {
          contextType: contextType || 'advisory',
          timestamp: timestamp,
          isRecommendationRequest: isRequestingRecommendations
        }
      },
      {
        user_id: userId,
        chat_session_id: sessionId,
        message: aiResponse,
        message_type: 'assistant',
        portfolio_id: portfolioId,
        ai_confidence_score: aiData.choices[0]?.finish_reason === 'stop' ? 0.9 : 0.7,
        context_data: {
          contextType: contextType || 'advisory',
          timestamp: timestamp,
          model: 'gpt-4o-mini',
          recommendationsProvided: isRequestingRecommendations
        }
      }
    ];

    const { error: historyError } = await supabaseClient
      .from('portfolio_chat_history')
      .insert(chatHistoryInserts);

    if (historyError) {
      console.error('Error saving chat history:', historyError);
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      context: {
        analysisType: contextType || 'advisory',
        confidence: aiData.choices[0]?.finish_reason === 'stop' ? 0.9 : 0.7,
        isExchangeRequest: false,
        recommendationsProvided: isRequestingRecommendations
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI chat request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectRecommendationIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate user wants stock recommendations
  const recommendationKeywords = [
    'rekommendera', 'rekommendation', 'föreslå', 'förslag',
    'vad ska jag köpa', 'vilka aktier', 'vilket bolag',
    'bra investering', 'köpa aktier', 'investera i',
    'tips på aktier', 'aktietips', 'bästa aktier',
    'borde jag köpa', 'ska jag satsa på', 'vart investera',
    'vilken aktie', 'vilket företag', 'bra köp',
    'undervärderad', 'tillväxtaktier', 'dividendaktier',
    'teknologiaktier', 'hållbara aktier', 'gröna aktier'
  ];

  // Question patterns that indicate recommendation requests
  const recommendationPatterns = [
    /vad.*köp/,
    /vilka.*aktier.*bra/,
    /föreslå.*aktier/,
    /rekommendera.*aktier/,
    /bra.*investering/,
    /ska.*investera.*i/
  ];

  // Check for direct keyword matches
  const hasRecommendationKeyword = recommendationKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  // Check for pattern matches
  const hasRecommendationPattern = recommendationPatterns.some(pattern =>
    pattern.test(lowerMessage)
  );

  return hasRecommendationKeyword || hasRecommendationPattern;
}

function buildSystemPrompt(riskProfile: any, portfolio: any, shouldRecommendStocks: boolean): string {
  let basePrompt = `Du är en erfaren investeringsrådgivare som hjälper svenska investerare. Du svarar alltid på svenska och ger personliga råd baserat på användarens riskprofil och portfölj.

VIKTIGT: ${shouldRecommendStocks ? 
  'Användaren efterfrågar specifikt aktie- eller investeringsrekommendationer. Ge konkreta förslag på aktier eller tillgångar som passar deras profil.' : 
  'Användaren ställer en allmän fråga och efterfrågar INTE specifika aktie-rekommendationer. Fokusera på att svara på deras fråga utan att ge onödiga aktieförslag. Ge bara allmän vägledning och utbildande information.'
}`;

  if (riskProfile) {
    basePrompt += `\n\nAnvändarens riskprofil:
- Risktolerans: ${riskProfile.risk_tolerance || 'okänd'}
- Investeringshorisont: ${riskProfile.investment_horizon || 'okänd'}
- Investeringskunskap: ${riskProfile.investment_experience || 'okänd'}
- Ekonomisk situation: ${riskProfile.financial_situation || 'okänd'}`;

    if (riskProfile.investment_goals) {
      basePrompt += `\n- Investeringsmål: ${riskProfile.investment_goals}`;
    }
  }

  if (portfolio && portfolio.portfolio_holdings && portfolio.portfolio_holdings.length > 0) {
    basePrompt += `\n\nNuvarande portfölj:`;
    portfolio.portfolio_holdings.forEach((holding: any) => {
      basePrompt += `\n- ${holding.stock_name} (${holding.stock_symbol}): ${holding.quantity} aktier, ${holding.percentage_of_portfolio?.toFixed(1) || 'N/A'}% av portföljen`;
    });
  }

  basePrompt += `\n\nRiktlinjer:
- Svara alltid på svenska
- Var personlig och anpassa råden till användarens profil
- ${shouldRecommendStocks ? 
    'Ge konkreta aktie-rekommendationer med motivering när användaren frågar efter det. Inkludera alltid sektor för varje rekommenderad aktie i formatet: Företag (SYMBOL) - Sektor: [sektornamn]' : 
    'Fokusera på att svara på användarens fråga utan att ge onödiga aktieförslag'
  }
- Förklara risker och möjligheter tydligt
- Ge alltid utbildande information
- Vara uppmuntrande men realistisk
- Aldrig garantera framtida avkastning`;

  return basePrompt;
}
