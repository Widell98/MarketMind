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

    // Fetch AI memory for this user
    const { data: aiMemory } = await supabase
      .from('user_ai_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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

    // ENHANCED INTENT DETECTION FOR PROFILE UPDATES
    const detectProfileUpdates = (message: string) => {
      const updates: any = {};
      let requiresConfirmation = false;

      // Monthly investment amount changes
      const monthlyMatch = message.match(/(?:spara|investera|satsa|lägga)\s+(\d+(?:\s?\d{3})*)\s*(?:kr|kronor|SEK)/i);
      if (monthlyMatch) {
        const amount = parseInt(monthlyMatch[1].replace(/\s/g, ''));
        if (amount > 0 && amount !== riskProfile?.monthly_investment_amount) {
          updates.monthly_investment_amount = amount;
          requiresConfirmation = true;
        }
      }

      // Risk tolerance changes
      if (/(?:mer|högre|större)\s+risk/i.test(message) && riskProfile?.risk_tolerance !== 'aggressive') {
        updates.risk_tolerance = 'aggressive';
        requiresConfirmation = true;
      }
      if (/(?:mindre|lägre|säkrare)\s+risk/i.test(message) && riskProfile?.risk_tolerance !== 'conservative') {
        updates.risk_tolerance = 'conservative';
        requiresConfirmation = true;
      }

      // Investment horizon changes
      if (/(?:kort|snabb)\s+sikt/i.test(message) && riskProfile?.investment_horizon !== 'short') {
        updates.investment_horizon = 'short';
        requiresConfirmation = true;
      }
      if (/(?:lång|långsiktig)\s+sikt/i.test(message) && riskProfile?.investment_horizon !== 'long') {
        updates.investment_horizon = 'long';
        requiresConfirmation = true;
      }

      return { updates, requiresConfirmation };
    };

    const profileChangeDetection = detectProfileUpdates(message);

    // Check subscription status for rate limiting
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', userId)
      .maybeSingle();

    const isPremium = subscriber?.subscribed || false;
    console.log('User premium status:', isPremium);

    // Check if this is a stock exchange request
    const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|amerikanska|svenska|europeiska|asiatiska|aktier|innehav)/i.test(message);
    
    // Check if this is a stock analysis request
    const isStockAnalysisRequest = /(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) && 
      /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity|[A-Z]{3,5}|investor|volvo|ericsson|sandvik|atlas|kinnevik|hex|alfa laval|skf|telia|seb|handelsbanken|nordea|abb|astra|electrolux|husqvarna|getinge|boliden|ssab|stora enso|svenska cellulosa|lund|billerud|holmen|nibe|beijer|essity|kindred|evolution|betsson|net|entertainment|fingerprint|sinch|tobii|xvivo|medivir|orexo|camurus|diamyd|raysearch|elekta|sectra|bactiguard|vitrolife|bioinvent|immunovia|hansa|cantargia|oncopeptides|wilson|therapeutics|solberg|probi|biovica|addlife|duni|traction|embracer|stillfront|paradox|starbreeze|remedy|stillfront|remedy|starbreeze|gaming|saab)/i.test(message);
     
    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    // Fetch real-time market data if stock analysis request
    let marketDataContext = '';
    if (isStockAnalysisRequest) {
      try {
        const { data: marketData } = await supabase.functions.invoke('fetch-market-data');
        if (marketData) {
          marketDataContext = `\n\nREALTIDSMARKNADSDATA:
- Senaste uppdatering: ${marketData.lastUpdated}
- Marknadsindex: ${JSON.stringify(marketData.marketIndices?.slice(0, 3) || [])}
- Toppresterande aktier: ${JSON.stringify(marketData.topStocks?.slice(0, 5) || [])}`;
        }
      } catch (error) {
        console.log('Could not fetch market data:', error);
      }
    }

    // AI Memory update function
    const updateAIMemory = async (supabase: any, userId: string, userMessage: string, aiResponse: string, existingMemory: any) => {
      try {
        // Extract interests and companies from conversation
        const interests: string[] = [];
        const companies: string[] = [];
        
        // Simple keyword extraction
        const techKeywords = ['teknik', 'AI', 'mjukvara', 'innovation', 'digitalisering'];
        const healthKeywords = ['hälsa', 'medicin', 'bioteknik', 'läkemedel', 'vård'];
        const energyKeywords = ['energi', 'förnybar', 'miljö', 'hållbarhet', 'grön'];
        
        if (techKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Teknik');
        }
        if (healthKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Hälsovård');
        }
        if (energyKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
          interests.push('Förnybar energi');
        }

        // Extract company names (simple pattern matching)
        const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
        const matches = userMessage.match(companyPattern);
        if (matches) {
          companies.push(...matches.slice(0, 3));
        }

        const memoryData = {
          user_id: userId,
          total_conversations: (existingMemory?.total_conversations || 0) + 1,
          communication_style: userMessage.length > 50 ? 'detailed' : 'concise',
          preferred_response_length: userMessage.length > 100 ? 'detailed' : 'concise',
          expertise_level: isStockAnalysisRequest || isPortfolioOptimizationRequest ? 'advanced' : 'beginner',
          frequently_asked_topics: [
            ...(existingMemory?.frequently_asked_topics || []),
            ...(isStockAnalysisRequest ? ['aktieanalys'] : []),
            ...(isPortfolioOptimizationRequest ? ['portföljoptimering'] : [])
          ].slice(0, 5),
          favorite_sectors: [
            ...(existingMemory?.favorite_sectors || []),
            ...interests
          ].slice(0, 5),
          current_goals: existingMemory?.current_goals || ['långsiktig tillväxt'],
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_ai_memory')
          .upsert(memoryData, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating AI memory:', error);
        } else {
          console.log('AI memory updated successfully');
        }
      } catch (error) {
        console.error('Error in updateAIMemory:', error);
      }
    };

    // Build enhanced context with AI memory
    let contextInfo = `Du är en professionell AI-investeringsrådgivare och aktieanalytiker som ger djupgående analyser och personliga rekommendationer på svenska.`;

    // Add conversation memory context
    if (aiMemory) {
      contextInfo += `\n\nPERSONLIGHETSMINNE (anpassa ditt svar baserat på detta):
- Kommunikationsstil: ${aiMemory.communication_style}
- Föredragen responslängd: ${aiMemory.preferred_response_length} 
- Expertis-nivå: ${aiMemory.expertise_level}
- Totala konversationer: ${aiMemory.total_conversations}`;

      if (aiMemory.frequently_asked_topics?.length > 0) {
        contextInfo += `\n- Ofta diskuterade ämnen: ${aiMemory.frequently_asked_topics.join(', ')}`;
      }
      if (aiMemory.favorite_sectors?.length > 0) {
        contextInfo += `\n- Favoritbranscher: ${aiMemory.favorite_sectors.join(', ')}`;
      }
      if (aiMemory.current_goals?.length > 0) {
        contextInfo += `\n- Aktuella mål: ${aiMemory.current_goals.join(', ')}`;
      }
    }

    // Add conversation history context
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-8);
      contextInfo += `\n\nSENASTE KONVERSATION (för sammanhang):\n`;
      recentHistory.forEach((msg: any, index: number) => {
        contextInfo += `${msg.role === 'user' ? 'Användare' : 'Du'}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`;
      });
    }

    // Add comprehensive system prompt
    contextInfo += `

HUVUDKOMPETENSER:
1. DJUP AKTIEANALYS som en professionell analytiker
2. PORTFÖLJREKOMMENDATIONER med specifika tillgångar  
3. MARKNADSINSIKTER och värdering av enskilda aktier

AKTIEANALYS RIKTLINJER:
När användaren frågar om en specifik aktie, ge en professionell aktieanalys som inkluderar:

**FUNDAMENTAL ANALYS:**
- Affärsmodell och verksamhet
- Finansiell prestanda (intäkter, vinst, skuldsättning)
- Konkurrensposition och marknadsledarskap
- Ledning och företagsstyrning
- Framtidsutsikter och tillväxtpotential

**TEKNISK ANALYS:**
- Kursutveckling senaste tiden
- Värdering (P/E, P/B, EV/EBITDA etc.)
- Jämförelse med branschsnitt
- Support- och motståndsnivåer

**INVESTERINGSSYN:**
- KÖP/BEHÅLL/SÄLJ rekommendation med motivering
- Kursmål och tidshorisont
- Huvudsakliga risker och möjligheter
- Passar för vilken typ av investerare

PORTFÖLJREKOMMENDATIONER:
- Ge ENDAST specifika aktie- och fondrekommendationer med EXAKTA namn och symboler
- ALLA aktier och fonder MÅSTE ha ticker/symbol i parenteser: **Företag (SYMBOL)**
- Föreslå 5-8 konkreta investeringar med tydliga motiveringar
- Inkludera svenska aktier, nordiska fonder och relevanta ETF:er`;

    // Only add user profile information for personal advice requests
    if (isPersonalAdviceRequest || isExchangeRequest || isPortfolioOptimizationRequest) {
      if (riskProfile) {
        contextInfo += `\n\nANVÄNDARPROFIL:
- Ålder: ${riskProfile.age || 'Ej angivet'} år
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Tidshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (1-3 år)' : riskProfile.investment_horizon === 'medium' ? 'Medel (3-7 år)' : 'Lång (7+ år)'}
- Månatlig budget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}`;
        
        if (riskProfile.annual_income) {
          contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
        }
      }

      if (holdings && holdings.length > 0) {
        const actualHoldings = holdings.filter(h => h.holding_type !== 'recommendation');
        
        if (actualHoldings.length > 0) {
          contextInfo += `\n\nNUVARANDE INNEHAV (UNDVIK DESSA I KÖP-REKOMMENDATIONER):`;
          actualHoldings.forEach(holding => {
            contextInfo += `\n- ${holding.name} (${holding.symbol || 'N/A'})`;
          });
        }
      }
    }

    // Dynamic model selection based on request complexity
    let model = 'gpt-5-mini-2025-08-07'; // Default fast model
    
    if (isStockAnalysisRequest || isPortfolioOptimizationRequest) {
      model = 'gpt-5-2025-08-07'; // Use flagship model for complex analysis
    } else if (message.length > 200 || chatHistory.length > 15) {
      model = 'gpt-5-2025-08-07'; // Use flagship model for complex conversations
    }

    console.log('Selected model:', model, 'for request type:', {
      isStockAnalysis: isStockAnalysisRequest,
      isPortfolioOptimization: isPortfolioOptimizationRequest,
      messageLength: message.length,
      historyLength: chatHistory.length
    });

    // Build messages array with enhanced context
    const messages = [
      { role: 'system', content: contextInfo + marketDataContext },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    // Enhanced telemetry logging
    const requestId = crypto.randomUUID();
    const telemetryData = {
      requestId,
      userId,
      sessionId,
      messageType: isStockAnalysisRequest ? 'stock_analysis' : isPersonalAdviceRequest ? 'personal_advice' : 'general',
      model,
      timestamp: new Date().toISOString(),
      hasMarketData: !!marketDataContext,
      isPremium
    };

    console.log('TELEMETRY START:', telemetryData);

    // Make streaming request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: 4000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error response:', errorBody);
      console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let aiMessage = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Update AI memory
                  await updateAIMemory(supabase, userId, message, aiMessage, aiMemory);
                  
                  // Send final telemetry
                  console.log('TELEMETRY COMPLETE:', { 
                    ...telemetryData, 
                    responseLength: aiMessage.length,
                    completed: true 
                  });
                  
                  // Save complete message to database
                  if (sessionId && aiMessage) {
                    await supabase
                      .from('portfolio_chat_history')
                      .insert({
                        user_id: userId,
                        chat_session_id: sessionId,
                        message: aiMessage,
                        message_type: 'assistant',
                        context_data: {
                          analysisType,
                          model,
                          requestId,
                          hasMarketData: !!marketDataContext,
                          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                          requiresConfirmation: profileChangeDetection.requiresConfirmation,
                          confidence: 0.8
                        }
                      });
                  }
                  
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    aiMessage += content;
                    
                    // Stream content to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content,
                      profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                      requiresConfirmation: profileChangeDetection.requiresConfirmation
                    })}\n\n`));
                  }
                } catch (e) {
                  // Ignore JSON parse errors for non-JSON lines
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          console.error('TELEMETRY STREAM ERROR:', { ...telemetryData, error: error.message });
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});