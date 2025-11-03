
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { createScopedLogger, generateRequestId } from '../_shared/logger.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const { headers: corsHeaders, originAllowed } = buildCorsHeaders(req);
  const logger = createScopedLogger('QUICK-AI-ASSISTANT', requestId);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    if (!originAllowed) {
      logger.warn('Rejected preflight due to disallowed origin');
      return new Response('Origin not allowed', { status: 403, headers: corsHeaders });
    }

    return new Response(null, { headers: corsHeaders });
  }

  if (!originAllowed) {
    logger.warn('Blocked request due to disallowed origin');
    return new Response(
      JSON.stringify({ error: 'Origin not allowed', success: false }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  logger.info('Function started');

  try {
    const requestBody = await req.json();

    const { message, userId, systemPrompt, model = 'gpt-4o-mini', maxTokens = 50, temperature = 0.3 } = requestBody;

    logger.debug('Request received', {
      hasMessage: Boolean(message),
      hasUserId: Boolean(userId),
      model,
      maxTokens,
      temperature,
    });

    if (!message || !userId) {
      logger.warn('Missing required fields', { hasMessage: Boolean(message), hasUserId: Boolean(userId) });
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      logger.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    logger.debug('Calling OpenAI API');

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

    logger.debug('OpenAI payload prepared', {
      model,
      maxTokens,
      temperature,
      systemPromptLength: systemPrompt?.length ?? 0,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    logger.debug('OpenAI response received', { status: response.status });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('OpenAI API error', { status: response.status, error: errorData?.error?.message });

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
    logger.debug('OpenAI response parsed', { choiceCount: data.choices?.length ?? 0 });

    const aiResponse = data.choices[0].message.content;
    logger.info('OpenAI response ready', { responseLength: aiResponse?.length ?? 0 });

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
      logger.warn('Failed to record usage', { reason: usageError.message });
    }

    logger.info('Function completed successfully');

    return new Response(
      JSON.stringify({
        response: aiResponse,
        success: true,
        model: model,
        tokens_used: maxTokens
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Function error', { message: errorMessage });

    if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
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
        error: errorMessage || 'Ett oväntat fel inträffade',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
