
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe } = requestBody;

    console.log('Portfolio AI Chat function called with:', { 
      message: message?.substring(0, 50) + '...', 
      userId, 
      portfolioId, 
      sessionId,
      analysisType 
    });

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

    // Check if this is a stock exchange request
    const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|amerikanska|svenska|europeiska|asiatiska|aktier|innehav)/i.test(message);

    // Build enhanced context for AI with emphasis on actionable portfolio changes
    let contextInfo = `Du är en professionell AI-assistent för investeringar. Ge ALLTID korta, välstrukturerade svar på svenska.

VIKTIGA RIKTLINJER:
- Håll svaren korta, max ca 250 ord
- Undvik markdown eller kodliknande formatering
- Använd vanliga rubriker och mellanrum för struktur
- Fokusera på de 2–3 viktigaste insikterna
- Inkludera siffror och procent där det stärker trovärdigheten
- Undvik långa tekniska termer eller förklaringar
- Skriv direkt, tydligt och lätt att agera på
- Svara aldrig med personlig investeringsrådgivning
- Tydliggör att svaret är för utbildning och information
- Påminn alltid om att beslut bör tas med licensierad rådgivare`;

    if (isExchangeRequest) {
      contextInfo += `\n\nPORTFÖLJÄNDRINGAR:
- Om användaren vill ändra innehav, ge 2-3 konkreta förslag
- Förklara varför varje förslag passar deras profil
- Inkludera tickers/symboler för aktier
- Förklara kort risker och möjligheter
- Ge procentuell vikt i portföljen
- Påminn om att detta är utbildning, inte råd`;
    }

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
      const allocation = portfolio.asset_allocation || {};
      
      contextInfo += `\n\nPORTFÖLJ:
- Värde: ${totalValue.toLocaleString()} SEK
- Förväntad avkastning: ${expectedReturn}%
- Aktier: ${allocation.stocks || 0}%
- Obligationer: ${allocation.bonds || 0}%
- Alternativ: ${allocation.alternatives || 0}%`;
    }

    if (holdings && holdings.length > 0) {
      const totalHoldingsValue = holdings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
      contextInfo += `\n\nNUVARANDE INNEHAV:`;
      holdings.forEach(holding => {
        const value = holding.current_value || 0;
        const percentage = totalHoldingsValue > 0 ? ((value / totalHoldingsValue) * 100).toFixed(1) : '0';
        const market = holding.market || 'Okänd marknad';
        contextInfo += `\n- ${holding.name} (${holding.symbol || 'N/A'}): ${percentage}%, ${market}, ${holding.sector || 'Okänd sektor'}`;
      });
    }

    // Enhanced system prompt for portfolio change discussions
    let systemPrompt = contextInfo;
    
    if (isExchangeRequest) {
      systemPrompt += `\n\nVID PORTFÖLJÄNDRINGSFÖRFRÅGNINGAR:
- Analysera nuvarande innehav först
- Föreslå 2-3 konkreta alternativ med tickers
- Förklara kort varför varje förslag passar
- Inkludera fördelning i procent
- Nämn market cap och sektor
- Påminn om risker och att detta är utbildning
- Format: "Förslag: [Aktie] ([Ticker]) - [Kort beskrivning]"`;
    }
    
systemPrompt += `

SVARSFORMAT:
- Max 200–250 ord
- Undvik markdown eller kodliknande formatering
- Använd tydliga rubriker med tom rad före/efter
- Strukturera med punktlistor eller korta stycken
- Ge konkret information med siffror och procent där det är relevant
- Fokusera på de 2–3 viktigaste insikterna
- Vid aktieförslag: ange aktiens namn, ticker och en kortfattad motivering
- Undvik spekulationer och överdrivet tekniskt språk
- Påminn tydligt om att detta är utbildning, inte personlig investeringsråd
`;

    if (analysisType === 'insight_generation') {
      systemPrompt += `\n\nGENERERA KORT INSIKT för ${insightType}:
- Identifiera 1-2 huvudpunkter
- Ge konkret information
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

    console.log('=== CALLING OPENAI API ===');
    console.log('Model: gpt-4o');
    console.log('Messages count:', messages.length);
    console.log('User message:', message);
    console.log('Is exchange request:', isExchangeRequest);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: isExchangeRequest ? 400 : 300,
        temperature: 0.6,
      }),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error details:', errorData);
      
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
    console.log('OpenAI response data keys:', Object.keys(data));
    console.log('OpenAI choices count:', data.choices?.length);
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI response length:', aiResponse?.length);
    console.log('AI response preview:', aiResponse?.substring(0, 100));

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
            analysisType: analysisType || 'general',
            isExchangeRequest: isExchangeRequest
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
            model: 'gpt-4.1-2025-04-14',
            analysisType: analysisType || 'general',
            confidence: confidence,
            isExchangeRequest: isExchangeRequest,
            suggestedChanges: isExchangeRequest
          }
        }
      ]);

    if (chatError) {
      console.error('Error storing chat history:', chatError);
    }

    console.log('=== FUNCTION COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true,
        analysisType: analysisType || 'general',
        confidence: confidence,
        isExchangeRequest: isExchangeRequest,
        relatedData: {
          portfolioValue: portfolio?.total_value || 0,
          holdingsCount: holdings?.length || 0,
          insightsCount: insights?.length || 0,
          model: 'GPT-4o',
          canSuggestChanges: isExchangeRequest
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
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
