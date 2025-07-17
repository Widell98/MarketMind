
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
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe, conversationData } = requestBody;

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

    // Filter out existing holdings from recommendations
    const existingSymbols = new Set();
    const existingCompanies = new Set();
    
    if (holdings && holdings.length > 0) {
      holdings.forEach(holding => {
        if (holding.symbol && holding.holding_type !== 'recommendation') {
          existingSymbols.add(holding.symbol.toUpperCase());
        }
        if (holding.name && holding.holding_type !== 'recommendation') {
          existingCompanies.add(holding.name.toLowerCase());
        }
      });
    }

    // Build enhanced context for AI with emphasis on actionable portfolio changes
    let contextInfo = `Du är en professionell AI-rådgivare för investeringar som ger personliga rekommendationer på svenska.

VIKTIGA RIKTLINJER FÖR REKOMMENDATIONER:
- Ge ALLTID specifika aktie- och fondrekommendationer med namn och symboler
- Anpassa rekommendationerna till användarens riskprofil, ålder och intressen
- Föreslå 5-8 konkreta investeringar med tydliga motiveringar
- Inkludera svenska aktier, nordiska fonder och relevanta ETF:er
- Använd EXAKT detta format för alla rekommendationer:

**Företagsnamn (SYMBOL)**: Detaljerad beskrivning av varför denna investering passar användarens profil, inklusive sektor, risk och potential.

EXEMPEL PÅ KORREKT FORMAT:
**Investor AB (INVE-B)**: Svenskt investmentbolag med bred exponering mot teknologi och industri. Passar dig som erfaren investerare med måttlig risk.
**Avanza Global**: Indexfond för global diversifiering med låga avgifter, perfekt för långsiktig förmögenhetsbyggnad.

- Variera mellan olika sektorer och marknader
- Ta hänsyn till användarens ekonomiska situation och mål
- Förklara risker och förväntad avkastning
- Ge konkreta procentsatser för allokering`;

    if (isExchangeRequest) {
      contextInfo += `\n\nPORTFÖLJÄNDRINGAR:
- Om användaren vill ändra innehav, ge 2-3 konkreta förslag
- Förklara varför varje förslag passar deras profil
- Inkludera tickers/symboler för aktier
- Förklara kort risker och möjligheter
- Ge procentuell vikt i portföljen`;
    }

    // Add detailed user profile information
    if (riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL:
- Ålder: ${riskProfile.age || 'Ej angivet'} år
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Tidshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (1-3 år)' : riskProfile.investment_horizon === 'medium' ? 'Medel (3-7 år)' : 'Lång (7+ år)'}
- Månatlig budget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}
- Riskkomfort: ${riskProfile.risk_comfort_level || 5}/10
- Sektorintressen: ${riskProfile.sector_interests ? riskProfile.sector_interests.join(', ') : 'Allmänna'}`;
      
      if (riskProfile.annual_income) {
        contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
      }
      
      if (riskProfile.liquid_capital) {
        contextInfo += `\n- Tillgängligt kapital: ${riskProfile.liquid_capital.toLocaleString()} SEK`;
      }
    }

    // Add conversation data if available
    if (conversationData) {
      contextInfo += `\n\nKONVERSATIONSDATA:`;
      
      if (conversationData.interests && conversationData.interests.length > 0) {
        contextInfo += `\n- Personliga intressen: ${conversationData.interests.join(', ')}`;
      }
      
      if (conversationData.companies && conversationData.companies.length > 0) {
        contextInfo += `\n- Företag de gillar: ${conversationData.companies.join(', ')}`;
      }
      
      if (conversationData.sustainabilityPreference) {
        contextInfo += `\n- Hållbarhetspreferens: ${conversationData.sustainabilityPreference}`;
      }
      
      if (conversationData.geographicPreference) {
        contextInfo += `\n- Geografisk preferens: ${conversationData.geographicPreference}`;
      }
      
      if (conversationData.investmentStyle) {
        contextInfo += `\n- Investeringsstil: ${conversationData.investmentStyle}`;
      }
      
      if (conversationData.marketCrashReaction) {
        contextInfo += `\n- Reaktion på börskrasch: ${conversationData.marketCrashReaction}`;
      }
    }

    if (portfolio) {
      const totalValue = portfolio.total_value || 0;
      const expectedReturn = portfolio.expected_return || 0;
      const allocation = portfolio.asset_allocation || {};
      
      contextInfo += `\n\nNUVARANDE PORTFÖLJ:
