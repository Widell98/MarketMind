
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const quotaExceededResponse = () =>
  jsonResponse({
    success: false,
    error: 'quota_exceeded',
    message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
  }, 429);

function detectSector(name: string, symbol?: string) {
  const n = name.toLowerCase();
  const s = (symbol || '').toUpperCase();
  if (n.includes('bank') || /SHB|SEB|NDA/.test(s)) return 'Bank';
  if (n.includes('fastighet') || /CAST|SBB/.test(s)) return 'Fastighet';
  if (n.includes('investor') || n.includes('investment')) return 'Investmentbolag';
  if (n.includes('global') || n.includes('world') || n.includes('index')) return 'Indexfond';
  if (n.includes('tech') || n.includes('teknik') || /NVDA|AAPL|MSFT|EVO/.test(s)) return 'Teknik';
  return 'Allmän';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { riskProfileId, userId, conversationPrompt, conversationData } = await req.json();

    console.log('Generate portfolio request:', {
      riskProfileId,
      userId,
      hasConversationPrompt: Boolean(conversationPrompt),
      hasConversationData: conversationData && typeof conversationData === 'object'
    });

    if (!riskProfileId || !userId) {
      throw new Error('Missing required parameters: riskProfileId and userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get risk profile data
    const { data: riskProfile, error: riskError } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('id', riskProfileId)
      .single();

    if (riskError || !riskProfile) {
      console.error('Error fetching risk profile:', riskError);
      throw new Error('Risk profile not found');
    }

    console.log('Risk profile found:', riskProfile);

    // Get existing holdings to avoid duplicates
    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    // Filter out existing holdings
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

    // Fetch user AI memory for deeper personalization
    const { data: aiMemory } = await supabase
      .from('user_ai_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Call OpenAI API for personalized recommendations
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced system persona for initial portfolio advisor
    let contextInfo = `Du är en licensierad och auktoriserad svensk investeringsrådgivare
med över 15 års erfarenhet av att bygga skräddarsydda portföljer.
Du arbetar enligt svensk finanslagstiftning och MiFID II-reglerna och
fokuserar alltid på att skapa trygghet och långsiktigt värde för klienten.

DITT UPPDRAG:
- Bygg en komplett portfölj baserad på användarens riskprofil, horisont och mål
- Portföljen ska bestå av **6–8 unika investeringar**
- Endast investeringar tillgängliga via svenska plattformar (Avanza, Nordnet)
- Alltid korrekt ticker-symbol: **Företag (TICKER)**
- Balansera mellan svenska aktier, nordiska fonder och globala ETF:er
- Anpassa rekommendationer för ISK/KF-optimering
- Summera allokeringar till exakt **100%**

OBLIGATORISKT FORMAT FÖR VARJE INVESTERING:
### Exakt företagsnamn (TICKER)
- **Analys:** Varför denna investering passar användaren (fundamental analys + riskbedömning)
- **Roll i portföljen:** Hur den kompletterar helheten
- **Rekommenderad allokering:** XX%

KONKRETA EXEMPEL:
### Investor AB (INVE-B)
- **Analys:** Svenskt investmentbolag med diversifierad portfölj och stark historik
- **Roll i portföljen:** Basexponering mot stabila svenska storbolag
- **Allokering:** 15%

### Spiltan Aktiefond Investmentbolag
- **Analys:** Aktivt förvaltad fond med fokus på nordiska investmentbolag, låg avgift
- **Roll i portföljen:** Diversifiering och långsiktig stabilitet
- **Allokering:** 20%

### XACT OMXS30 (XACT30)
- **Analys:** Indexfond som speglar Stockholmsbörsens 30 största bolag
- **Roll i portföljen:** Kostnadseffektiv bred bas
- **Allokering:** 25%

FÖRBJUDET:
- Generella råd utan tickers
- Att repetera samma investering flera gånger
- Allmän diversifiering som "råd"
- Icke-investerbara koncept

KVALITETSKRAV:
- Alla investeringar ska vara verifierbara med tickers
- Variera sektorer och ge en balanserad portfölj
- Anpassa risknivån exakt till användarens profil
- Avsluta alltid med en **öppen fråga** som bjuder in till vidare dialog

**Disclaimer:** Alla råd är endast i utbildningssyfte. Konsultera alltid en licensierad rådgivare innan du fattar beslut.
`;

    let conversationSummary = '';

    if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
      const rawData = conversationData as Record<string, unknown>;
      const details: string[] = [];

      const asString = (value: unknown) => typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
      const asNumber = (value: unknown) => {
        if (typeof value === 'number' && !Number.isNaN(value)) return value;
        if (typeof value === 'string') {
          const numeric = Number(value.replace(/[^\d.-]/g, ''));
          return Number.isFinite(numeric) ? numeric : null;
        }
        return null;
      };
      const asStringArray = (value: unknown) => {
        if (!Array.isArray(value)) return null;
        const parsed = value
          .map(item => (typeof item === 'string' && item.trim().length > 0 ? item.trim() : null))
          .filter((item): item is string => Boolean(item));
        return parsed.length > 0 ? parsed : null;
      };

      const addDetail = (label: string, value: string | number | null) => {
        if (value !== null && value !== '') {
          details.push(`${label}: ${value}`);
        }
      };

      const addArrayDetail = (label: string, value: unknown) => {
        const arr = asStringArray(value);
        if (arr) {
          details.push(`${label}: ${arr.join(', ')}`);
        }
      };

      const experienceLabel = asString(rawData.marketExperience)
        || (typeof rawData.isBeginnerInvestor === 'boolean'
          ? rawData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'
          : null);

      addDetail('Investeringsmål', asString(rawData.investmentGoal));
      addDetail('Sökt portföljstorlek', asString(rawData.portfolioSize));
      addDetail('Investerarens erfarenhet', experienceLabel);
      addDetail('Önskad investeringsstil', asString(rawData.investmentStyle));
      addDetail('Utdelningskrav', asString(rawData.dividendYieldRequirement));
      addDetail('Hållbarhetsfokus', asString(rawData.sustainabilityPreference));
      addDetail('Geografisk inriktning', asString(rawData.geographicPreference));
      addDetail('Reaktion på börsras', asString(rawData.marketCrashReaction));

      const comfort = typeof rawData.volatilityComfort === 'number' ? rawData.volatilityComfort
        : typeof rawData.volatilityComfort === 'string' ? Number(rawData.volatilityComfort) : null;
      addDetail('Volatilitetskomfort (1-10)', comfort !== null && Number.isFinite(comfort) ? comfort : null);

      const monthlyIncome = asNumber(rawData.monthlyIncome);
      addDetail('Månadsinkomst', monthlyIncome !== null && Number.isFinite(monthlyIncome) ? `${monthlyIncome.toLocaleString('sv-SE')} SEK` : null);

      const annualIncome = asNumber(rawData.annualIncome);
      addDetail('Årsinkomst', annualIncome !== null && Number.isFinite(annualIncome) ? `${annualIncome.toLocaleString('sv-SE')} SEK` : null);

      const capital = asNumber(rawData.availableCapital);
      addDetail('Tillgängligt kapital', capital !== null && Number.isFinite(capital) ? `${capital.toLocaleString('sv-SE')} SEK` : null);

      const liquidCapital = asNumber(rawData.liquidCapital);
      addDetail('Likvida medel', liquidCapital !== null && Number.isFinite(liquidCapital) ? `${liquidCapital.toLocaleString('sv-SE')} SEK` : null);

      if (typeof rawData.housingSituation === 'string') {
        addDetail('Bostadssituation', rawData.housingSituation);
      }

      if (typeof rawData.hasLoans === 'boolean') {
        addDetail('Har lån', rawData.hasLoans ? 'Ja' : 'Nej');
      }

      if (typeof rawData.loanDetails === 'string' && rawData.loanDetails.trim().length > 0) {
        addDetail('Lånedetaljer', rawData.loanDetails);
      }

      if (typeof rawData.hasChildren === 'boolean') {
        addDetail('Har försörjningsansvar', rawData.hasChildren ? 'Ja' : 'Nej');
      }

      if (typeof rawData.emergencyFund === 'string') {
        const emergencyMap: Record<string, string> = {
          yes_full: 'Full buffert',
          yes_partial: 'Delvis buffert',
          no: 'Ingen buffert'
        };
        addDetail('Buffertstatus', emergencyMap[rawData.emergencyFund] || rawData.emergencyFund);
      }

      if (typeof rawData.emergencyBufferMonths === 'number' && Number.isFinite(rawData.emergencyBufferMonths)) {
        addDetail('Buffert (månader)', rawData.emergencyBufferMonths);
      }

      addArrayDetail('Ekonomiska åtaganden', rawData.financialObligations);
      addArrayDetail('Föredragna sektorer', rawData.sectors || rawData.sectorExposure);
      addArrayDetail('Särskilda intressen', rawData.interests);
      addArrayDetail('Föredragna bolag', rawData.companies);
      addArrayDetail('Investeringssyften', rawData.investmentPurpose);

      const targetAmount = asNumber(rawData.targetAmount ?? rawData.specificGoalAmount);
      addDetail('Målbelopp', targetAmount !== null && Number.isFinite(targetAmount) ? `${targetAmount.toLocaleString('sv-SE')} SEK` : null);

      addDetail('Måldatum', asString(rawData.targetDate));

      if (typeof rawData.preferredStockCount === 'number' && Number.isFinite(rawData.preferredStockCount)) {
        addDetail('Önskat antal innehav', rawData.preferredStockCount);
      }

      if (typeof rawData.controlImportance === 'number' && Number.isFinite(rawData.controlImportance)) {
        addDetail('Kontrollbehov (1-5)', rawData.controlImportance);
      }

      if (typeof rawData.panicSellingHistory === 'boolean') {
        addDetail('Historik av panikförsäljning', rawData.panicSellingHistory ? 'Ja' : 'Nej');
      }

      addDetail('Aktivitetsnivå', asString(rawData.activityPreference));
      addDetail('Ombalanseringsfrekvens', asString(rawData.portfolioChangeFrequency || rawData.rebalancingFrequency));
      addDetail('Medvetenhet om överexponering', asString(rawData.overexposureAwareness));

      const currentPortfolioValue = asNumber(rawData.currentPortfolioValue);
      addDetail('Nuvarande portföljvärde (rapport)', currentPortfolioValue !== null && Number.isFinite(currentPortfolioValue) ? `${currentPortfolioValue.toLocaleString('sv-SE')} SEK` : null);

      const helpNeeded = asString(rawData.portfolioHelp);
      if (helpNeeded) {
        details.push(`Specifikt stöd som efterfrågas: ${helpNeeded}`);
      }

      addDetail('Önskad kommunikationsstil', asString(rawData.communicationStyle));
      addDetail('Önskad svarslängd', asString(rawData.preferredResponseLength));

      if (typeof rawData.additionalNotes === 'string' && rawData.additionalNotes.trim().length > 0) {
        details.push(`Ytterligare anteckningar: ${rawData.additionalNotes.trim()}`);
      }

      if (details.length > 0) {
        conversationSummary = details.map(detail => `- ${detail}`).join('\n');
        contextInfo += `\n\nFÖRDJUPAD KUNDKONVERSATION:\n${conversationSummary}`;
      }
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

      if (riskProfile.investment_goal) {
        contextInfo += `\n- Investeringsmål: ${riskProfile.investment_goal}`;
      }

      if (riskProfile.market_crash_reaction) {
        contextInfo += `\n- Reaktion på börskrasch: ${riskProfile.market_crash_reaction}`;
      }
    }

    // Add AI memory to personalize further
    if (aiMemory) {
      const favSectors = Array.isArray(aiMemory.favorite_sectors) && aiMemory.favorite_sectors.length ? aiMemory.favorite_sectors.join(', ') : null;
      const prefCompanies = Array.isArray(aiMemory.preferred_companies) && aiMemory.preferred_companies.length ? aiMemory.preferred_companies.join(', ') : null;
      const style = aiMemory.communication_style || null;
      const respLen = aiMemory.preferred_response_length || null;
      contextInfo += `\n\nAI-MINNEN OCH PREFERENSER:${favSectors ? `\n- Favoritsektorer: ${favSectors}` : ''}${prefCompanies ? `\n- Föredragna bolag: ${prefCompanies}` : ''}${style ? `\n- Kommunikationsstil: ${style}` : ''}${respLen ? `\n- Föredragen svarslängd: ${respLen}` : ''}`;
    }

    if (existingSymbols.size > 0) {
      contextInfo += `\n\nNUVARANDE INNEHAV (UNDVIK DESSA I REKOMMENDATIONER):`;
      Array.from(existingSymbols).forEach(symbol => {
        contextInfo += `\n- ${symbol}`;
      });
      
      contextInfo += `\n\nVIKTIGT: Föreslå ALDRIG aktier som användaren redan äger.`;
    }

    // Enhanced system prompt with professional advisor structure and JSON output
    const systemPrompt = `${contextInfo}

DU ÄR EN LICENSIERAD SVENSK PORTFÖLJRÅDGIVARE:
- Anpassa varje rekommendation efter kundens riskprofil, mål, tidshorisont och tidigare innehav
- Tillåt endast investeringar som är handlingsbara via svenska plattformar (Avanza, Nordnet) och kompatibla med ISK/KF
- Säkerställ att portföljen innehåller 6–8 unika innehav med kompletterande riskroller
- Variera sektorer, ge tydlig motivering och knyt alltid tillbaka till kundens svar och riskkomfort

SVARSKRAV (RETURNERA ENDAST GILTIG JSON):
{
  "action_summary": "2–3 meningar om varför portföljen passar kunden",
  "risk_alignment": "Hur portföljen möter risktoleransen och tidshorisonten",
  "next_steps": [
    "Konkreta åtgärder kunden ska ta inom de kommande månaderna"
  ],
  "recommended_assets": [
    {
      "name": "Exakt namn på aktie/fond/ETF",
      "ticker": "Ticker eller fondkod (lämna tom sträng om saknas)",
      "allocation_percent": 0,
      "rationale": "Professionell analys kopplad till kundens profil",
      "risk_role": "Vilken roll innehavet fyller (bas, tillväxt, skydd, satellit, kassaflöde, etc.)"
    }
  ],
  "disclaimer": "Kort juridiskt förbehåll på svenska"
}

VIKTIGT:
- Summan av allocation_percent måste vara exakt 100
- Beskrivningar ska vara handlingsinriktade och använda svensk terminologi
- Minst en rekommendation ska adressera kundens uttalade intressen/sektorfokus om sådana finns
- Ange alltid unika tickers och undvik innehav som kunden redan äger
- Justera risknivån: konservativt = mer defensiva/obligationsliknande, måttligt = balanserad mix, aggressivt = högre tillväxtandel
`;

    const userMessage = `Skapa en komplett portfölj baserat på denna riskprofil:

Ålder: ${riskProfile.age || 'Ej angiven'}
Årsinkomst: ${riskProfile.annual_income || 'Ej angiven'} SEK
Månatligt investeringsbelopp: ${riskProfile.monthly_investment_amount || 'Ej angiven'} SEK
Risktolerans: ${riskProfile.risk_tolerance || 'Medel'}
Investeringsmål: ${riskProfile.investment_goal || 'Långsiktig tillväxt'}
Tidshorisont: ${riskProfile.investment_horizon || 'Lång'}
Erfarenhet: ${riskProfile.investment_experience || 'Medel'}
Sektorintressen: ${JSON.stringify(riskProfile.sector_interests || [])}
Nuvarande portföljvärde: ${riskProfile.current_portfolio_value || 0} SEK
Riskkomfort: ${riskProfile.risk_comfort_level || 5}/10

Skapa en personlig portfölj med ENDAST riktiga aktier och fonder tillgängliga på svenska marknader. Fokusera på att ge konkreta rekommendationer med symboler.`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    if (conversationSummary) {
      messages.push({ role: 'user', content: `Fördjupad samtalskontext:\n${conversationSummary}` });
    }

    if (conversationPrompt && typeof conversationPrompt === 'string' && conversationPrompt.trim().length > 0) {
      messages.push({ role: 'user', content: conversationPrompt });
    }

    if (conversationData && typeof conversationData === 'object') {
      try {
        messages.push({ role: 'user', content: `Rå konsultationsdata (JSON):\n${JSON.stringify(conversationData)}` });
      } catch (jsonError) {
        console.warn('Could not serialize conversationData for OpenAI message:', jsonError);
      }
    }

    console.log('Calling OpenAI API with gpt-4o...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.85,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);

      // Handle specific quota exceeded error
      if (openAIResponse.status === 429) {
        return quotaExceededResponse();
      }

      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiRecommendationsRaw = openAIData.choices?.[0]?.message?.content?.trim() || '';

    console.log('OpenAI full response:', JSON.stringify(openAIData, null, 2));
    console.log('AI recommendations received:', aiRecommendationsRaw);

    if (!aiRecommendationsRaw) {
      console.error('No AI recommendations received from OpenAI');
      throw new Error('No AI response received from OpenAI');
    }

    let { plan: structuredPlan, recommendedStocks } = extractStructuredPlan(aiRecommendationsRaw, riskProfile);

    if (!structuredPlan || recommendedStocks.length === 0) {
      console.warn('Structured plan was missing or incomplete – using default mix based on risk profile');
      recommendedStocks = defaultRecommendations(riskProfile);
      structuredPlan = buildFallbackPlan(riskProfile, recommendedStocks, aiRecommendationsRaw);
    }

    ensureSum100(recommendedStocks);
    const normalizedResponse = JSON.stringify(structuredPlan, null, 2);

    // Create portfolio record
    const portfolioData = {
      user_id: userId,
      risk_profile_id: riskProfileId,
      portfolio_name: 'AI-Genererad Portfölj',
      asset_allocation: {
        allocation_summary: calculateAssetAllocation(recommendedStocks),
        structured_plan: structuredPlan,
      },
      recommended_stocks: recommendedStocks,
      total_value: riskProfile.current_portfolio_value || 0,
      expected_return: calculateExpectedReturn(recommendedStocks),
      risk_score: calculateRiskScore(riskProfile.risk_tolerance, riskProfile.risk_comfort_level),
      is_active: true
    };

    console.log('Creating portfolio with data:', portfolioData);

    // Insert portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .insert(portfolioData)
      .select()
      .single();

    if (portfolioError) {
      console.error('Error creating portfolio:', portfolioError);
      throw new Error('Failed to create portfolio');
    }

    console.log('Portfolio created successfully:', portfolio.id);

    // Add recommended stocks to user_holdings as recommendations
    if (recommendedStocks.length > 0) {
      const holdingsData = recommendedStocks.map(stock => ({
        user_id: userId,
        holding_type: 'recommendation',
        name: stock.name,
        symbol: stock.symbol,
        sector: stock.sector || 'Allmän',
        market: 'Swedish',
        currency: 'SEK',
        allocation: stock.allocation,
        quantity: 0,
        current_value: 0,
        purchase_price: 0,
        purchase_date: new Date().toISOString().split('T')[0]
      }));

      console.log('Inserting holdings data:', holdingsData);

      const { error: holdingsError } = await supabase
        .from('user_holdings')
        .insert(holdingsData);

      if (holdingsError) {
        console.error('Error inserting holdings:', holdingsError);
        // Don't throw error here as portfolio is already created
      } else {
        console.log('Holdings inserted successfully');
      }
    }

    console.log('Returning response with normalized plan:', normalizedResponse.substring(0, 200));

    return jsonResponse({
      success: true,
      portfolio: portfolio,
      aiRecommendations: normalizedResponse,
      aiResponse: normalizedResponse,
      aiResponseRaw: aiRecommendationsRaw,
      plan: structuredPlan,
      confidence: calculateConfidence(recommendedStocks, riskProfile),
      recommendedStocks: recommendedStocks
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a quota-related error
    if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
      return quotaExceededResponse();
    }

    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
});

function calculateAssetAllocation(stocks: Array<{allocation: number, sector?: string}>): any {
  let stocksTotal = 0;
  let bondsTotal = 0;
  let cashTotal = 0;
  
  stocks.forEach(stock => {
    if (stock.sector === 'Bank' || stock.sector === 'Fastighet') {
      bondsTotal += stock.allocation;
    } else {
      stocksTotal += stock.allocation;
    }
  });
  
  // Ensure total is 100%, adjust cash accordingly
  const total = stocksTotal + bondsTotal;
  if (total < 100) {
    cashTotal = 100 - total;
  }
  
  return {
    stocks: stocksTotal,
    bonds: bondsTotal,
    cash: cashTotal
  };
}

function calculateExpectedReturn(stocks: Array<{allocation: number, sector?: string}>): number {
  // More sophisticated calculation based on sectors
  let totalReturn = 0;
  
  stocks.forEach(stock => {
    let sectorReturn = 0.08; // Default 8%
    
    switch (stock.sector) {
      case 'Teknik':
        sectorReturn = 0.12; // 12% for tech
        break;
      case 'Bank':
        sectorReturn = 0.06; // 6% for banks
        break;
      case 'Fastighet':
        sectorReturn = 0.07; // 7% for real estate
        break;
      case 'Indexfond':
        sectorReturn = 0.08; // 8% for index funds
        break;
      case 'Investmentbolag':
        sectorReturn = 0.09; // 9% for investment companies
        break;
    }
    
    totalReturn += (stock.allocation / 100) * sectorReturn;
  });
  
  return totalReturn;
}

function calculateRiskScore(riskTolerance: string, riskComfort?: number): number {
  const baseRiskMap: {[key: string]: number} = {
    'conservative': 3,
    'moderate': 5,
    'aggressive': 8
  };
  
  let baseScore = baseRiskMap[riskTolerance] || 5;
  
  // Adjust based on risk comfort level if available
  if (riskComfort) {
    baseScore = (baseScore + riskComfort) / 2;
  }
  
  return Math.round(baseScore);
}

function calculateConfidence(stocks: Array<any>, riskProfile: any): number {
  let confidence = 0.5; // Base confidence
  
  if (stocks.length >= 5) confidence += 0.2; // Good diversification
  if (riskProfile.sector_interests && riskProfile.sector_interests.length > 0) confidence += 0.1; // Has preferences
  if (riskProfile.investment_experience) confidence += 0.1; // Has experience data
  if (riskProfile.risk_comfort_level) confidence += 0.1; // Has risk comfort data
  
  return Math.min(confidence, 1.0);
}

// --- Fallback helpers to guarantee a usable response ---
function ensureSum100(items: Array<{ allocation: number }>) {
  // Round allocations and fix total to 100
  let total = items.reduce((acc, it) => acc + Math.round(it.allocation), 0);
  items.forEach(it => (it.allocation = Math.round(it.allocation)));
  const diff = 100 - total;
  if (items.length > 0 && diff !== 0) {
    items[items.length - 1].allocation = Math.max(0, items[items.length - 1].allocation + diff);
  }
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(entry => (entry != null ? String(entry).trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map(entry => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function parseAllocationPercent(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(?:[.,]\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0].replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return Math.max(0, Math.min(100, Math.round(parsed)));
      }
    }
  }
  return 0;
}

function describeRiskLevel(riskProfile: any): string {
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (tolerance === 'conservative') return 'en konservativ och trygg';
  if (tolerance === 'aggressive') return 'en offensiv och tillväxtorienterad';
  return 'en balanserad';
}

function describeHorizon(riskProfile: any): string {
  const horizon = (riskProfile?.investment_horizon || 'long').toLowerCase();
  if (horizon === 'short') return 'kort (1–3 år)';
  if (horizon === 'medium') return 'medellång (3–7 år)';
  return 'lång (7+ år)';
}

function formatCurrency(amount?: number | null): string | null {
  if (!amount || !Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('sv-SE').format(Math.round(amount));
  } catch (_error) {
    return String(Math.round(amount));
  }
}

function buildDefaultNextSteps(riskProfile: any): string[] {
  const monthlyAmount = formatCurrency(riskProfile?.monthly_investment_amount);
  const followUpInterval = (riskProfile?.risk_tolerance || 'moderate').toLowerCase() === 'aggressive' ? 'var tredje månad' : 'var sjätte månad';

  const steps: string[] = [];
  if (monthlyAmount) {
    steps.push(`1. Sätt upp ett automatiskt månadssparande på cirka ${monthlyAmount} SEK in på ditt ISK/KF.`);
  } else {
    steps.push('1. Sätt upp ett automatiskt månadssparande som passar din budget in på ditt ISK/KF.');
  }
  steps.push('2. Köp varje rekommenderat innehav i två till tre delköp under de kommande fyra veckorna för att sprida marknadsrisken.');
  steps.push(`3. Planera in en portföljgenomgång ${followUpInterval} för att säkerställa att allokeringen ligger kvar kring målvikterna.`);
  steps.push('4. Behåll en buffert motsvarande 3–6 månaders utgifter på sparkonto innan du ökar risken ytterligare.');
  return steps;
}

function fallbackActionSummary(riskProfile: any): string {
  const goal = (riskProfile?.investment_goal || 'långsiktig tillväxt').toLowerCase();
  return `Portföljen är utformad för ${goal} med ${describeRiskLevel(riskProfile)} riskprofil och en ${describeHorizon(riskProfile)} sparhorisont. Rekommendationerna tar hänsyn till dina svar och undviker nuvarande innehav.`;
}

function fallbackRiskAlignment(riskProfile: any): string {
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (tolerance === 'conservative') {
    return 'Tyngdpunkten ligger på stabila fonder och kvalitetsbolag med lägre volatilitet för att skydda kapitalet samtidigt som tillväxtpotential finns kvar.';
  }
  if (tolerance === 'aggressive') {
    return 'Portföljen kombinerar basfonder med offensiva tillväxtbolag så att du får högre avkastningspotential men med tillräcklig riskspridning.';
  }
  return 'Mixen av breda indexfonder och selektiva kvalitetsbolag ger en balanserad risk där både stabilitet och tillväxt vägs in.';
}

function determineRiskRole(stock: { sector?: string }, riskProfile: any): string {
  const sector = (stock.sector || '').toLowerCase();
  if (sector.includes('index') || sector.includes('fond')) return 'Bas';
  if (sector.includes('investment')) return 'Stabilitet';
  if (sector.includes('bank')) return 'Kassaflöde';
  if (sector.includes('fastighet')) return 'Inkomst';
  if (sector.includes('tek') || sector.includes('tech')) return 'Tillväxt';
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  return tolerance === 'aggressive' ? 'Tillväxt' : 'Komplettering';
}

function buildSectorRationale(stock: { name: string; sector?: string }, riskProfile: any): string {
  const sector = stock.sector || 'marknaden';
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (sector === 'Indexfond') {
    return 'Bred indexexponering som ger låga avgifter och stabil bas i portföljen.';
  }
  if (sector === 'Investmentbolag') {
    return 'Sprider risk genom en korg av nordiska kvalitetsbolag med bevisad historik.';
  }
  if (sector === 'Bank') {
    return 'Starkt kassaflöde och utdelningar som dämpar svängningar i portföljen.';
  }
  if (sector === 'Fastighet') {
    return 'Ger exponering mot realtillgångar och kompletterar aktiedelen.';
  }
  if (sector === 'Teknik') {
    return tolerance === 'aggressive'
      ? 'Tillför högre tillväxtpotential inom innovativa bolag.'
      : 'Ger kontrollerad tillväxt via etablerade teknikbolag med starka balansräkningar.';
  }
  return `Ger diversifiering inom ${sector.toLowerCase()} och kompletterar helheten.`;
}

function extractStructuredPlan(rawText: string, riskProfile: any): { plan: any | null; recommendedStocks: Array<{ name: string; symbol?: string; allocation: number; sector?: string; reasoning?: string }> } {
  try {
    const sanitized = sanitizeJsonLikeString(rawText);
    if (!sanitized) {
      return { plan: null, recommendedStocks: [] };
    }

    const parsed = JSON.parse(sanitized);
    const planCandidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    if (!planCandidate) {
      return { plan: null, recommendedStocks: [] };
    }

    const assetCandidates = Array.isArray((planCandidate as any).recommended_assets)
      ? (planCandidate as any).recommended_assets
      : Array.isArray((planCandidate as any).recommendations)
        ? (planCandidate as any).recommendations
        : [];

    const normalizedAssets = assetCandidates
      .map((asset: any) => {
        if (!asset) return null;
        const name = asset.name || asset.asset || asset.title;
        if (!name) return null;
        const ticker = asset.ticker || asset.symbol || asset.code || '';
        const allocation = parseAllocationPercent(asset.allocation_percent ?? asset.allocation ?? asset.weight);
        const rationale = asset.rationale || asset.reasoning || asset.analysis || '';
        const riskRole = asset.risk_role || asset.role || '';
        const sector = asset.sector || detectSector(String(name), ticker ? String(ticker) : undefined);
        return {
          planAsset: {
            name: String(name).trim(),
            ticker: ticker ? String(ticker).trim() : '',
            allocation_percent: allocation,
            rationale: rationale ? String(rationale).trim() : buildSectorRationale({ name: String(name).trim(), sector }, riskProfile),
            risk_role: riskRole ? String(riskRole).trim() : determineRiskRole({ sector }, riskProfile)
          },
          stock: {
            name: String(name).trim(),
            symbol: ticker ? String(ticker).trim() : undefined,
            allocation,
            sector,
            reasoning: rationale ? String(rationale).trim() : undefined
          }
        };
      })
      .filter(Boolean) as Array<{ planAsset: any; stock: any }>;

    const recommendedStocks = normalizedAssets.map(item => item.stock);
    ensureSum100(recommendedStocks);

    const plan = {
      action_summary: planCandidate.action_summary || planCandidate.summary || fallbackActionSummary(riskProfile),
      risk_alignment: planCandidate.risk_alignment || planCandidate.risk_analysis || fallbackRiskAlignment(riskProfile),
      next_steps: toStringArray(planCandidate.next_steps || planCandidate.action_plan || planCandidate.implementation_plan || planCandidate.implementation_steps || planCandidate.follow_up || planCandidate.follow_up_steps) || buildDefaultNextSteps(riskProfile),
      recommended_assets: normalizedAssets.map((item, index) => ({
        ...item.planAsset,
        allocation_percent: recommendedStocks[index] ? recommendedStocks[index].allocation : item.planAsset.allocation_percent
      })),
      disclaimer: planCandidate.disclaimer || planCandidate.footer || 'Råden är utbildningsmaterial och ersätter inte personlig rådgivning. Investeringar innebär risk och värdet kan både öka och minska.'
    };

    if (plan.next_steps.length === 0) {
      plan.next_steps = buildDefaultNextSteps(riskProfile);
    }

    return {
      plan,
      recommendedStocks
    };
  } catch (error) {
    console.warn('Failed to parse structured plan JSON:', error);
    return { plan: null, recommendedStocks: [] };
  }
}

function sanitizeJsonLikeString(rawText: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1].trim()) {
    return fencedMatch[1].trim();
  }

  if (trimmed.startsWith('```')) {
    const withoutLeadingFence = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    if (withoutLeadingFence) {
      return withoutLeadingFence;
    }
  }

  const startIndex = trimmed.indexOf('{');
  const endIndex = trimmed.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return trimmed.slice(startIndex, endIndex + 1).trim();
  }

  return trimmed;
}

function buildFallbackPlan(riskProfile: any, stocks: Array<{ name: string; symbol?: string; allocation: number; sector?: string }>, rawText: string): any {
  ensureSum100(stocks);
  const recommended_assets = stocks.map(stock => ({
    name: stock.name,
    ticker: stock.symbol || '',
    allocation_percent: stock.allocation,
    rationale: buildSectorRationale(stock, riskProfile),
    risk_role: determineRiskRole(stock, riskProfile)
  }));

  return {
    action_summary: fallbackActionSummary(riskProfile),
    risk_alignment: fallbackRiskAlignment(riskProfile),
    next_steps: buildDefaultNextSteps(riskProfile),
    recommended_assets,
    disclaimer: 'Råden är utbildningsmaterial och ersätter inte personlig rådgivning. Investeringar innebär risk och värdet kan både öka och minska.',
    raw_model_output: rawText
  };
}

function defaultRecommendations(riskProfile: any): Array<{name: string, symbol?: string, allocation: number, sector?: string}> {
  // Simple defaults tuned by risk tolerance
  const rt = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  let base: Array<{name: string, symbol?: string, allocation: number, sector?: string}> = [
    { name: 'Länsförsäkringar Global Indexnära', allocation: 40, sector: 'Indexfond' },
    { name: 'Spiltan Aktiefond Investmentbolag', allocation: 25, sector: 'Investmentbolag' },
    { name: 'XACT OMXS30', symbol: 'XACT30', allocation: 20, sector: 'Indexfond' },
    { name: 'Handelsbanken A', symbol: 'SHB-A', allocation: 15, sector: 'Bank' },
  ];

  if (rt === 'aggressive') {
    base = [
      { name: 'Länsförsäkringar Global Indexnära', allocation: 30, sector: 'Indexfond' },
      { name: 'Spiltan Aktiefond Investmentbolag', allocation: 25, sector: 'Investmentbolag' },
      { name: 'Swedbank Robur Ny Teknik A', allocation: 20, sector: 'Teknik' },
      { name: 'XACT OMXS30', symbol: 'XACT30', allocation: 15, sector: 'Indexfond' },
      { name: 'Handelsbanken A', symbol: 'SHB-A', allocation: 10, sector: 'Bank' },
    ];
  } else if (rt === 'conservative') {
    base = [
      { name: 'Länsförsäkringar Global Indexnära', allocation: 45, sector: 'Indexfond' },
      { name: 'Spiltan Aktiefond Investmentbolag', allocation: 25, sector: 'Investmentbolag' },
      { name: 'XACT OMXS30', symbol: 'XACT30', allocation: 15, sector: 'Indexfond' },
      { name: 'Handelsbanken A', symbol: 'SHB-A', allocation: 15, sector: 'Bank' },
    ];
  }

  ensureSum100(base);
  return base;
}

