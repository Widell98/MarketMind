
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

    // Generate portfolio using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a professional Swedish financial advisor. Based on this user profile, create a personalized investment portfolio:

Age: ${riskProfile.age}
Annual Income: ${riskProfile.annual_income} SEK
Investment Horizon: ${riskProfile.investment_horizon}
Investment Goal: ${riskProfile.investment_goal}
Risk Tolerance: ${riskProfile.risk_tolerance}
Experience: ${riskProfile.investment_experience}
Monthly Investment: ${riskProfile.monthly_investment_amount} SEK
Current Portfolio Value: ${riskProfile.current_portfolio_value} SEK
Sector Interests: ${riskProfile.sector_interests?.join(', ') || 'None specified'}

Return a JSON object with:
1. asset_allocation: Object with percentages for different asset classes (stocks, bonds, real_estate, cash, etc.) - must sum to 100
2. recommended_stocks: Array of 5-10 specific Swedish/Nordic stock recommendations with ticker symbols
3. expected_return: Annual expected return percentage
4. risk_score: Risk score from 1-10
5. reasoning: Detailed explanation of the strategy

Focus on Swedish and Nordic markets. Consider the user's preferences and create a balanced, suitable portfolio.`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional financial advisor specializing in Swedish markets.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received');
    
    let portfolioData;
    try {
      portfolioData = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse.choices[0].message.content);
      throw new Error('Invalid portfolio data received from AI');
    }

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
        ai_reasoning: 'Initial portfolio generation based on risk assessment',
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
