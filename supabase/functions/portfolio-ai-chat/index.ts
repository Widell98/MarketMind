
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
    const { message, userId, portfolioId, chatHistory = [] } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user's risk profile and portfolio data for context
    const { data: riskProfile } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    // Build context for AI
    let contextInfo = "Du är en AI-assistent specialiserad på investeringsrådgivning. Du hjälper användare med portföljanalys och investeringsbeslut på svenska.";
    
    if (riskProfile) {
      contextInfo += `\n\nAnvändarens riskprofil:
- Ålder: ${riskProfile.age || 'Ej angivet'}
- Risktolerans: ${riskProfile.risk_tolerance || 'Ej angivet'}
- Investeringshorisont: ${riskProfile.investment_horizon || 'Ej angivet'}
- Årsinkomst: ${riskProfile.annual_income ? riskProfile.annual_income.toLocaleString() + ' SEK' : 'Ej angivet'}
- Månatlig investeringsbudget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}`;
    }

    if (portfolio) {
      contextInfo += `\n\nNuvarande portfölj:
- Portföljvärde: ${portfolio.total_value ? portfolio.total_value.toLocaleString() + ' SEK' : 'Ej angivet'}
- Förväntad avkastning: ${portfolio.expected_return || 'Ej angivet'}%
- Riskpoäng: ${portfolio.risk_score || 'Ej angivet'}/10`;
    }

    if (holdings && holdings.length > 0) {
      contextInfo += `\n\nNuvarande innehav:`;
      holdings.forEach(holding => {
        contextInfo += `\n- ${holding.name} (${holding.symbol || 'N/A'}): ${holding.current_value ? holding.current_value.toLocaleString() + ' SEK' : 'Värde ej angivet'}`;
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `${contextInfo}

Svara alltid på svenska och håll dig till investeringsrelaterade ämnen. Du kan:
- Analysera portföljer och innehav
- Ge råd om diversifiering
- Förklara investeringsstrategier
- Diskutera riskhantering
- Svara på frågor om specifika aktier eller fonder

Håll svaren kortfattade men informativa. Ge aldrig specifika köp/sälj-råd utan fokusera på generell utbildning och analys.`
      },
      ...chatHistory.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Sending request to OpenAI with context for user:', userId);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store chat history in database
    const { error: chatError } = await supabase
      .from('portfolio_chat_history')
      .insert([
        {
          user_id: userId,
          portfolio_id: portfolioId,
          message_type: 'user',
          message: message,
          context_data: { timestamp: new Date().toISOString() }
        },
        {
          user_id: userId,
          portfolio_id: portfolioId,
          message_type: 'assistant',
          message: aiResponse,
          context_data: { 
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini'
          }
        }
      ]);

    if (chatError) {
      console.error('Error storing chat history:', chatError);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
