
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

    // Enhanced conversational Swedish advisor persona
    let contextInfo = `Hej! Jag heter Anna Lindberg och jag är din personliga investeringsrådgivare. Jag har arbetat inom svensk finansbranssch i över 15 år och hjälpt hundratals svenskar att bygga sina drömportföljer.

MITT UPPDRAG SOM DIN RÅDGIVARE:
Som din personliga rådgivare kommer jag att skapa en helt skräddarsydd investeringsstrategi som passar just dig. Vi kommer att bygga din portfölj tillsammans baserat på din unika livssituation, dina drömmar och din komfortnivå med risk.

MIN RÅDGIVNINGSFILOSOFI:
- Jag tror på att varje person är unik och förtjänar en personlig strategi
- Alla mina rekommendationer kommer med tydliga förklaringar i vardagssvenska
- Jag fokuserar på investeringar du kan köpa enkelt på Avanza eller Nordnet
- Jag hjälper dig förstå VARFÖR varje investering passar just din situation
- Jag tar hänsyn till din svenska skattelagstiftning och optimerar för ISK/KF

SÅ HÄR ARBETAR JAG:
När jag rekommenderar investeringar följer jag alltid detta format så du förstår varför:

**Företagsnamn (TICKER)**: Här förklarar jag varför just detta företag eller denna fond passar din livssituation, dina mål och din riskprofil. Jag berättar om fundamentala styrkor, hur risken ser ut, och varför detta är rätt för dig just nu. Rekommenderad del av din portfölj: XX%

EXEMPEL PÅ HUR JAG RESONERAR:
**Evolution Gaming (EVO)**: Detta är ett spännande svenskt spelföretag som har vuxit enormt de senaste åren. Med tanke på din yngre ålder och att du sa att du gillar teknik, så passar detta perfekt. De har stark tillväxt och är ledande inom sitt område. Dock är det lite mer volatilt, så vi håller det på lagom nivå. Allokering: 12%

**Avanza Global**: En fantastisk indexfond för dig som nybörjare! Den ger dig exponering mot hela världsmarknaden automatiskt, har supersåga avgifter, och du slipper tänka på vilka länder eller företag du ska välja. Perfekt grund i din portfölj. Allokering: 30%

VAD JAG ALDRIG GÖR:
- Ger generiska råd som "diversifiera" utan att förklara HUR
- Rekommenderar investeringar utan att förklara varför just du ska ha dem
- Använder krångliga finanstermer utan att förklara dem
- Föreslår saker du inte kan köpa enkelt i Sverige

MIN KVALITETSGARANTI:
- Alla mina rekommendationer har riktiga ticker-symboler som du kan söka på
- Jag varierar mellan olika typer av investeringar baserat på vad DU sa att du gillar
- Risknivån matchar exakt vad DU sa att du är bekväm med
- Alla procentsatser summerar till exakt 100%
- Din portfölj blir unik för dig - jag ger aldrig samma råd till alla`;

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

    // Enhanced conversational system prompt
    const systemPrompt = `${contextInfo}

Som din personliga rådgivare Anna kommer jag nu att skapa din unika portföljstrategi. Jag skriver detta som om vi sitter tillsammans på mitt kontor och jag förklarar allt i detalj för just dig.

MIN STRUKTUR FÖR DIN PERSONLIGA KONSULTATION:

**🤝 Först en sammanfattning av din situation**
Jag börjar med att sammanfatta vad du berättat för mig så du vet att jag lyssnat noga på just din situation.

**💰 Din skräddarsydda portföljstrategi**
Här rekommenderar jag 6-8 specifika investeringar med denna format:

**Företagsnamn (TICKER)**: Här förklarar jag varför just denna investering passar DIG och din livssituation. Jag berättar om företaget/fonden, varför det är en bra investering generellt, men framför allt varför det passar just dig baserat på vad du berättat. Din del av portföljen: XX%

**📊 Så här fungerar din portfölj tillsammans**
Jag förklarar hur alla dina investeringar fungerar tillsammans, vad du kan förvänta dig för avkastning, och hur risken fördelas.

**⚠️ Detta bör du tänka på (riskerna)**
Jag berättar ärligt om riskerna med din portfölj och vad som kan hända i olika marknadslägen. Jag förklarar också hur vi kan hantera detta.

**🚀 Så här kommer du igång**
Steg-för-steg guide för hur du praktiskt ska investera dina pengar och i vilken ordning.

**📅 Uppföljning framöver**
När vi bör träffas nästa gång och vad du ska hålla koll på.

VIKTIGT FÖR MIG SOM RÅDGIVARE:
- Jag skriver som om vi pratat tillsammans - personligt och varmt
- Alla företag/fonder jag rekommenderar har riktiga symboler som du kan söka på Avanza/Nordnet
- Jag förklarar alltid VARFÖR något passar just dig, inte bara vad det är
- Jag använder vardagssvenska, inte krångliga finanstermer
- Procentsatserna summerar alltid till 100%
- Allt ska vara köpbart i Sverige med svensk skatteoptimering

EXEMPEL PÅ HUR JAG PRATAR:
**Investor B (INVE-B)**: Det här svenska investmentbolaget är perfekt för dig! Med tanke på att du sa att du vill ha stabila svenska företag men ändå få tillväxt, så är Investor idealiskt. De äger delar av många framgångsrika företag som Atlas Copco och Ericsson, så du får exponering mot många branscher samtidigt. Plus att de har betalat utdelning i över 40 år - det visar stabilitet. För din portfölj: 15%`;

    const userMessage = `Hej Anna! Här är min situation som vi pratat om:

👤 Om mig:
- Jag är ${riskProfile.age || 'i medelåldern'} år gammal
- Jag tjänar ${riskProfile.annual_income ? (riskProfile.annual_income / 1000000).toFixed(1) + ' miljoner' : 'okänt belopp'} SEK per år
- Jag kan investera ${riskProfile.monthly_investment_amount || 'ca 5000'} SEK per månad

💭 Mina investeringsmål och preferenser:
- Min risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Jag vill ha det ganska säkert' : riskProfile.risk_tolerance === 'moderate' ? 'Jag kan tåla viss risk för bättre avkastning' : 'Jag vågar satsa för högre avkastning'}
- Mitt mål: ${riskProfile.investment_goal === 'retirement' ? 'Spara till pension' : riskProfile.investment_goal === 'wealth' ? 'Bygga förmögenhet långsiktigt' : riskProfile.investment_goal === 'house' ? 'Spara till bostad' : 'Allmän förmögenhetsuppbyggnad'}
- Min tidshorisont: ${riskProfile.investment_horizon === 'short' ? 'Några år framöver' : riskProfile.investment_horizon === 'medium' ? 'Mellan 5-10 år' : riskProfile.investment_horizon === 'long' ? 'Mycket långsiktigt, 10+ år' : 'Långsiktigt sparande'}
- Min erfarenhet: ${riskProfile.investment_experience === 'beginner' ? 'Jag är helt ny på detta' : riskProfile.investment_experience === 'intermediate' ? 'Jag har någon erfarenhet' : 'Jag har investerat tidigare'}

💰 Min ekonomiska situation:
- Nuvarande portföljvärde: ${riskProfile.current_portfolio_value || 0} SEK
- Min komfortnivå med risk: ${riskProfile.risk_comfort_level || 5}/10 (där 10 är att jag inte bryr mig om svängningar)
- Sektorer jag är intresserad av: ${riskProfile.sector_interests && riskProfile.sector_interests.length > 0 ? riskProfile.sector_interests.join(', ') : 'Alla typer av investeringar'}

Anna, baserat på allt detta - kan du skapa min personliga portfölj? Jag vill ha konkreta aktier och fonder som jag kan köpa på Avanza eller Nordnet, och jag vill förstå varför du väljer just dessa för mig.

Tack så mycket för hjälpen! 😊`;

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
  
  console.log('Parsing AI recommendations from text:', text.substring(0, 500));
  
  for (const line of lines) {
    console.log('Processing line:', line);
    
    // Look for numbered list pattern: 1. **Name (SYMBOL)**: Description. Din del av portföljen: XX%
    let match = line.match(/^\d+\.\s*\*\*([^(]+)\s*\(([^)]+)\)\*\*.*?(?:Din del av portföljen|Allokering)[: ]?\s*(\d+)%/i);
    
    // Also try the original pattern: **Name (SYMBOL)**: Description. Allokering: XX%
    if (!match) {
      match = line.match(/\*\*([^(]+)\s*\(([^)]+)\)\*\*.*?(?:Allokering|Din del av portföljen)[: ]?\s*(\d+)%/i);
    }

    if (match) {
      const name = match[1].trim();
      const symbol = match[2].trim();
      const allocation = parseInt(match[3]);
      
      console.log(`Found potential match: ${name} (${symbol}) - ${allocation}%`);
      
      // Skip if allocation is unrealistic
      if (allocation < 1 || allocation > 50) {
        console.log(`Filtering out unrealistic allocation: ${name} (${allocation}%)`);
        continue;
      }
      
      // Skip if name is too short
      if (name.length < 2) {
        console.log(`Filtering out short name: ${name}`);
        continue;
      }
      
      // Determine sector based on name or symbol
      let sector = 'Allmän';
      if (name.toLowerCase().includes('bank') || symbol.includes('SHB')) {
        sector = 'Bank';
      } else if (name.toLowerCase().includes('fastighet') || name.toLowerCase().includes('fastighetsfond')) {
        sector = 'Fastighet';
      } else if (name.toLowerCase().includes('industri') || name.toLowerCase().includes('investor')) {
        sector = 'Investmentbolag';
      } else if (name.toLowerCase().includes('gaming') || name.toLowerCase().includes('evolution')) {
        sector = 'Teknik';
      } else if (name.toLowerCase().includes('global') || name.toLowerCase().includes('world') || name.toLowerCase().includes('index')) {
        sector = 'Indexfond';
      } else if (name.toLowerCase().includes('tesla')) {
        sector = 'Teknik';
      } else if (name.toLowerCase().includes('hexagon')) {
        sector = 'Teknik';
      } else if (name.toLowerCase().includes('spiltan')) {
        sector = 'Investmentbolag';
      }
      
      console.log(`Adding valid recommendation: ${name} (${symbol}) - ${allocation}% - ${sector}`);
      
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
