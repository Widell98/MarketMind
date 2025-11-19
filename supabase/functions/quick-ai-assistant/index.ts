
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { OPENAI_RESPONSES_URL, extractReasoningFromResponse, extractResponseText } from '../../lib/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== QUICK AI ASSISTANT FUNCTION STARTED ===');

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const defaultModel = Deno.env.get('OPENAI_REASONING_MODEL')
      || Deno.env.get('OPENAI_MODEL')
      || 'gpt-5.1';

    const {
      message,
      userId,
      systemPrompt,
      model = defaultModel,
      maxTokens = 50,
      temperature = 0.3,
    } = requestBody;

    console.log('Quick AI Assistant called with:', { 
      message: message?.substring(0, 50) + '...', 
      userId,
      model,
      maxTokens,
      temperature
    });

    if (!message || !userId) {
      console.error('Missing required fields:', { message: !!message, userId: !!userId });
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, calling API...');

    // Enhance system prompt with micro-template structure
    const enhancedSystemPrompt = `${systemPrompt}

MIKRO-MALL FÖR SNABBA AKTIESVAR:
Strukturera VARJE svar enligt denna kompakta mall:

**📊 Tes:** [Huvud-investeringstesen i 1 mening]
**⚠️ Risk:** [Primär risk att beakta]
**📈 Nivåer:** [Relevanta kursnivåer om tillgängliga]

Exempel:
📊 **Tes:** Stark tillväxtaktie inom gaming med global marknadsledning
⚠️ **Risk:** Regulatorisk osäkerhet och konjunkturkänslighet  
📈 **Nivåer:** Stöd 1080 SEK, motstånd 1250 SEK

Håll totalt under 70 ord. Ge alltid konkret investingssyn.`;

    const messages = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      {
        role: 'user',
        content: message
      }
    ];

    console.log('=== CALLING OPENAI API ===');
    console.log('Model:', model);
    console.log('Max tokens:', maxTokens);
    console.log('Temperature:', temperature);
    console.log('System prompt length:', systemPrompt?.length);

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: messages,
        max_output_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error details:', errorData);
      
      if (response.status === 429) {
        const errorType = errorData.error?.type;
        
        if (errorType === 'insufficient_quota') {
          return new Response(
            JSON.stringify({ 
              error: 'quota_exceeded',
              message: 'Du har nått din dagliga gräns för OpenAI API-användning.',
              success: false 
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = extractResponseText(data);
    const reasoningText = extractReasoningFromResponse(data);
    console.log('AI response length:', aiResponse?.length);
    console.log('AI response:', aiResponse);

    // Initialize Supabase client for usage tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Track usage
    const { error: usageError } = await supabase.rpc('increment_ai_usage', {
      _user_id: userId,
      _usage_type: 'ai_message'
    });

    if (usageError) {
      console.error('Error tracking usage:', usageError);
    }

    console.log('=== FUNCTION COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({
        response: aiResponse,
        reasoning: reasoningText || null,
        success: true,
        model: model,
        tokens_used: data?.usage?.output_tokens ?? data?.usage?.completion_tokens ?? maxTokens,
        usage: data?.usage ?? null,
        response_id: data?.id ?? null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return new Response(
        JSON.stringify({ 
          error: 'quota_exceeded',
          message: 'Du har nått din dagliga gräns för OpenAI API-användning.',
          success: false 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Ett oväntat fel inträffade',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
