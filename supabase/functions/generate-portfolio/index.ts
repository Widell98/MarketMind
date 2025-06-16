
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Local portfolio generation logic
const generateLocalPortfolio = (riskProfile: any) => {
  // Determine base allocation based on risk tolerance
  let baseAllocation: any;
  let expectedReturn: number;
  let riskScore: number;

  switch (riskProfile.risk_tolerance) {
    case 'conservative':
      baseAllocation = { stocks: 30, bonds: 50, real_estate: 10, cash: 10 };
      expectedReturn = 4.5;
      riskScore = 3;
      break;
    case 'aggressive':
      baseAllocation = { stocks: 80, bonds: 10, real_estate: 5, cash: 5 };
      expectedReturn = 9.2;
      riskScore = 8;
      break;
    default: // moderate
      baseAllocation = { stocks: 60, bonds: 25, real_estate: 10, cash: 5 };
      expectedReturn = 6.8;
      riskScore = 5;
      break;
  }

  // Adjust for age (younger = more aggressive)
  if (riskProfile.age && riskProfile.age < 35) {
    baseAllocation.stocks += 10;
    baseAllocation.bonds -= 5;
    baseAllocation.cash -= 5;
    expectedReturn += 0.8;
    riskScore += 1;
  } else if (riskProfile.age && riskProfile.age > 50) {
    baseAllocation.stocks -= 10;
    baseAllocation.bonds += 8;
    baseAllocation.cash += 2;
    expectedReturn -= 0.6;
    riskScore -= 1;
  }

  // Adjust for investment horizon
  if (riskProfile.investment_horizon === 'short') {
    baseAllocation.stocks -= 15;
    baseAllocation.bonds += 10;
    baseAllocation.cash += 5;
    expectedReturn -= 1.2;
    riskScore -= 2;
  } else if (riskProfile.investment_horizon === 'long') {
    baseAllocation.stocks += 10;
    baseAllocation.bonds -= 8;
    baseAllocation.real_estate += 3;
    baseAllocation.cash -= 5;
    expectedReturn += 1.0;
    riskScore += 1;
  }

  // Ensure allocations are within bounds and sum to 100
  baseAllocation.stocks = Math.max(20, Math.min(85, baseAllocation.stocks));
  baseAllocation.bonds = Math.max(5, Math.min(60, baseAllocation.bonds));
  baseAllocation.real_estate = Math.max(0, Math.min(20, baseAllocation.real_estate));
  baseAllocation.cash = Math.max(2, Math.min(20, baseAllocation.cash));

  // Normalize to 100%
  const total = Object.values(baseAllocation).reduce((sum: number, val: any) => sum + val, 0);
  Object.keys(baseAllocation).forEach(key => {
    baseAllocation[key] = Math.round((baseAllocation[key] / total) * 100);
  });

  // Generate stock recommendations
  const availableStocks: any = {
    Technology: [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' }
    ],
    Healthcare: [
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'PFE', name: 'Pfizer Inc.' },
      { symbol: 'UNH', name: 'UnitedHealth Group' }
    ],
    Financial: [
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'BAC', name: 'Bank of America Corp.' }
    ],
    Consumer: [
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' }
    ]
  };

  const recommendedStocks: any[] = [];
  const sectorInterests = riskProfile.sector_interests || [];
  
  // Add sector-based recommendations
  if (sectorInterests.length > 0) {
    sectorInterests.forEach((sector: string) => {
      const stocks = availableStocks[sector];
      if (stocks && stocks.length > 0) {
        const stock = stocks[0];
        recommendedStocks.push({
          symbol: stock.symbol,
          name: stock.name,
          sector: sector,
          allocation: Math.round((baseAllocation.stocks / sectorInterests.length) * 0.6)
        });
      }
    });
  }

  // Add diversified ETFs
  const remainingAllocation = baseAllocation.stocks - recommendedStocks.reduce((sum, stock) => sum + stock.allocation, 0);
  if (remainingAllocation > 0) {
    recommendedStocks.push({
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      sector: 'ETF',
      allocation: remainingAllocation
    });
  }

  const reasoning = `Based on your ${riskProfile.risk_tolerance} risk profile, I've created a portfolio with ${baseAllocation.stocks}% stocks, ${baseAllocation.bonds}% bonds, ${baseAllocation.real_estate}% real estate, and ${baseAllocation.cash}% cash. This allocation considers your age (${riskProfile.age}), investment horizon (${riskProfile.investment_horizon}), and monthly investment capacity (${riskProfile.monthly_investment_amount} SEK). Expected annual return: ${expectedReturn.toFixed(1)}% with risk score ${riskScore}/10.`;

  return {
    asset_allocation: baseAllocation,
    recommended_stocks: recommendedStocks,
    expected_return: expectedReturn,
    risk_score: riskScore,
    reasoning: reasoning
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header provided');
    }

    console.log('Authorization header found:', authHeader ? 'Yes' : 'No');

    // Extract the JWT token from the Authorization header
    const jwt = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Set the session using the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Failed to get user from token:', userError);
      throw new Error(`Authentication failed: ${userError?.message || 'Invalid token'}`);
    }

    console.log('Authenticated user:', user.id);

    const { risk_profile_id } = await req.json();
    console.log('Received request for risk profile ID:', risk_profile_id);

    // Fetch risk profile
    const { data: riskProfile, error: profileError } = await supabaseClient
      .from('user_risk_profiles')
      .select('*')
      .eq('id', risk_profile_id)
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error(`Failed to fetch risk profile: ${profileError.message}`);
    }
    if (!riskProfile) {
      console.error('No risk profile found for ID:', risk_profile_id);
      throw new Error('Risk profile not found');
    }

    console.log('Found risk profile:', riskProfile);

    // Generate portfolio using local algorithm instead of OpenAI
    console.log('Generating portfolio using local algorithm...');
    const portfolioData = generateLocalPortfolio(riskProfile);

    // First, deactivate any existing active portfolios for this user
    const { error: deactivateError } = await supabaseClient
      .from('user_portfolios')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating existing portfolios:', deactivateError);
    }

    // Save portfolio to database
    const { data: portfolio, error: portfolioError } = await supabaseClient
      .from('user_portfolios')
      .insert({
        user_id: user.id,
        risk_profile_id: risk_profile_id,
        portfolio_name: 'AI Generated Portfolio',
        asset_allocation: portfolioData.asset_allocation,
        recommended_stocks: portfolioData.recommended_stocks,
        expected_return: portfolioData.expected_return,
        risk_score: portfolioData.risk_score,
        is_active: true
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('Portfolio save error:', portfolioError);
      throw portfolioError;
    }

    console.log('Portfolio saved successfully:', portfolio.id);

    // Create initial recommendation
    const { error: recommendationError } = await supabaseClient
      .from('portfolio_recommendations')
      .insert({
        user_id: user.id,
        portfolio_id: portfolio.id,
        recommendation_type: 'general_advice',
        title: 'Welcome to Your New Portfolio',
        description: portfolioData.reasoning,
        ai_reasoning: 'Initial portfolio generation based on risk assessment using local algorithm',
        priority: 'high'
      });

    if (recommendationError) {
      console.error('Recommendation save error:', recommendationError);
      // Don't fail the entire operation for this
    }

    return new Response(JSON.stringify({ success: true, portfolio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
