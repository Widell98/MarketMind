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

    const riskProfile = riskProfileResult.data;
    const portfolio = portfolioResult.data;

    const isRequestingRecommendations = detectRecommendationIntent(message);

    const systemPrompt = buildSystemPrompt(riskProfile, portfolio, isRequestingRecommendations, contextType);

    const historyResult = await supabaseClient
      .from('portfolio_chat_history')
      .select('message, message_type, created_at')
      .eq('user_id', userId)
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(6);

    const conversationHistory: ChatMessage[] = [];
    if (historyResult.data) {
      const recentHistory = historyResult.data.reverse();
      for (const hist of recentHistory) {
        conversationHistory.push({
          role: hist.message_type === 'user' ? 'user' : 'assistant',
          content: hist.message
        });
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

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

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content;

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
          model: 'gpt-4o',
          recommendationsProvided: isRequestingRecommendations
        }
      }
    ];

    await supabaseClient.from('portfolio_chat_history').insert(chatHistoryInserts);

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
  const keywords = ['rekommendera', 'föreslå', 'aktietips', 'investera i', 'köpa aktier'];
  return keywords.some(kw => lowerMessage.includes(kw));
}

function buildSystemPrompt(riskProfile: any, portfolio: any, shouldRecommend: boolean, contextType: string): string {
  if (contextType === 'initial_strategy') {
    return `Du är FinLyze, en AI-driven finansiell strateg som kommunicerar på svenska. Ditt jobb är att ta användarens investeringsinformation och returnera en personlig investeringsstrategi och portföljplan.

Användarens information:
- Investeringsmål: ${riskProfile?.investment_goals || 'Ej angivet'}
- Risktolerans: ${riskProfile?.risk_tolerance || 'Ej angivet'}
- Investeringshorisont: ${riskProfile?.investment_horizon || 'Ej angivet'}
- Nuvarande portfölj: ${portfolio?.portfolio_holdings?.map(h => `${h.stock_name} (${h.stock_symbol})`).join(', ') || 'Ingen'}

Instruktioner:
1. Sammanfatta kort användarens profil
2. Rekommendera en strategi (t.ex. Tillväxt, Värde, Utdelning, Balanserad, Index, Sektor, Defensiv, Aggressiv)
3. Föreslå en tillgångsallokering (aktier, obligationer, fonder, kassa etc.)
4. Nämn 3–5 lämpliga aktietyper eller sektorer (inte tickers)
5. Avsluta med att tydligt påminna att detta är modellbaserad vägledning, inte licensierad rådgivning.`;
  }

  return `Du är FinCoach, en GPT-4o-baserad AI-rådgivare. Du kommunicerar alltid på svenska. Användaren har skapat en initial portfölj. Din uppgift är att förbättra och optimera den i pågående dialog.

Beteende:
- Ställ frågor innan du ger råd
- Analysera diversifiering och risk
- Anpassa råd till användarens profil
- Beskriv för- och nackdelar med olika val

Portfölj:
${portfolio?.portfolio_holdings?.map(h => `- ${h.stock_name} (${h.stock_symbol}): ${h.quantity} st`).join('\n') || 'Ingen'}

Profil:
- Mål: ${riskProfile?.investment_goals || 'Ej angivet'}
- Risk: ${riskProfile?.risk_tolerance || 'Ej angivet'}
- Horisont: ${riskProfile?.investment_horizon || 'Ej angivet'}

Exempel på vad du kan hjälpa till med:
- Optimera tillgångsallokering
- Föreslå sektorförändringar
- Simulera konservativa vs. aggressiva strategier
- Analysera obalanser i portföljen

VIKTIGT: Detta är modellbaserad vägledning. Du får aldrig ge personlig finansiell rådgivning.`;
}
