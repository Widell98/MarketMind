
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

    // Enhanced system prompt with professional advisor structure
    const systemPrompt = `${contextInfo}

UPPDRAG SOM LICENSIERAD RÅDGIVARE:
Skapa en professionell investeringsanalys och portföljrekommendation enligt svensk rådgivningsstandard.

STRUKTUR FÖR PORTFÖLJREKOMMENDATION:

**1. PROFESSIONELL SAMMANFATTNING**
- Inled med 2–3 meningar som fångar klientens mål, riskprofil och tidshorisont
- Följ upp med en kompakt punktlista som sammanfattar risknivå, investeringshorisont, månadsbudget och eventuella fokusområden (t.ex. hållbarhet)

**2. REKOMMENDERAD PORTFÖLJSTRATEGI** 
6-8 specifika investeringar enligt detta OBLIGATORISKA format:
**Exakt företagsnamn (TICKER)**: Professionell investeringsanalys med fundamental bedömning, riskanalys och passform för klientens profil. Rekommenderad allokering: XX%

**3. PORTFÖLJANALYS**
- Ange sammanlagd risknivå och förväntat avkastningsintervall i procent
- Beskriv geografisk och sektoriell diversifiering med fokus på hur den kopplar till klientens mål
- Kommentera avgifter/kostnader och hur portföljen är optimerad för ISK/KF

**4. RISKANALYS & STRESSTEST**
- Identifiera de mest relevanta riskerna utifrån klientens profil
- Beskriv minst två scenarier (t.ex. -15% och -30%) och hur portföljen förväntas reagera
- Ge konkreta riskhanteringsåtgärder och skydd

**5. IMPLEMENTATIONSPLAN**
- Presentera en tidslinje (0–30 dagar, 30–90 dagar, >90 dagar) med tydlig köpordning
- Beskriv hur månadsspar och eventuella engångsköp kan automatiseras
- Rekommendera rebalanseringsregler och triggers

**6. UPPFÖLJNING**
- Ange rekommenderad uppföljningsfrekvens och vem som bör involveras
- Lista nyckeltal att bevaka (t.ex. totalavkastning, risknivå, sparkvot)
- Beskriv tydliga signaler för när portföljen ska justeras

**7. PERSONLIG SPARREKOMMENDATION**
- Ge 3–5 konkreta steg inklusive föreslaget månadsbelopp och automatiseringsförslag
- Tipsa om beteenden eller vanor som stärker spardisciplinen
- Avsluta med en motiverande handlingsuppmaning kopplad till klientens mål

**AVSLUTNING**
- Ställ en tydlig, öppen fråga på en egen rad som bjuder in till fortsatt dialog
- Skriv därefter på nästa rad med fet markerad text som börjar med **Disclaimer:** följt av ett kort juridiskt förbehåll på svenska

VIKTIGA RÅDGIVARKRAV:
- Varje investering MÅSTE ha verifierbar ticker/symbol
- Anpassa efter svensk ISK/KF-lagstiftning
- Motivera varje val utifrån klientens specifika profil och AI-minnen
- Totala allokeringen ska vara exakt 100%
- Endast investeringar tillgängliga på svenska plattformar
- Svar ska vara UNIKT för denna användare; återanvänd inte mallar eller standardsvar

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
        temperature: 0.85,
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
    let recommendedStocks = parseAIRecommendations(aiRecommendations);
    
    console.log('Parsed recommended stocks:', recommendedStocks);

    // Validate that we have actual recommendations
    if (recommendedStocks.length === 0) {
      console.error('No valid recommendations parsed from AI response');
      console.log('Attempting fallback extraction from headings...');
      const fallback = fallbackFromHeadings(aiRecommendations);
      if (fallback.length > 0) {
        recommendedStocks = fallback;
        console.log('Fallback extraction produced recommendations:', recommendedStocks);
      }
    }

    if (recommendedStocks.length === 0) {
      console.error('Fallback parsing also returned 0 items. Using safe defaults based on risk profile');
      recommendedStocks = defaultRecommendations(riskProfile);
      console.log('Default recommendations applied:', recommendedStocks);
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
  const lines = text.split('\n').map(l => l.trim());

  const isBlank = (s: string) => !s || /^\s*$/.test(s);

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

  const tickerPatterns: RegExp[] = [
    /^[A-Z0-9]{1,8}([-.][A-Z0-9]{1,4})?$/,
    /^XACT[A-Z0-9-]*$/i,
    /^(SPILTAN|LÄNSFÖRSÄKRINGAR|LAN(S|S)FÖRSÄKRINGAR|AVANZA|SEB|HANDELSBANKEN)/i
  ];
  const isValidTicker = (sym?: string) => !!sym && tickerPatterns.some(p => p.test(sym.trim().toUpperCase()));

  const inferSector = (name: string, symbol?: string) => {
    const n = name.toLowerCase();
    const s = (symbol || '').toUpperCase();
    if (n.includes('bank') || /SHB|SEB|NDA/.test(s)) return 'Bank';
    if (n.includes('fastighet') || /CAST/.test(s)) return 'Fastighet';
    if (n.includes('investor') || n.includes('investment')) return 'Investmentbolag';
    if (n.includes('global') || n.includes('world') || n.includes('index')) return 'Indexfond';
    if (n.includes('tech') || n.includes('teknik') || /NVDA|AAPL|MSFT/.test(s)) return 'Teknik';
    return 'Allmän';
  };

  const seen = new Set<string>();
  const pushItem = (name: string, symbol: string | undefined, allocation: number) => {
    if (!name || allocation <= 0 || allocation > 100) return;
    if (invalidPatterns.some(p => p.test(name))) return;
    if (name.length < 2) return;

    if (symbol && !isValidTicker(symbol)) {
      const lower = name.toLowerCase();
      const looksLikeFund = lower.includes('fond') || lower.includes('etf');
      if (!looksLikeFund) return;
      symbol = undefined;
    }

    const key = `${name.toLowerCase()}|${(symbol || '').toUpperCase()}`;
    if (seen.has(key)) return;
    seen.add(key);

    stocks.push({
      name: name.trim(),
      symbol: symbol?.trim(),
      allocation: Math.round(allocation),
      sector: inferSector(name, symbol)
    });
  };

  for (const line of lines) {
    if (isBlank(line)) continue;
    const inline = line.match(/\*\*?\s*([^(\n]+?)\s*\(([^)]+)\)\s*\*\*?.*?(Rekommenderad\s+allokering|Allokering)[:\s]*([0-9]{1,3})%/i);
    if (inline) {
      const name = inline[1].trim();
      const symbol = inline[2].trim();
      const allocation = parseInt(inline[5], 10);
      pushItem(name, symbol, allocation);
    }
  }

  let currentName: string | undefined;
  let currentSymbol: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBlank(line)) continue;

    const header = line.match(/^#{2,4}\s*([^#(]+?)\s*\(([^)]+)\)\s*$/);
    if (header) {
      currentName = header[1].trim();
      currentSymbol = header[2].trim();
      continue;
    }

    const headerNoTicker = line.match(/^#{2,4}\s*([^#(]+?)\s*$/);
    if (headerNoTicker) {
      currentName = headerNoTicker[1].trim();
      currentSymbol = undefined;
      continue;
    }

    const alloc = line.match(/(?:^|[-*]\s*)(?:\*\*)?(Rekommenderad\s+allokering|Allokering)(?:\*\*)?[:：]?\s*([0-9]{1,3})%/i);
    if (alloc && currentName) {
      const allocation = parseInt(alloc[2], 10);
      pushItem(currentName, currentSymbol, allocation);
      currentName = undefined;
      currentSymbol = undefined;
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

// --- Fallback helpers to guarantee a usable response ---
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

function ensureSum100(items: Array<{ allocation: number }>) {
  // Round allocations and fix total to 100
  let total = items.reduce((acc, it) => acc + Math.round(it.allocation), 0);
  items.forEach(it => (it.allocation = Math.round(it.allocation)));
  const diff = 100 - total;
  if (items.length > 0 && diff !== 0) {
    items[items.length - 1].allocation = Math.max(0, items[items.length - 1].allocation + diff);
  }
}

function fallbackFromHeadings(text: string): Array<{name: string, symbol?: string, allocation: number, sector?: string}> {
  const results: Array<{name: string, symbol?: string, allocation: number, sector?: string}> = [];
  const headingRegex = /^#{2,4}\s*([^#\n]+?)(?:\s*\(([^)]+)\))?\s*$/gmi;
  const allocRegex = /(Rekommenderad\s+allokering|Allokering)\s*[:：]?\s*([0-9]{1,3})\s*%/i;

  const lines = text.split('\n');
  let currentIndex: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const h = headingRegex.exec(line);
    // Reset lastIndex for global regex to allow line-by-line check
    headingRegex.lastIndex = 0;
    if (h) {
      const name = h[1].trim();
      const symbol = h[2]?.trim();
      results.push({ name, symbol, allocation: 0, sector: detectSector(name, symbol) });
      currentIndex = results.length - 1;
      continue;
    }

    if (currentIndex != null) {
      const a = line.match(allocRegex);
      if (a) {
        const pct = Math.min(100, Math.max(0, parseInt(a[2], 10)));
        results[currentIndex].allocation = pct;
        currentIndex = null; // move on to next block
      }
    }
  }

  // If some items have no allocation, spread remaining equally
  const assigned = results.reduce((sum, r) => sum + (r.allocation || 0), 0);
  const unallocated = Math.max(0, 100 - assigned);
  const noAlloc = results.filter(r => !r.allocation);
  if (noAlloc.length > 0) {
    const each = Math.floor(unallocated / noAlloc.length) || (results.length ? Math.floor(100 / results.length) : 0);
    noAlloc.forEach(r => (r.allocation = each));
  }
  ensureSum100(results);

  // Keep 6-8 items max
  return results.filter(r => r.name && r.allocation > 0).slice(0, 8);
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

