
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
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe } = await req.json();

    console.log('Portfolio AI Chat function called with:', { 
      message: message?.substring(0, 50) + '...', 
      userId, 
      portfolioId, 
      sessionId,
      analysisType 
    });

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

    // Build enhanced context for AI with emphasis on concise, formatted responses
    let contextInfo = `Du är en professionell AI-rådgivare för investeringar. Ge ALLTID korta, välstrukturerade svar på svenska.

VIKTIGA RIKTLINJER:
- Håll svar under 200 ord
- Använd markdown-formatering med ### för rubriker
- Använd - för punktlistor 
- Fokusera på de 2-3 viktigaste punkterna
- Ge konkreta siffror och procenttal
- Undvik långa tekniska förklaringar
- Var direkt och actionable`;

    if (riskProfile) {
      contextInfo += `\n\nANVÄNDARE:
- Ålder: ${riskProfile.age || 'Ej angivet'}
- Risktolerans: ${riskProfile.risk_tolerance || 'Ej angivet'} 
- Tidshorisont: ${riskProfile.investment_horizon || 'Ej angivet'}
- Månatlig budget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}`;
    }

    if (portfolio) {
      const totalValue = portfolio.total_value || 0;
      const expectedReturn = portfolio.expected_return || 0;
      
      contextInfo += `\n\nPORTFÖLJ:
- Värde: ${totalValue.toLocaleString()} SEK
- Förväntad avkastning: ${expectedReturn}%
- Aktier: ${portfolio.asset_allocation?.stocks || 0}%`;
    }

    if (holdings && holdings.length > 0) {
      const totalHoldingsValue = holdings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
      contextInfo += `\n\nTOPP INNEHAV:`;
      holdings.slice(0, 3).forEach(holding => {
        const value = holding.current_value || 0;
        const percentage = totalHoldingsValue > 0 ? ((value / totalHoldingsValue) * 100).toFixed(0) : '0';
        contextInfo += `\n- ${holding.name}: ${percentage}%`;
      });
    }

    // Enhanced system prompt for concise, well-formatted responses
    let systemPrompt = contextInfo;
    
    systemPrompt += `\n\nSVARSFORMAT:
- Max 150-200 ord
- Använd ### för huvudrubriker
- Använd - för listor
- Ge konkreta råd med siffror
- Fokusera på det viktigaste
- Ingen överflödig text`;

    if (analysisType === 'insight_generation') {
      systemPrompt += `\n\nGENERERA KORT INSIKT för ${insightType}:
- Identifiera 1-2 huvudpunkter
- Ge konkret rekommendation
- Inkludera sannolikheter`;
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...chatHistory.slice(-4).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Sending request to OpenAI with gpt-4o-mini model');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Handle specific quota exceeded error
      if (response.status === 429) {
        const errorType = errorData.error?.type;
        
        if (errorType === 'insufficient_quota') {
          return new Response(
            JSON.stringify({ 
              error: 'quota_exceeded',
              message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.',
              success: false 
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else if (errorType === 'rate_limit_exceeded') {
          return new Response(
            JSON.stringify({ 
              error: 'rate_limit_exceeded',
              message: 'För många förfrågningar. Vänligen vänta en stund innan du försöker igen.',
              success: false 
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Received OpenAI response, length:', aiResponse?.length);

    // Calculate confidence score based on available data
    let confidence = 0.5; // Base confidence
    if (portfolio) confidence += 0.2;
    if (holdings && holdings.length > 0) confidence += 0.2;
    if (riskProfile) confidence += 0.1;
    confidence = Math.min(confidence, 1.0);

    // Generate structured insights for certain analysis types
    if (analysisType === 'insight_generation' && insightType) {
      const insightData = {
        user_id: userId,
        insight_type: insightType.includes('risk') ? 'risk_warning' : 
                     insightType.includes('opportunity') ? 'opportunity' :
                     insightType.includes('rebalancing') ? 'rebalancing' : 'news_impact',
        title: `AI-Genererad ${insightType}`,
        description: aiResponse.substring(0, 300) + (aiResponse.length > 300 ? '...' : ''),
        severity: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
        related_holdings: holdings?.map(h => h.symbol).slice(0, 5) || [],
        action_required: insightType.includes('risk') || insightType.includes('rebalancing'),
        is_read: false
      };

      const { error: insightError } = await supabase
        .from('portfolio_insights')
        .insert(insightData);

      if (insightError) {
        console.error('Error storing insight:', insightError);
      }
    }

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

    console.log('Portfolio AI Chat function completed successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true,
        analysisType: analysisType || 'general',
        confidence: confidence,
        relatedData: {
          portfolioValue: portfolio?.total_value || 0,
          holdingsCount: holdings?.length || 0,
          insightsCount: insights?.length || 0,
          model: 'GPT-4o-mini'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    
    // Check if it's a quota-related error
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return new Response(
        JSON.stringify({ 
          error: 'quota_exceeded',
          message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.',
          success: false 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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