- Totalt värde: ${totalValue.toLocaleString()} SEK
- Förväntad avkastning: ${(expectedReturn * 100).toFixed(1)}%
- Skapad: ${new Date(portfolio.created_at).toLocaleDateString('sv-SE')}`;
      
      if (allocation.stocks) contextInfo += `\n- Aktieallokering: ${allocation.stocks}%`;
      if (allocation.bonds) contextInfo += `\n- Obligationsallokering: ${allocation.bonds}%`;
    }

    if (holdings && holdings.length > 0) {
      const actualHoldings = holdings.filter(h => h.holding_type !== 'recommendation');
      
      if (actualHoldings.length > 0) {
        contextInfo += `\n\nNUVARANDE INNEHAV (UNDVIK DESSA I REKOMMENDATIONER):`;
        actualHoldings.forEach(holding => {
          contextInfo += `\n- ${holding.name} (${holding.symbol || 'N/A'})`;
        });
        
        contextInfo += `\n\nVIKTIGT: Föreslå ALDRIG aktier som användaren redan äger.`;
      }
    }

    // Enhanced system prompt for portfolio generation
    let systemPrompt = `${contextInfo}

UPPDRAG - SKAPA PERSONLIG PORTFÖLJSTRATEGI:

1. ANALYSERA användarens profil noggrant (ålder, risk, intressen, ekonomi)
2. REKOMMENDERA 5-8 specifika investeringar med exakt format:
   **Företagsnamn (SYMBOL)**: Motivering kopplat till användarens profil
3. VARIERAD PORTFÖLJ med olika sektorer och geografier
4. ANPASSA till användarens riskprofil och intressen
5. INKLUDERA både svenska aktier och internationella fonder
6. GE procentuell allokering för varje rekommendation
7. FÖRKLARA varför varje investering passar just denna användare

REKOMMENDATIONSEXEMPEL (använd liknande struktur):
**Castellum AB (CAST)**: Stabil svensk fastighetsaktie med god direktavkastning (4-5%), passar din konservativa risk och preferens för svenska bolag. Allokering: 15%

**Avanza Global**: Bred global indexfond med låga avgifter (0,2%), ger dig exponering mot världsmarknaden. Allokering: 25%

**Evolution Gaming (EVO)**: Ledande inom online-gaming med stark tillväxt, passar din riskprofil och teknikintresse. Allokering: 10%

STRUKTURERA SVARET MED:
- Personlig analys av användarens situation
- 5-8 konkreta investeringsrekommendationer med format ovan
- Allokeringsstrategi (procent för varje)
- Risker och möjligheter
- Månadsplan för implementation
- Uppföljningsplan

VIKTIGT: Anpassa ALLA rekommendationer till användarens specifika profil, intressen och ekonomiska situation. Ingen standardlista!`;

    if (analysisType === 'portfolio_generation') {
      systemPrompt += `\n\nSPECIELL INSTRUKTION FÖR PORTFÖLJGENERERING:
Detta är en komplett portföljanalys. Ge en omfattande strategi med:
- Detaljerad analys av användarens situation
- Minst 6-8 specifika investeringsrekommendationer
- Tydlig allokeringsstrategi med procentsatser
- Konkret månadssparplan
- Rebalanserings- och uppföljningsrutiner`;
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
    console.log('Analysis type:', analysisType);
    console.log('Has conversation data:', !!conversationData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
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
    console.log('AI response preview:', aiResponse?.substring(0, 200));

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
            model: 'gpt-4o',
            analysisType: analysisType || 'general',
            confidence: confidence,
            isExchangeRequest: isExchangeRequest,
            suggestedChanges: isExchangeRequest,
            existingHoldings: Array.from(existingSymbols),
            userProfile: {
              age: riskProfile?.age,
              experience: riskProfile?.investment_experience,
              riskTolerance: riskProfile?.risk_tolerance
            }
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
          model: 'gpt-4o',
          canSuggestChanges: isExchangeRequest,
          existingHoldings: Array.from(existingSymbols),
          hasUserProfile: !!riskProfile,
          hasConversationData: !!conversationData
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
