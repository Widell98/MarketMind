
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { riskProfileId, userId } = await req.json();
    
    console.log('Generate portfolio request:', { riskProfileId, userId });

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

    // Call OpenAI API for personalized recommendations
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced system persona for initial portfolio advisor
    let contextInfo = `Du är en licensierad och auktoriserad svensk investeringsrådgivare med över 15 års erfarenhet av att skapa personliga investeringsportföljer. Du arbetar enligt svensk finanslagstiftning och MiFID II-reglerna.

DITT UPPDRAG SOM RÅDGIVARE:
Som din personliga investeringsrådgivare ska jag skapa en skräddarsydd portfölj baserat på din unika situation, mål och riskprofil. Jag kommer att rekommendera konkreta investeringar som är tillgängliga på svenska mäklarplattformar som Avanza och Nordnet.

PORTFÖLJSKAPANDE ENLIGT SVENSKA STANDARDER:
- Skapa en KOMPLETT portfölj med 6-8 specifika investeringar
- Alla rekommendationer MÅSTE ha korrekt ticker/symbol: **Företag (TICKER)**
- Endast investeringar tillgängliga på svenska marknaden
- Balansera mellan svenska aktier, nordiska fonder och globala ETF:er
- Anpassa efter svensk skattelagstiftning (ISK/KF-optimering)

OBLIGATORISK REKOMMENDATIONSFORMAT:
**Exakt företagsnamn (TICKER)**: Professionell analys av varför denna investering är rätt för dig, inklusive fundamental analys, riskbedömning och hur den passar din profil. Rekommenderad allokering: XX%

KONKRETA EXEMPEL PÅ KORREKT FORMAT:
**Investor AB (INVE-B)**: Svenskt investmentbolag med diversifierad portfölj av kvalitetsbolag. Ger dig exponering mot industriföretag och tillväxtbolag med erfaren förvaltning. Historiskt stabila utdelningar. Allokering: 15%

**Spiltan Aktiefond Investmentbolag**: Aktivt förvaltad fond som fokuserar på nordiska investmentbolag. Låg avgift (0,6%) och stark historisk avkastning. Passar din risktolerans perfekt. Allokering: 20%

**XACT OMXS30 (XACT30)**: Svenskt indexföljare som speglar de 30 största bolagen på Stockholmsbörsen. Bred exponering mot svensk storbolagsmarknad med minimal avgift. Allokering: 25%

FÖRBJUDET ATT REKOMMENDERA:
- Allmänna strategier utan specifika investeringar  
- Diversifiering som "rekommendation"
- Generella råd utan konkreta ticker-symboler
- Icke-investerbara koncept eller metoder

KVALITETSKRAV:
- Endast investeringar med verifierbara ticker-symboler
- Variera sektorer baserat på klientens preferenser
- Anpassa risknivå till klientens profil exakt
- Summera allokeringar till exakt 100%
- Unika rekommendationer för varje klient - aldrig standardmallar`;

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

    if (existingSymbols.size > 0) {
      contextInfo += `\n\nNUVARANDE INNEHAV (UNDVIK DESSA I REKOMMENDATIONER):`;
      Array.from(existingSymbols).forEach(symbol => {
        contextInfo += `\n- ${symbol}`;
      });
      
      contextInfo += `\n\nVIKTIGT: Föreslå ALDRIG aktier som användaren redan äger.`;
    }

    // Enhanced system prompt with professional advisor structure
    const systemPrompt = `${contextInfo}

UPPDRAG SOM LICENSIERAD RÅDGIVARE:
Skapa en professionell investeringsanalys och portföljrekommendation enligt svensk rådgivningsstandard.

STRUKTUR FÖR PORTFÖLJREKOMMENDATION:

**1. PROFESSIONELL SAMMANFATTNING**
Kort analys av klientens situation och investeringsprofil

**2. REKOMMENDERAD PORTFÖLJSTRATEGI** 
6-8 specifika investeringar enligt detta OBLIGATORISKA format:
**Exakt företagsnamn (TICKER)**: Professionell investeringsanalys med fundamental bedömning, riskanalys och passform för klientens profil. Rekommenderad allokering: XX%

**3. PORTFÖLJANALYS**
- Sammanlagd riskprofil och förväntad avkastning
- Geografisk och sektoriell diversifiering  
- Avgiftsanalys och skatteeffektivitet

**4. RISKANALYS & STRESSTEST**
- Huvudsakliga risker i portföljen
- Scenario-analys vid marknadsnedgång
- Rekommenderad riskhantering

**5. IMPLEMENTATIONSPLAN**
- Prioriterad köpordning för investeringarna
- Månadsvis implementationsstrategi
- Rebalanserings-rekommendationer

**6. UPPFÖLJNING**
- Rekommenderad granskningsfrekvens
- Nyckeltal att följa upp
- När portföljen bör justeras

VIKTIGA RÅDGIVARKRAV:
- Varje investering MÅSTE ha verifierbar ticker/symbol
- Anpassa efter svensk ISK/KF-lagstiftning
- Motivera varje val utifrån klientens specifika profil
- Totala allokeringen ska vara exakt 100%
- Endast investeringar tillgängliga på svenska plattformar

EXEMPEL PÅ PROFESSIONELL REKOMMENDATION:
**Handelsbanken A (SHB-A)**: Stabil svensk storbank med stark kapitalbas och konservativ riskprofil. Passar din preferens för svenska kvalitetsbolag och ger stadig direktavkastning (~4%). Utmärkt kärninnehav för långsiktigt sparande. Rekommenderad allokering: 12%`;

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

    console.log('Calling OpenAI API with gpt-4o...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      
      // Handle specific quota exceeded error
      if (openAIResponse.status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: 'quota_exceeded',
          message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiRecommendations = openAIData.choices?.[0]?.message?.content;
    
    console.log('OpenAI full response:', JSON.stringify(openAIData, null, 2));
    console.log('AI recommendations received:', aiRecommendations);
    
    if (!aiRecommendations) {
      console.error('No AI recommendations received from OpenAI');
      throw new Error('No AI response received from OpenAI');
    }

    // Parse AI recommendations into structured format
    const recommendedStocks = parseAIRecommendations(aiRecommendations);
    
    console.log('Parsed recommended stocks:', recommendedStocks);

    // Validate that we have actual recommendations
    if (recommendedStocks.length === 0) {
      console.error('No valid recommendations parsed from AI response');
      throw new Error('Failed to generate valid portfolio recommendations');
    }

    // Create portfolio record
    const portfolioData = {
      user_id: userId,
      risk_profile_id: riskProfileId,
      portfolio_name: 'AI-Genererad Portfölj',
      asset_allocation: calculateAssetAllocation(recommendedStocks),
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

    console.log('Returning response with AI recommendations:', aiRecommendations?.substring(0, 200));
    
    return new Response(JSON.stringify({
      success: true,
      portfolio: portfolio,
      aiRecommendations: aiRecommendations,
      aiResponse: aiRecommendations, // Add this for compatibility
      response: aiRecommendations, // Add this for compatibility 
      confidence: calculateConfidence(recommendedStocks, riskProfile),
      recommendedStocks: recommendedStocks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
    
    // Check if it's a quota-related error
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quota_exceeded',
        message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseAIRecommendations(text: string): Array<{name: string, symbol?: string, allocation: number, sector?: string}> {
  const stocks: Array<{name: string, symbol?: string, allocation: number, sector?: string}> = [];
  const lines = text.split('\n');
  
  // Define invalid patterns that should be filtered out (extended list)
  const invalidPatterns = [
    /^(erfarenhet|ålder|investeringsstil|risktolerans|tidshorisont|månatligt)/i,
    /^(diversifiering|rebalansering|skatteoptimering|strategi|optimering)/i,
    /^(riskprofil|investeringsmål|portföljstrategi|allokeringsstrategi)/i,
    /^(metod|teknik|approach|filosofi|princip|analys|situation)/i,
    /^(månadsplan|uppföljning|implementation|risker|möjligheter)/i,
    /^(riskspridning|dollar cost averaging|dca|automatisk)/i,
    /^(pensionssparande|pension|buffert|emergency|sparande)/i,
    /^(skatteeffektivt|avdrag|isk|kapitalförsäkring)/i,
    /^(marknadsanalys|timing|teknisk analys|fundamental)/i,
    /^(växling|byte|ändring|justering|omfördelning)/i
  ];
  
  // Define valid ticker patterns to ensure we only get real investments
  const validTickerPatterns = [
    /^[A-Z]{2,6}(-[A-Z])?$/, // Standard tickers like EVO, SHB-A
    /^XACT/, // XACT ETFs
    /^(AVANZA|SPILTAN|LÄNSFÖRSÄKRINGAR)/, // Valid fund prefixes
    /^[A-Z]+\s*(GLOBAL|SWEDEN|EUROPE|INDEX)$/i // Fund patterns
  ];
  
  for (const line of lines) {
    // Look for pattern: **Name (SYMBOL)**: Description. Allokering: XX%
   const match = line.match(/\*\*([^(]+)\s*\(([^)]+)\)\*\*.*?Allokering[: ]?\s*(\d+)%/i);

    if (match) {
      const name = match[1].trim();
      const symbol = match[2].trim();
      const allocation = parseInt(match[3]);
      
      // Skip if name matches invalid patterns
      const isInvalidName = invalidPatterns.some(pattern => pattern.test(name));
      if (isInvalidName) {
        console.log(`Filtering out invalid recommendation (invalid name): ${name}`);
        continue;
      }
      
      // Skip if symbol doesn't match valid patterns
      const isValidTicker = validTickerPatterns.some(pattern => pattern.test(symbol));
      if (!isValidTicker && !name.toLowerCase().includes('fond') && !name.toLowerCase().includes('index')) {
        console.log(`Filtering out invalid recommendation (invalid ticker): ${name} (${symbol})`);
        continue;
      }
      
      // Skip if allocation is unrealistic
      if (allocation < 1 || allocation > 40) {
        console.log(`Filtering out unrealistic allocation: ${name} (${allocation}%)`);
        continue;
      }
      
      // Skip if name is too generic or strategic
      if (name.length < 3 || /^(strategi|metod|approach|teknik)$/i.test(name)) {
        console.log(`Filtering out generic name: ${name}`);
        continue;
      }
      
      // Determine sector based on name or symbol
      let sector = 'Allmän';
      if (name.toLowerCase().includes('bank') || symbol.includes('SHB')) {
        sector = 'Bank';
      } else if (name.toLowerCase().includes('fastighet') || symbol.includes('CAST')) {
        sector = 'Fastighet';
      } else if (name.toLowerCase().includes('industri') || name.toLowerCase().includes('investor')) {
        sector = 'Investmentbolag';
      } else if (name.toLowerCase().includes('gaming') || name.toLowerCase().includes('evolution')) {
        sector = 'Teknik';
      } else if (name.toLowerCase().includes('global') || name.toLowerCase().includes('world') || name.toLowerCase().includes('index')) {
        sector = 'Indexfond';
      }
      
      stocks.push({
        name,
        symbol,
        allocation,
        sector
      });
    }
  }
  
  console.log(`Parsed ${stocks.length} valid recommendations from AI response`);
  return stocks;
}

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
