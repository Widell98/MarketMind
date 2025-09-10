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
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe, conversationData, stream } = requestBody;

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

    // Fetch all user data in parallel for better performance
    const [
      { data: aiMemory },
      { data: riskProfile },
      { data: portfolio },
      { data: holdings },
      { data: subscriber }
    ] = await Promise.all([
      supabase
        .from('user_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

    // ENHANCED INTENT DETECTION FOR PROFILE UPDATES
    const detectProfileUpdates = (message: string) => {
      const updates: any = {};
      let requiresConfirmation = false;
      const lowerMessage = message.toLowerCase();

      // Parse monthly savings changes - more comprehensive
      const monthlySavingsPattern = /(öka|höja|minska|sänka|ändra).*(?:månad|månads).*(?:sparande|spara|investera).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const monthlySavingsMatch = message.match(monthlySavingsPattern);
      
      if (monthlySavingsMatch) {
        const action = monthlySavingsMatch[1].toLowerCase();
        const amount = parseInt(monthlySavingsMatch[2].replace(/[\s,]/g, ''));
        const currentAmount = riskProfile?.monthly_investment_amount || 0;
        
        let newAmount = amount;
        if (action.includes('öka') || action.includes('höja')) {
          newAmount = currentAmount + amount;
        } else if (action.includes('minska') || action.includes('sänka')) {
          newAmount = Math.max(0, currentAmount - amount);
        }

        if (newAmount !== currentAmount) {
          updates.monthly_investment_amount = newAmount;
          requiresConfirmation = true;
        }
      }

      // Direct monthly investment amount
      const directMonthlyMatch = message.match(/(?:spara|investera|satsa|lägga)\s+(\d+(?:\s?\d{3})*)\s*(?:kr|kronor|SEK).*(?:månad|månads)/i);
      if (directMonthlyMatch) {
        const amount = parseInt(directMonthlyMatch[1].replace(/\s/g, ''));
        if (amount > 0 && amount !== riskProfile?.monthly_investment_amount) {
          updates.monthly_investment_amount = amount;
          requiresConfirmation = true;
        }
      }

      // Parse age updates
      const agePattern = /(?:är|age|ålder).*?(\d{2,3})\s*(?:år|years|old)/i;
      const ageMatch = message.match(agePattern);
      
      if (ageMatch) {
        const newAge = parseInt(ageMatch[1]);
        if (newAge >= 18 && newAge <= 100 && newAge !== riskProfile?.age) {
          updates.age = newAge;
          requiresConfirmation = true;
        }
      }

      // Parse income updates
      const incomePattern = /(årsinkomst|lön|income).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const incomeMatch = message.match(incomePattern);
      
      if (incomeMatch) {
        const newIncome = parseInt(incomeMatch[2].replace(/[\s,]/g, ''));
        if (newIncome !== riskProfile?.annual_income) {
          updates.annual_income = newIncome;
          requiresConfirmation = true;
        }
      }

      // Risk tolerance updates - enhanced patterns
      const riskPatterns = [
        { pattern: /(konservativ|låg risk|säker|försiktig)/i, value: 'conservative' },
        { pattern: /(måttlig|medel|balanserad|moderate)/i, value: 'moderate' },
        { pattern: /(aggressiv|hög risk|riskabel|risktagande)/i, value: 'aggressive' }
      ];

      for (const riskPattern of riskPatterns) {
        if (lowerMessage.match(riskPattern.pattern) && 
            (lowerMessage.includes('risk') || lowerMessage.includes('inställning') || 
            lowerMessage.includes('tolerans')) &&
            riskPattern.value !== riskProfile?.risk_tolerance) {
          updates.risk_tolerance = riskPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      // Investment horizon updates - enhanced patterns
      const horizonPatterns = [
        { pattern: /(kort|1-3|kortsiktig)/i, value: 'short' },
        { pattern: /(medel|3-7|mellanlång)/i, value: 'medium' },
        { pattern: /(lång|7\+|långsiktig|över 7)/i, value: 'long' }
      ];

      for (const horizonPattern of horizonPatterns) {
        if (lowerMessage.match(horizonPattern.pattern) && 
            (lowerMessage.includes('horisont') || lowerMessage.includes('sikt') || 
            lowerMessage.includes('tidshorisont')) &&
            horizonPattern.value !== riskProfile?.investment_horizon) {
          updates.investment_horizon = horizonPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      return { updates, requiresConfirmation };
    };

    const profileChangeDetection = detectProfileUpdates(message);

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

    // ENHANCED INTENT ROUTING SYSTEM
    const detectIntent = (message: string) => {
      const msg = message.toLowerCase();
      
      // Stock/Company Analysis Intent
      if (/(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) && 
          /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity|[A-Z]{3,5})/i.test(message)) {
        return 'stock_analysis';
      }
      
      // Portfolio Rebalancing/Optimization Intent
      if (/(?:portfölj|portfolio)/i.test(message) && /(?:optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma|rebalansera)/i.test(message)) {
        return 'portfolio_optimization';
      }
      
      // Buy/Sell Decisions Intent
      if (/(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|position|handel)/i.test(message)) {
        return 'buy_sell_decisions';
      }
       
      // Market Analysis Intent
      if (/(?:marknad|index|trend|prognos|ekonomi|räntor|inflation|börsen)/i.test(message)) {
        return 'market_analysis';
      }
      
      return 'general_advice';
    };

    const userIntent = detectIntent(message);
    console.log('Detected user intent:', userIntent);

    // Build enhanced context with intent-specific prompts
let contextInfo = `Du är en auktoriserad svensk investeringsrådgivare med diskretionär men icke-verkställande behörighet. Du agerar som en personlig finansiell rådgivare som ger professionella investeringsråd.

PERSONA & STIL:
- Professionell men konverserande ton, som en erfaren rådgivare som bjuder in till dialog
- Anpassa svarens längd: ge korta, konkreta svar (2–5 meningar) om frågan är enkel
- Använd längre strukturerade svar (Situation, Strategi, Risker, Åtgärder) endast när användaren explicit ber om en detaljerad plan
- Ge alltid exempel på relevanta aktier/fonder med symboler när det är lämpligt
- Om användaren har kassa eller månadssparande → ge alltid ett allokeringsförslag
- Använd svensk finansterminologi och marknadskontext
- Avsluta svar med en öppen fråga för att uppmuntra fortsatt dialog
- Inkludera alltid en **Disclaimer** om utbildningssyfte
`;

const intentPrompts = {
  stock_analysis: `
AKTIEANALYSUPPGIFT:
Svara alltid i en strukturerad analys med följande sektioner (kortfattat men tydligt):

🏢 FÖRETAGSÖVERSIKT
[Beskriv bolaget, dess affärsmodell, styrkor och marknadsposition]

📊 FINANSIELL ANALYS
[Sammanfatta intäkter, lönsamhet, skuldsättning och kassaflöde]

📈 VÄRDERING & KURSUTVECKLING
[Diskutera P/E-tal, substansvärde, historisk kursutveckling, tekniska nivåer]

🎯 INVESTERINGSREKOMMENDATION
[Ge KÖP/BEHÅLL/SÄLJ med tydlig motivering, samt ev. kursmål och tidshorisont]

⚠️ RISKER & MÖJLIGHETER
[List de största riskerna och möjligheterna kopplat till aktien]

💡 SLUTSATS
[Sammanfatta med tydligt fokus på vilken typ av investerare aktien passar]

Avsluta alltid med en **öppen fråga** för att bjuda in till dialog.
Inkludera en **Disclaimer** om att råden är i utbildningssyfte.`,


  portfolio_optimization: `
PORTFÖLJOPTIMERINGSUPPGIFT:
- Identifiera överexponering och luckor
- Föreslå omviktningar med procentsatser
- Om kassa eller månadssparande finns: inkludera allokeringsförslag
- Ge enklare prioriteringssteg, men inte hela planen direkt`,

  buy_sell_decisions: `
KÖP/SÄLJ-BESLUTSUPPGIFT:
- Bedöm om tidpunkten är lämplig
- Ange för- och nackdelar
- Föreslå positionsstorlek i procent
- Avsluta med en fråga tillbaka till användaren`,

  market_analysis: `
MARKNADSANALYSUPPGIFT:
- Analysera trender kortfattat
- Beskriv påverkan på användarens portfölj
- Ge 1–2 möjliga justeringar
- Avsluta med fråga om användaren vill ha en djupare analys`,

  general_advice: `
ALLMÄN INVESTERINGSRÅDGIVNING:
- Ge råd i 2–4 meningar
- Inkludera exempel (aktie, fond eller allokering)
- Avsluta med öppen fråga för att driva dialog`
};

contextInfo += intentPrompts[userIntent] || intentPrompts.general_advice;

// … här behåller du riskProfile och holdings-delen som du redan har …


    // Enhanced user context with current holdings and performance
    if (riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL (använd denna info, fråga ALDRIG efter den igen):
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Investeringshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (1-3 år)' : riskProfile.investment_horizon === 'medium' ? 'Medellång (3-7 år)' : 'Lång (7+ år)'}
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}`;
      
      if (riskProfile.monthly_investment_amount) {
        contextInfo += `\n- Månatligt sparande: ${riskProfile.monthly_investment_amount.toLocaleString()} SEK`;
      }
      
      if (riskProfile.annual_income) {
        contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
      }
      
      if (riskProfile.sector_interests && riskProfile.sector_interests.length > 0) {
        contextInfo += `\n- Sektorintressen: ${riskProfile.sector_interests.join(', ')}`;
      }
      
      if (riskProfile.investment_goal) {
        contextInfo += `\n- Investeringsmål: ${riskProfile.investment_goal}`;
      }
    }

    // Add current portfolio context with latest valuations
    if (holdings && holdings.length > 0) {
      const actualHoldings = holdings.filter(h => h.holding_type !== 'recommendation');
      if (actualHoldings.length > 0) {
        const totalValue = actualHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
        const topHoldings = actualHoldings
          .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
          .slice(0, 5);
        
        contextInfo += `\n\nNUVARANDE PORTFÖLJ:
- Totalt värde: ${totalValue.toLocaleString()} SEK
- Antal innehav: ${actualHoldings.length}
- Största positioner: ${topHoldings.map(h => `${h.symbol || h.name} (${((h.current_value || 0) / totalValue * 100).toFixed(1)}%)`).join(', ')}`;
        
        if (portfolio) {
          contextInfo += `\n- Portföljens riskpoäng: ${portfolio.risk_score || 'Ej beräknad'}
- Förväntad årlig avkastning: ${portfolio.expected_return || 'Ej beräknad'}%`;
        }
      }
    }

// Add response structure requirements
contextInfo += `\n\nSVARSSTRUKTUR (OBLIGATORISK MEN FLEXIBEL):
- Anpassa svar efter frågans komplexitet
- Vid enkla frågor: ge ett kort konversationssvar (2–5 meningar) och avsluta med en öppen motfråga
- Vid mer komplexa frågor eller när användaren ber om en detaljerad plan: använd den fulla strukturen nedan

EMOJI-REGLER:
- Vid aktieanalys: Använd ALLTID relevanta emojis för att göra svaret mer engagerande
- Exempel: 📈 för positiva trender, 📉 för negativa, 💼 för företag, ⚠️ för risker, 🎯 för mål, 💡 för tips, 🔍 för analys, 🌟 för rekommendationer, 💪 för starka positioner, ⚖️ för balans, 🚀 för tillväxt

FULL STRUKTUR (när relevant):

**Situation & Analys** 🔍
[Kort sammanfattning av situationen/frågan]

**Rekommendation** 🌟
[Konkreta råd med specifika aktier/fonder och symboler där relevant]

**Risker & Överväganden** ⚠️
[Viktiga risker och faktorer att beakta]

**Åtgärder (Checklista)** 📋
□ [Konkret åtgärd 1]
□ [Konkret åtgärd 2]
□ [Konkret åtgärd 3]

**Disclaimer:** Detta är endast i utbildningssyfte. Konsultera alltid en licensierad rådgivare.

VIKTIGT:
- Ge bara en "Åtgärder (Checklista)" om frågan faktiskt kräver konkreta steg.
- Vid aktieanalys: Använd emojis genomgående för att göra analysen mer visuellt tilltalande och lättläst
- När du ger specifika aktierekommendationer, lägg även till en rad i slutet på formatet:
Aktieförslag: [{"name": "Bolag", "ticker": "TICKER", "reason": "Kort motivering"}]
Om inga förslag ges, skriv: Aktieförslag: [].
- Avsluta alltid svaret med en öppen fråga för att bjuda in till vidare dialog.`;


    // Force using gpt-4o to avoid streaming restrictions and reduce cost
    const model = 'gpt-4o';

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

    // Save user message to database first
    if (sessionId) {
      try {
        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: message,
            message_type: 'user',
            context_data: {
              analysisType,
              requestId,
              timestamp: new Date().toISOString()
            }
          });
        console.log('User message saved to database');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // If the client requests non-streaming, return JSON instead of SSE
    if (stream === false) {
      const nonStreamResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!nonStreamResp.ok) {
        const errorBody = await nonStreamResp.text();
        console.error('OpenAI API error response:', errorBody);
        console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
        throw new Error(`OpenAI API error: ${nonStreamResp.status} - ${errorBody}`);
      }

      const nonStreamData = await nonStreamResp.json();
      const aiMessage = nonStreamData.choices?.[0]?.message?.content || '';

      // Update AI memory and optionally save to chat history
      await updateAIMemory(supabase, userId, message, aiMessage, aiMemory);
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

      console.log('TELEMETRY COMPLETE:', { ...telemetryData, responseLength: aiMessage.length, completed: true });

      return new Response(
        JSON.stringify({
          response: aiMessage,
          requiresConfirmation: profileChangeDetection.requiresConfirmation,
          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: streaming SSE response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
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
    const streamResp = new ReadableStream({
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

    return new Response(streamResp, {
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