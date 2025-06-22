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
    console.log('[GENERATE-PORTFOLIO] Function started');
    console.log('[GENERATE-PORTFOLIO] Request method:', req.method);
    console.log('[GENERATE-PORTFOLIO] Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('[GENERATE-PORTFOLIO] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[GENERATE-PORTFOLIO] No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'Authorization header is required',
          success: false 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[GENERATE-PORTFOLIO] Supabase admin client initialized');

    // Initialize regular client for user operations with auth header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('[GENERATE-PORTFOLIO] Attempting to get user from JWT');

    // Get user from JWT token with better error handling
    let user;
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[GENERATE-PORTFOLIO] Auth error:', userError);
        return new Response(
          JSON.stringify({ 
            error: `Authentication failed: ${userError.message}`,
            success: false 
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!authUser) {
        console.error('[GENERATE-PORTFOLIO] No user found in auth token');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid authentication token - no user found',
            success: false 
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      user = authUser;
      console.log('[GENERATE-PORTFOLIO] User authenticated:', user.id, user.email);
      
    } catch (authError) {
      console.error('[GENERATE-PORTFOLIO] Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          error: `Authentication failed: ${authError.message}`,
          success: false 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    if (!riskProfileId) {
      console.error('[GENERATE-PORTFOLIO] Missing riskProfileId');
      return new Response(
        JSON.stringify({ 
          error: 'Risk profile ID is required',
          success: false 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user ID matches (extra security)
    if (userId && userId !== user.id) {
      console.error('[GENERATE-PORTFOLIO] User ID mismatch:', { tokenUserId: user.id, requestUserId: userId });
      return new Response(
        JSON.stringify({ 
          error: 'User ID mismatch - access denied',
          success: false 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[GENERATE-PORTFOLIO] Fetching risk profile:', riskProfileId, 'for user:', user.id);

    // Fetch risk profile using admin client
    const { data: riskProfile, error: profileError } = await supabaseAdmin
      .from('user_risk_profiles')
      .select('*')
      .eq('id', riskProfileId)
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

    if (deactivateError) {
      console.error('[GENERATE-PORTFOLIO] Error deactivating old portfolios:', deactivateError);
      // Continue anyway, this is not a critical error
    }

    // Store the generated portfolio using admin client
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('user_portfolios')
      .insert({
        user_id: user.id,
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
            user_id: user.id,
            portfolio_id: portfolio.id,
            title: rec.title,
            description: rec.description,
            ai_reasoning: rec.reasoning
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
  
  // Generate stock recommendations
  const stockPools = {
    conservative: [
      { name: 'Investor AB', symbol: 'INVE-B.ST', sector: 'Financial Services', allocation: 8, reasoning: 'Stabil investmentbolag med diversifierad portfölj' },
      { name: 'Volvo AB', symbol: 'VOLV-B.ST', sector: 'Automotive', allocation: 7, reasoning: 'Välkänt svenskt industriföretag med stark position' },
      { name: 'Ericsson', symbol: 'ERIC-B.ST', sector: 'Technology', allocation: 6, reasoning: 'Ledande telekomteknologi med 5G-potential' }
    ],
    moderate: [
      { name: 'Investor AB', symbol: 'INVE-B.ST', sector: 'Financial Services', allocation: 10, reasoning: 'Stabil investmentbolag med diversifierad portfölj' },
      { name: 'Atlas Copco', symbol: 'ATCO-A.ST', sector: 'Industrial', allocation: 8, reasoning: 'Stark industriell tillväxt och innovation' },
      { name: 'H&M', symbol: 'HM-B.ST', sector: 'Consumer Goods', allocation: 7, reasoning: 'Global detaljhandel med omställning till hållbarhet' },
      { name: 'Spotify', symbol: 'SPOT', sector: 'Technology', allocation: 9, reasoning: 'Växande musikstreaming-marknad' }
    ],
    aggressive: [
      { name: 'Spotify', symbol: 'SPOT', sector: 'Technology', allocation: 15, reasoning: 'Hög tillväxtpotential inom streaming' },
      { name: 'Evolution Gaming', symbol: 'EVO.ST', sector: 'Technology', allocation: 12, reasoning: 'Ledande inom online-gaming med stark tillväxt' },
      { name: 'Klarna Bank', symbol: 'Private', sector: 'Financial Technology', allocation: 10, reasoning: 'Fintech-innovation med global expansion' },
      { name: 'Northvolt', symbol: 'Private', sector: 'Clean Energy', allocation: 8, reasoning: 'Batteriteknologi för den gröna omställningen' }
    ]
  };
  
  const selectedStocks = stockPools[riskTolerance as keyof typeof stockPools] || stockPools.moderate;
  
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
