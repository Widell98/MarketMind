
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

    // Call OpenAI API for personalized recommendations
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Du är en expertinvesteringsrådgivare som skapar portföljer för svenska investerare. 

KRITISKT VIKTIGT: Du ska ENDAST rekommendera RIKTIGA aktier, fonder och ETF:er som handlas på svenska marknader (Nasdaq Stockholm, Spotlight, etc.). 

FÖRBJUDET: Inkludera ALDRIG följande som investeringsrekommendationer:
- Riskprofildata (ålder, erfarenhet: risktolerans, tidshorisont, etc.)
- Strategier eller koncept (diversifiering, rebalansering, etc.)
- Personlig information
- Investeringsfilosofi eller metoder

INSTRUKTIONER:
1. Analysera användarens riskprofil noggrant
2. Rekommendera ENDAST riktiga finansiella instrument
3. Använd EXAKT detta format för varje rekommendation:
   **Företagsnamn (SYMBOL)**: Beskrivning. Allokering: XX%

EXEMPEL PÅ KORREKTA REKOMMENDATIONER:
- **Investor AB (INVE-B)**: Beskrivning. Allokering: 25%
- **Handelsbanken A (SHB-A)**: Beskrivning. Allokering: 20%
- **XACT Utdelning (XACTUTD)**: Beskrivning. Allokering: 15%

Skapa en portfölj med 5-8 riktiga investeringar som summerar till 100% allokering.`;

    const userMessage = `Skapa en portfölj baserat på denna riskprofil:

Ålder: ${riskProfile.age || 'Ej angiven'}
Årsinkomst: ${riskProfile.annual_income || 'Ej angiven'} SEK
Månatligt investeringsbelopp: ${riskProfile.monthly_investment_amount || 'Ej angiven'} SEK
Risktolerans: ${riskProfile.risk_tolerance || 'Medel'}
Investeringsmål: ${riskProfile.investment_goal || 'Långsiktig tillväxt'}
Tidshorisont: ${riskProfile.investment_horizon || 'Lång'}
Erfarenhet: ${riskProfile.investment_experience || 'Medel'}
Sektorintressen: ${JSON.stringify(riskProfile.sector_interests || [])}
Nuvarande portföljvärde: ${riskProfile.current_portfolio_value || 0} SEK

Skapa en personlig portfölj med ENDAST riktiga aktier och fonder tillgängliga på svenska marknader.`;

    console.log('Calling OpenAI API...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiRecommendations = openAIData.choices[0].message.content;
    
    console.log('AI recommendations received:', aiRecommendations);

    // Parse AI recommendations into structured format
    const recommendedStocks = parseAIRecommendations(aiRecommendations);
    
    console.log('Parsed recommended stocks:', recommendedStocks);

    // Create portfolio record
    const portfolioData = {
      user_id: userId,
      risk_profile_id: riskProfileId,
      portfolio_name: 'AI-Genererad Portfölj',
      asset_allocation: {
        stocks: 70,
        bonds: 20,
        cash: 10
      },
      recommended_stocks: recommendedStocks,
      total_value: riskProfile.current_portfolio_value || 0,
      expected_return: calculateExpectedReturn(recommendedStocks),
      risk_score: calculateRiskScore(riskProfile.risk_tolerance),
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

    return new Response(JSON.stringify({
      success: true,
      portfolio: portfolio,
      aiRecommendations: aiRecommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
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
  
  // Define invalid patterns that should be filtered out
  const invalidPatterns = [
    /^(erfarenhet|ålder|investeringsstil|risktolerans|tidshorisont|månatligt)/i,
    /^(diversifiering|rebalansering|skatteoptimering|strategi|optimering)/i,
    /^(riskprofil|investeringsmål|portföljstrategi|allokeringsstrategi)/i,
    /^(metod|teknik|approach|filosofi|princip)/i
  ];
  
  for (const line of lines) {
    // Look for pattern: **Name (SYMBOL)**: Description. Allokering: XX%
    const match = line.match(/\*\*([^(]+)\s*\(([^)]+)\)\*\*:.*?Allokering:\s*(\d+)%/i);
    if (match) {
      const name = match[1].trim();
      const symbol = match[2].trim();
      const allocation = parseInt(match[3]);
      
      // Skip if it matches invalid patterns
      const isInvalid = invalidPatterns.some(pattern => pattern.test(name));
      if (isInvalid) {
        console.log(`Filtering out invalid recommendation: ${name}`);
        continue;
      }
      
      // Determine sector based on name or symbol
      let sector = 'Allmän';
      if (name.toLowerCase().includes('bank') || symbol.includes('SHB')) {
        sector = 'Bank';
      } else if (name.toLowerCase().includes('fastighet') || symbol.includes('CAST')) {
        sector = 'Fastighet';
      } else if (name.toLowerCase().includes('industri') || symbol.includes('INDU')) {
        sector = 'Investmentbolag';
      }
      
      stocks.push({
        name,
        symbol,
        allocation,
        sector
      });
    }
  }
  
  // If no valid stocks found, provide fallback recommendations
  if (stocks.length === 0) {
    console.log('No valid stocks parsed, using fallback recommendations');
    return [
      { name: 'Investor AB', symbol: 'INVE-B', allocation: 25, sector: 'Investmentbolag' },
      { name: 'Handelsbanken A', symbol: 'SHB-A', allocation: 20, sector: 'Bank' },
      { name: 'Volvo B', symbol: 'VOLV-B', allocation: 20, sector: 'Industri' },
      { name: 'XACT OMXS30', symbol: 'XACT', allocation: 20, sector: 'Allmän' },
      { name: 'Castellum', symbol: 'CAST', allocation: 15, sector: 'Fastighet' }
    ];
  }
  
  return stocks;
}

function calculateExpectedReturn(stocks: Array<{allocation: number}>): number {
  // Simple calculation based on stock allocation
  return stocks.reduce((sum, stock) => sum + (stock.allocation * 0.08), 0) / 100;
}

function calculateRiskScore(riskTolerance: string): number {
  const riskMap: {[key: string]: number} = {
    'conservative': 3,
    'moderate': 5,
    'aggressive': 8
  };
  return riskMap[riskTolerance] || 5;
}
