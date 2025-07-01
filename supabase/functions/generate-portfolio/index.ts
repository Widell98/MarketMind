
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
    console.log('[GENERATE-PORTFOLIO] Function started - PUBLIC MODE');
    console.log('[GENERATE-PORTFOLIO] Request method:', req.method);

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[GENERATE-PORTFOLIO] Supabase admin client initialized');

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('[GENERATE-PORTFOLIO] Request body:', requestBody);
    } catch (parseError) {
      console.error('[GENERATE-PORTFOLIO] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body format',
          success: false 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { riskProfileId, userId } = requestBody;

    if (!riskProfileId || !userId) {
      console.error('[GENERATE-PORTFOLIO] Missing required parameters:', { riskProfileId, userId });
      return new Response(
        JSON.stringify({ 
          error: 'Risk profile ID and user ID are required',
          success: false 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[GENERATE-PORTFOLIO] Fetching risk profile:', riskProfileId, 'for user:', userId);

    // Fetch risk profile using admin client
    const { data: riskProfile, error: profileError } = await supabaseAdmin
      .from('user_risk_profiles')
      .select('*')
      .eq('id', riskProfileId)
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('[GENERATE-PORTFOLIO] Risk profile error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: `Risk profile not found: ${profileError.message}`,
          success: false 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!riskProfile) {
      console.error('[GENERATE-PORTFOLIO] Risk profile not found for ID:', riskProfileId);
      return new Response(
        JSON.stringify({ 
          error: 'Risk profile not found',
          success: false 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[GENERATE-PORTFOLIO] Found risk profile:', riskProfile.id);

    // Generate portfolio recommendations based on risk profile
    const portfolioData = generatePortfolioRecommendations(riskProfile);
    console.log('[GENERATE-PORTFOLIO] Generated portfolio data:', portfolioData);

    // Deactivate other portfolios for this user first
    const { error: deactivateError } = await supabaseAdmin
      .from('user_portfolios')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (deactivateError) {
      console.error('[GENERATE-PORTFOLIO] Error deactivating old portfolios:', deactivateError);
      // Continue anyway, this is not a critical error
    }

    // Store the generated portfolio using admin client
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('user_portfolios')
      .insert({
        user_id: userId,
        risk_profile_id: riskProfileId,
        portfolio_name: `${riskProfile.risk_tolerance || 'Balanced'} Portfolio`,
        asset_allocation: portfolioData.allocation,
        recommended_stocks: portfolioData.stocks,
        total_value: portfolioData.targetValue,
        expected_return: portfolioData.expectedReturn,
        risk_score: portfolioData.riskScore,
        is_active: true
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('[GENERATE-PORTFOLIO] Portfolio creation error:', portfolioError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create portfolio: ${portfolioError.message}`,
          success: false 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[GENERATE-PORTFOLIO] Portfolio created successfully:', portfolio.id);

    // Generate initial recommendations using admin client
    const recommendations = generateInitialRecommendations(riskProfile, portfolioData);
    console.log('[GENERATE-PORTFOLIO] Generated recommendations:', recommendations.length);
    
    if (recommendations.length > 0) {
      const { error: recError } = await supabaseAdmin
        .from('portfolio_recommendations')
        .insert(
          recommendations.map(rec => ({
            user_id: userId,
            portfolio_id: portfolio.id,
            title: rec.title,
            description: rec.description,
            ai_reasoning: rec.reasoning,
            recommendation_type: 'investment_advice' // Add the required field
          }))
        );

      if (recError) {
        console.error('[GENERATE-PORTFOLIO] Error creating recommendations:', recError);
        // Don't fail the whole operation for this
      }
    }

    console.log('[GENERATE-PORTFOLIO] Portfolio generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        portfolio,
        message: 'Portfolio generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[GENERATE-PORTFOLIO] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: `An unexpected error occurred: ${error.message}`,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generatePortfolioRecommendations(riskProfile: any) {
  const age = riskProfile.age || 35;
  const riskTolerance = riskProfile.risk_tolerance || 'moderate';
  const investmentHorizon = riskProfile.investment_horizon || 'medium';
  const monthlyAmount = riskProfile.monthly_investment_amount || 5000;
  
  // Use the user's preferred stock count from the risk profile
  const preferredStockCount = parseInt(riskProfile.preferred_stock_count) || 8;
  console.log('[GENERATE-PORTFOLIO] Using preferred stock count:', preferredStockCount);
  
  // Calculate target portfolio value (12 months of investment)
  const targetValue = monthlyAmount * 12;
  
  // Asset allocation based on risk profile
  let allocation: any = {};
  let expectedReturn = 0;
  let riskScore = 5;
  
  switch (riskTolerance) {
    case 'conservative':
      allocation = {
        stocks: 30,
        bonds: 50,
        real_estate: 15,
        cash: 5
      };
      expectedReturn = 4.5;
      riskScore = 3;
      break;
    case 'aggressive':
      allocation = {
        stocks: 80,
        bonds: 10,
        real_estate: 5,
        commodities: 5
      };
      expectedReturn = 9.2;
      riskScore = 8;
      break;
    default: // moderate
      allocation = {
        stocks: 60,
        bonds: 25,
        real_estate: 10,
        cash: 5
      };
      expectedReturn = 6.8;
      riskScore = 5;
  }
  
  // Adjust for age (younger = more aggressive)
  if (age < 30) {
    allocation.stocks = Math.min(allocation.stocks + 10, 85);
    allocation.bonds = Math.max(allocation.bonds - 5, 10);
    expectedReturn += 0.5;
    riskScore = Math.min(riskScore + 1, 10);
  } else if (age > 50) {
    allocation.stocks = Math.max(allocation.stocks - 10, 20);
    allocation.bonds = Math.min(allocation.bonds + 10, 60);
    expectedReturn -= 0.5;
    riskScore = Math.max(riskScore - 1, 1);
  }
  
  // Generate stock recommendations based on preferred count and risk tolerance
  const allStocks = {
    conservative: [
      { name: 'Investor AB', symbol: 'INVE-B.ST', sector: 'Financial Services', reasoning: 'Stabil investmentbolag med diversifierad portfölj' },
      { name: 'Volvo AB', symbol: 'VOLV-B.ST', sector: 'Automotive', reasoning: 'Välkänt svenskt industriföretag med stark position' },
      { name: 'Ericsson', symbol: 'ERIC-B.ST', sector: 'Technology', reasoning: 'Ledande telekomteknologi med 5G-potential' },
      { name: 'Sandvik', symbol: 'SAND.ST', sector: 'Industrial', reasoning: 'Stark industriell teknik och verktyg' },
      { name: 'SKF', symbol: 'SKF-B.ST', sector: 'Industrial', reasoning: 'Ledande inom lager och tätningar' },
      { name: 'Telia', symbol: 'TELIA.ST', sector: 'Telecommunications', reasoning: 'Stabil telekomoperatör med utdelning' },
      { name: 'Essity', symbol: 'ESSITY-B.ST', sector: 'Consumer Goods', reasoning: 'Hygien- och hälsoprodukter' },
      { name: 'Getinge', symbol: 'GETI-B.ST', sector: 'Healthcare', reasoning: 'Medicinsk teknik och utrustning' },
      { name: 'SEB', symbol: 'SEB-A.ST', sector: 'Financial Services', reasoning: 'Stark nordisk bank med företagsfokus' },
      { name: 'ICA Gruppen', symbol: 'ICA.ST', sector: 'Consumer Goods', reasoning: 'Stabil dagligvaruhandel i Norden' }
    ],
    moderate: [
      { name: 'Investor AB', symbol: 'INVE-B.ST', sector: 'Financial Services', reasoning: 'Stabil investmentbolag med diversifierad portfölj' },
      { name: 'Atlas Copco', symbol: 'ATCO-A.ST', sector: 'Industrial', reasoning: 'Stark industriell tillväxt och innovation' },
      { name: 'H&M', symbol: 'HM-B.ST', sector: 'Consumer Goods', reasoning: 'Global detaljhandel med omställning till hållbarhet' },
      { name: 'Spotify', symbol: 'SPOT', sector: 'Technology', reasoning: 'Växande musikstreaming-marknad' },
      { name: 'Electrolux', symbol: 'ELUX-B.ST', sector: 'Consumer Goods', reasoning: 'Hushållsapparater och professionella produkter' },
      { name: 'Alfa Laval', symbol: 'ALFA.ST', sector: 'Industrial', reasoning: 'Värmeväxlare och separationsteknik' },
      { name: 'SEB', symbol: 'SEB-A.ST', sector: 'Financial Services', reasoning: 'Stark nordisk bank med företagsfokus' },
      { name: 'Hexagon', symbol: 'HEXA-B.ST', sector: 'Technology', reasoning: 'Mätteknologi och digitala lösningar' },
      { name: 'Assa Abloy', symbol: 'ASSA-B.ST', sector: 'Industrial', reasoning: 'Ledande inom lås- och säkerhetslösningar' },
      { name: 'ICA Gruppen', symbol: 'ICA.ST', sector: 'Consumer Goods', reasoning: 'Stabil dagligvaruhandel i Norden' },
      { name: 'Evolution Gaming', symbol: 'EVO.ST', sector: 'Technology', reasoning: 'Ledande inom online-gaming med stark tillväxt' },
      { name: 'Nibe', symbol: 'NIBE-B.ST', sector: 'Clean Energy', reasoning: 'Värmepumpar och hållbar energi' }
    ],
    aggressive: [
      { name: 'Spotify', symbol: 'SPOT', sector: 'Technology', reasoning: 'Hög tillväxtpotential inom streaming' },
      { name: 'Evolution Gaming', symbol: 'EVO.ST', sector: 'Technology', reasoning: 'Ledande inom online-gaming med stark tillväxt' },
      { name: 'Embracer Group', symbol: 'EMBRAC-B.ST', sector: 'Technology', reasoning: 'Spelstudio med global expansion' },
      { name: 'Sinch', symbol: 'SINCH.ST', sector: 'Technology', reasoning: 'Molnkommunikation och messaging' },
      { name: 'Paradox Interactive', symbol: 'PDX.ST', sector: 'Technology', reasoning: 'Strategispel och digital distribution' },
      { name: 'Tobii', symbol: 'TOBII.ST', sector: 'Technology', reasoning: 'Ögonspårningsteknologi och AI' },
      { name: 'Nibe', symbol: 'NIBE-B.ST', sector: 'Clean Energy', reasoning: 'Värmepumpar och hållbar energi' },
      { name: 'BioGaia', symbol: 'BIOG-B.ST', sector: 'Healthcare', reasoning: 'Probiotika och hälsoprodukter' },
      { name: 'Addtech', symbol: 'ADDT-B.ST', sector: 'Technology', reasoning: 'Industriell teknik och komponenter' },
      { name: 'Epiroc', symbol: 'EPI-A.ST', sector: 'Industrial', reasoning: 'Gruv- och infrastrukturutrustning' },
      { name: 'Atlas Copco', symbol: 'ATCO-A.ST', sector: 'Industrial', reasoning: 'Stark industriell tillväxt och innovation' },
      { name: 'Hexagon', symbol: 'HEXA-B.ST', sector: 'Technology', reasoning: 'Mätteknologi och digitala lösningar' }
    ]
  };
  
  const stockPool = allStocks[riskTolerance as keyof typeof allStocks] || allStocks.moderate;
  
  // Select stocks based on preferred count - ensure we have enough stocks
  let selectedStocks = [];
  const stocksToAllocate = Math.min(preferredStockCount, stockPool.length);
  const baseAllocation = Math.floor(allocation.stocks / stocksToAllocate);
  const remainder = allocation.stocks % stocksToAllocate;
  
  console.log('[GENERATE-PORTFOLIO] Allocating stocks:', stocksToAllocate, 'Base allocation per stock:', baseAllocation);
  
  // Shuffle and select the desired number of stocks
  const shuffledStocks = [...stockPool].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < stocksToAllocate; i++) {
    const stock = shuffledStocks[i];
    let stockAllocation = baseAllocation;
    
    // Distribute remaining allocation to first few stocks
    if (i < remainder) {
      stockAllocation += 1;
    }
    
    selectedStocks.push({
      ...stock,
      allocation: stockAllocation
    });
  }
  
  console.log('[GENERATE-PORTFOLIO] Selected stocks:', selectedStocks.length, 'Total allocation:', selectedStocks.reduce((sum, s) => sum + s.allocation, 0));
  
  return {
    allocation,
    stocks: selectedStocks,
    targetValue,
    expectedReturn,
    riskScore
  };
}

function generateInitialRecommendations(riskProfile: any, portfolioData: any) {
  const recommendations = [];
  
  // Stock count specific recommendation based on user's choice
  const stockCount = parseInt(riskProfile.preferred_stock_count) || 8;
  if (stockCount <= 5) {
    recommendations.push({
      title: 'Koncentrerad Portföljstrategi',
      description: `Du har valt en koncentrerad portfölj med ${stockCount} innehav. Detta ger högre potential men också högre risk då varje investering får större påverkan på totalavkastningen.`,
      reasoning: 'Färre innehav kräver noggrann analys men kan ge bättre avkastning vid rätt val. Viktigt att följa utvecklingen noga.'
    });
  } else if (stockCount >= 20) {
    recommendations.push({
      title: 'Bred Diversifiering',
      description: `Din portfölj med ${stockCount} innehav ger bra riskspridning och stabilitet med mindre volatilitet.`,
      reasoning: 'Många innehav minskar portföljens volatilitet och ger mer stabil utveckling som närmar sig marknadsavkastning.'
    });
  } else {
    recommendations.push({
      title: 'Balanserad Portföljstorlek',
      description: `Med ${stockCount} innehav får du en bra balans mellan fokus och diversifiering.`,
      reasoning: 'Lagom antal innehav som ger möjlighet att följa utvecklingen utan att bli för komplicerat.'
    });
  }
  
  // Age-based recommendation
  if (riskProfile.age && riskProfile.age < 30) {
    recommendations.push({
      title: 'Ung Investerare - Maximal Tillväxt',
      description: 'Som ung investerare kan du ta högre risk för potentiellt högre avkastning. Överväg att öka aktieandelen.',
      reasoning: 'Lång tidshorisont ger möjlighet att återhämta sig från marknadsfluktuationer'
    });
  }
  
  // Monthly investment recommendation
  if (riskProfile.monthly_investment_amount) {
    recommendations.push({
      title: 'Månadssparande Strategi',
      description: `Med ${riskProfile.monthly_investment_amount} SEK/månad kan du bygga en solid portfölj genom dollar-cost averaging.`,
      reasoning: 'Regelbundet sparande minskar volatilitetsrisken över tid'
    });
  }
  
  // Risk-specific recommendation
  if (riskProfile.risk_tolerance === 'conservative') {
    recommendations.push({
      title: 'Stabil Inkomstgenerering',
      description: 'Din konservativa profil passar dividendbetalande aktier och obligationer för stabil inkomst.',
      reasoning: 'Fokus på kapitalbevarande med måttlig tillväxt'
    });
  } else if (riskProfile.risk_tolerance === 'aggressive') {
    recommendations.push({
      title: 'Tillväxtfokuserad Strategi',
      description: 'Din aggressiva profil möjliggör investering i tillväxtaktier och innovativa sektorer.',
      reasoning: 'Högre risk för potentiellt högre långsiktig avkastning'
    });
  }
  
  return recommendations;
}
