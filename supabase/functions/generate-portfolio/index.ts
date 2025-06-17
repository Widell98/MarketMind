
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Security: Verify JWT token and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { riskProfileId } = await req.json()

    // Security: Validate input
    if (!riskProfileId || typeof riskProfileId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid risk profile ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Security: Verify the risk profile belongs to the authenticated user
    const { data: riskProfile, error: profileError } = await supabaseClient
      .from('user_risk_profiles')
      .select('*')
      .eq('id', riskProfileId)
      .eq('user_id', user.id)
      .single()

    if (profileError || !riskProfile) {
      return new Response(
        JSON.stringify({ error: 'Risk profile not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Security: Rate limiting check (basic implementation)
    const { data: existingPortfolios } = await supabaseClient
      .from('user_portfolios')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (existingPortfolios && existingPortfolios.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 portfolios per day.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate portfolio based on risk profile
    const portfolioData = generatePortfolioFromProfile(riskProfile)

    // Save portfolio to database
    const { data: portfolio, error: saveError } = await supabaseClient
      .from('user_portfolios')
      .insert({
        user_id: user.id,
        risk_profile_id: riskProfileId,
        portfolio_name: `${getPortfolioName(riskProfile)} Portfolio`,
        asset_allocation: portfolioData.assetAllocation,
        recommended_stocks: portfolioData.recommendedStocks,
        expected_return: portfolioData.expectedReturn,
        risk_score: portfolioData.riskScore,
        total_value: riskProfile.current_portfolio_value || 0
      })
      .select()
      .single()

    if (saveError) {
      throw saveError
    }

    return new Response(
      JSON.stringify({ 
        portfolio,
        message: 'Portfolio generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Portfolio generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generatePortfolioFromProfile(riskProfile: any) {
  // Security: Validate profile data
  const safeProfile = {
    risk_tolerance: riskProfile.risk_tolerance || 'moderate',
    investment_horizon: riskProfile.investment_horizon || 'medium',
    investment_goal: riskProfile.investment_goal || 'balanced',
    investment_experience: riskProfile.investment_experience || 'beginner',
    sector_interests: Array.isArray(riskProfile.sector_interests) ? riskProfile.sector_interests : [],
    age: Math.max(18, Math.min(100, riskProfile.age || 35)),
    monthly_investment_amount: Math.max(0, riskProfile.monthly_investment_amount || 1000)
  }

  // Generate asset allocation based on risk tolerance
  let stocksPercent = 60
  let bondsPercent = 30
  let cashPercent = 10

  switch (safeProfile.risk_tolerance) {
    case 'conservative':
      stocksPercent = 40
      bondsPercent = 50
      cashPercent = 10
      break
    case 'aggressive':
      stocksPercent = 80
      bondsPercent = 15
      cashPercent = 5
      break
  }

  // Adjust based on age (younger = more aggressive)
  if (safeProfile.age < 30) {
    stocksPercent = Math.min(stocksPercent + 10, 90)
    bondsPercent = Math.max(bondsPercent - 10, 5)
  } else if (safeProfile.age > 50) {
    stocksPercent = Math.max(stocksPercent - 10, 30)
    bondsPercent = Math.min(bondsPercent + 10, 60)
  }

  const assetAllocation = {
    stocks: stocksPercent,
    bonds: bondsPercent,
    cash: cashPercent
  }

  // Generate recommended stocks based on sector interests
  const recommendedStocks = generateStockRecommendations(safeProfile)

  // Calculate expected return
  const expectedReturn = calculateExpectedReturn(assetAllocation, safeProfile.risk_tolerance)

  // Calculate risk score
  const riskScore = calculateRiskScore(safeProfile)

  return {
    assetAllocation,
    recommendedStocks,
    expectedReturn,
    riskScore
  }
}

function generateStockRecommendations(profile: any) {
  const stockDatabase = {
    'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'],
    'Healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK'],
    'Finance': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
    'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB'],
    'Consumer Goods': ['PG', 'KO', 'PEP', 'WMT', 'HD']
  }

  const recommendations = []
  const maxStocksPerSector = 3
  const maxTotalStocks = 10

  // If user has sector interests, prioritize those
  if (profile.sector_interests && profile.sector_interests.length > 0) {
    for (const sector of profile.sector_interests) {
      if (stockDatabase[sector] && recommendations.length < maxTotalStocks) {
        const sectorStocks = stockDatabase[sector]
          .slice(0, maxStocksPerSector)
          .map(symbol => ({
            symbol,
            sector,
            allocation: Math.round((100 / Math.min(profile.sector_interests.length * maxStocksPerSector, maxTotalStocks)) * 100) / 100
          }))
        
        recommendations.push(...sectorStocks)
      }
    }
  } else {
    // Default diversified portfolio
    const defaultSectors = ['Technology', 'Healthcare', 'Finance']
    for (const sector of defaultSectors) {
      if (recommendations.length < maxTotalStocks) {
        const sectorStocks = stockDatabase[sector]
          .slice(0, 2)
          .map(symbol => ({
            symbol,
            sector,
            allocation: Math.round((100 / 6) * 100) / 100
          }))
        
        recommendations.push(...sectorStocks)
      }
    }
  }

  return recommendations.slice(0, maxTotalStocks)
}

function calculateExpectedReturn(allocation: any, riskTolerance: string) {
  const stockReturn = 8.5 // Historical average
  const bondReturn = 4.0
  const cashReturn = 1.5

  const weightedReturn = 
    (allocation.stocks / 100) * stockReturn +
    (allocation.bonds / 100) * bondReturn +
    (allocation.cash / 100) * cashReturn

  // Adjust based on risk tolerance
  const riskAdjustment = {
    'conservative': -0.5,
    'moderate': 0,
    'aggressive': 0.5
  }

  return Math.round((weightedReturn + (riskAdjustment[riskTolerance] || 0)) * 100) / 100
}

function calculateRiskScore(profile: any) {
  let score = 50 // Base score

  // Risk tolerance adjustment
  switch (profile.risk_tolerance) {
    case 'conservative': score -= 20; break
    case 'aggressive': score += 20; break
  }

  // Age adjustment
  if (profile.age < 30) score += 10
  if (profile.age > 50) score -= 10

  // Investment horizon adjustment
  switch (profile.investment_horizon) {
    case 'short': score -= 15; break
    case 'long': score += 15; break
  }

  return Math.max(10, Math.min(90, score))
}

function getPortfolioName(profile: any) {
  const riskLevel = profile.risk_tolerance || 'moderate'
  return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)
}
