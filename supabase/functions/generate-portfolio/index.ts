
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { risk_profile_id } = await req.json();

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch risk profile
    const { data: riskProfile, error: profileError } = await supabaseClient
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !riskProfile) {
      throw new Error('Risk profile not found');
    }

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

    const aiResponse = await response.json();
    const portfolioData = JSON.parse(aiResponse.choices[0].message.content);

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
      throw portfolioError;
    }

    // Create initial recommendation
    await supabaseClient
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
