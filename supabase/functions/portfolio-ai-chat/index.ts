
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch enhanced context data
    const { data: riskProfile } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    const { data: insights } = await supabase
      .from('portfolio_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recommendations } = await supabase
      .from('portfolio_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Build enhanced context for AI
    let contextInfo = `Du är en avancerad AI-assistent för portföljanalys (Fas 3) specialiserad på djupgående investeringsrådgivning. Du arbetar på svenska och ger detaljerade, personaliserade råd.

FÖRMÅGOR I FAS 3:
- Djupgående riskanalys med specifika rekommendationer
- Avancerad diversifieringsanalys
- Prestandajämförelser mot marknadsindex
- Portföljoptimering baserat på användarens mål
- Kontextuell förståelse av tidigare konversationer
- Identifiering av marknadsrisker och möjligheter`;

    if (riskProfile) {
      contextInfo += `\n\nANVÄNDAREINFORMATION:
- Ålder: ${riskProfile.age || 'Ej angivet'}
- Risktolerans: ${riskProfile.risk_tolerance || 'Ej angivet'} 
- Investeringshorisont: ${riskProfile.investment_horizon || 'Ej angivet'}
- Årsinkomst: ${riskProfile.annual_income ? riskProfile.annual_income.toLocaleString() + ' SEK' : 'Ej angivet'}
- Månatlig budget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}
- Investeringsmål: ${riskProfile.investment_goal || 'Ej angivet'}
- Erfarenhet: ${riskProfile.investment_experience || 'Ej angivet'}`;
    }

    if (portfolio) {
      const totalValue = portfolio.total_value || 0;
      const expectedReturn = portfolio.expected_return || 0;
      const riskScore = portfolio.risk_score || 0;
      
      contextInfo += `\n\nAKTUELL PORTFÖLJ:
- Totalt värde: ${totalValue.toLocaleString()} SEK
- Förväntad avkastning: ${expectedReturn}% årligen
- Riskpoäng: ${riskScore}/10
- Tillgångsfördelning: ${JSON.stringify(portfolio.asset_allocation)}`;
    }

    if (holdings && holdings.length > 0) {
      const totalHoldingsValue = holdings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
      contextInfo += `\n\nNUVARANDE INNEHAV (${holdings.length} positioner, totalt ${totalHoldingsValue.toLocaleString()} SEK):`;
      holdings.forEach(holding => {
        const value = holding.current_value || 0;
        const percentage = totalHoldingsValue > 0 ? ((value / totalHoldingsValue) * 100).toFixed(1) : '0';
        contextInfo += `\n- ${holding.name} (${holding.symbol || 'N/A'}): ${value.toLocaleString()} SEK (${percentage}%)`;
        if (holding.sector) contextInfo += ` - Sektor: ${holding.sector}`;
      });
    }

    if (insights && insights.length > 0) {
      contextInfo += `\n\nAKTUELLA AI-INSIKTER:`;
      insights.forEach(insight => {
        contextInfo += `\n- ${insight.title}: ${insight.description} (Allvarlighetsgrad: ${insight.severity})`;
      });
    }

    if (recommendations && recommendations.length > 0) {
      contextInfo += `\n\nAKTUELLA REKOMMENDATIONER:`;
      recommendations.forEach(rec => {
        contextInfo += `\n- ${rec.title}: ${rec.description}`;
      });
    }

    // Enhanced system prompt based on analysis type
    let systemPrompt = contextInfo;
    
    if (analysisType) {
      const analysisPrompts = {
        'risk': '\n\nFOKUS: Genomför en djupgående riskanalys. Identifiera specifika risker, geografisk exponering, sektorkoncentration, volatilitet och ge konkreta åtgärder.',
        'diversification': '\n\nFOKUS: Analysera diversifiering detaljerat. Utvärdera fördelning över tillgångsklasser, geografier, sektorer och företagsstorlekar.',
        'performance': '\n\nFOKUS: Analysera prestanda mot relevanta index, branschgenomsnitt och användarens mål. Identifiera över- och underpresterande innehav.',
        'optimization': '\n\nFOKUS: Föreslå konkreta optimeringar för att förbättra riskjusterad avkastning och nå användarens mål effektivare.',
        'quick_analysis': '\n\nFOKUS: Ge en snabb men informativ analys som svarar direkt på användarens fråga.'
      };
      
      systemPrompt += analysisPrompts[analysisType] || '';
    }

    systemPrompt += `\n\nSVARSRIKTLINJER:
- Använd konkreta siffror och procentsatser när möjligt
- Ge alltid specifika, actionable råd
- Förklara risker och möjligheter tydligt
- Anpassa råden till användarens riskprofil och mål
- Håll professionell men tillgänglig ton
- Begränsa svar till 300-500 ord för läsbarhet`;

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...chatHistory.slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Sending enhanced request to OpenAI with analysis type:', analysisType);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Calculate confidence score based on available data
    let confidence = 0.5; // Base confidence
    if (portfolio) confidence += 0.2;
    if (holdings && holdings.length > 0) confidence += 0.2;
    if (riskProfile) confidence += 0.1;
    confidence = Math.min(confidence, 1.0);

    // Store enhanced chat history in database
    const { error: chatError } = await supabase
      .from('portfolio_chat_history')
      .insert([
        {
          user_id: userId,
          portfolio_id: portfolioId,
          chat_session_id: sessionId,
          message_type: 'user',
          message: message,
          context_data: { 
            timestamp: new Date().toISOString(),
            analysisType: analysisType || 'general'
          }
        },
        {
          user_id: userId,
          portfolio_id: portfolioId,
          chat_session_id: sessionId,
          message_type: 'assistant',
          message: aiResponse,
          context_data: { 
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            analysisType: analysisType || 'general',
            confidence: confidence
          }
        }
      ]);

    if (chatError) {
      console.error('Error storing chat history:', chatError);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true,
        analysisType: analysisType || 'general',
        confidence: confidence,
        relatedData: {
          portfolioValue: portfolio?.total_value || 0,
          holdingsCount: holdings?.length || 0,
          insightsCount: insights?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
