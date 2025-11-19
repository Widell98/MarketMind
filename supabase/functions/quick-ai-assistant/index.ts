
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const extractResponsesApiText = (data: any): string => {
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) {
        continue;
      }

      for (const part of item.content) {
        const parsedPayload = (part as any)?.parsed ?? (part as any)?.json;
        if (parsedPayload !== undefined) {
          if (typeof parsedPayload === 'string') {
            const trimmed = parsedPayload.trim();
            if (trimmed) {
              return trimmed;
            }
          } else {
            try {
              const stringified = JSON.stringify(parsedPayload);
              if (stringified) {
                return stringified;
              }
            } catch {
              // ignore serialization errors and continue to next part
            }
          }
        }
      }

      const text = item.content
        .map((part: { text?: string }) => part?.text?.trim?.())
        .filter(Boolean)
        .join('\n')
        .trim();
      if (text) {
        return text;
      }
    }

    const flattenedText = data.output
      ?.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
      ?.filter((contentPart: any) => typeof contentPart?.text === 'string')
      ?.map((contentPart: any) => contentPart.text.trim())
      ?.filter((textValue: string) => textValue.length > 0)
      ?.join('\n')
      ?.trim();

    if (flattenedText) {
      return flattenedText;
    }
  }

  if (Array.isArray(data?.output_text) && data.output_text.length > 0) {
    const text = data.output_text.join('\n').trim();
    if (text) {
      return text;
    }
  }

  return data?.choices?.[0]?.message?.content?.trim?.() ?? '';
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
    console.log('Legacy temperature input (ignored for GPT-5 modeller):', temperature);
    console.log('System prompt length:', systemPrompt?.length);

    const reasoningEffort = maxTokens >= 150 ? 'medium' : 'low';
    const verbosity: 'low' | 'medium' | 'high' = maxTokens <= 60
      ? 'low'
      : maxTokens >= 150
        ? 'high'
        : 'medium';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: messages,
        max_output_tokens: maxTokens,
        reasoning: {
          effort: reasoningEffort,
        },
        text: {
          verbosity,
        },
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
    console.log('OpenAI response received');

    const aiResponse = extractResponsesApiText(data);

    const reasoningSegments: string[] = [];
    if (Array.isArray(data?.output)) {
      for (const item of data.output) {
        const content = Array.isArray(item?.content) ? item.content : [];
        for (const part of content) {
          if (Array.isArray(part?.reasoning_content)) {
            for (const reasoning of part.reasoning_content) {
              if (typeof reasoning?.text === 'string' && reasoning.text.trim()) {
                reasoningSegments.push(reasoning.text.trim());
              }
            }
          }
          if (typeof part?.text === 'string' && part?.type === 'reasoning' && part.text.trim()) {
            reasoningSegments.push(part.text.trim());
          }
        }
        if (Array.isArray(item?.reasoning_content)) {
          for (const reasoning of item.reasoning_content) {
            if (typeof reasoning?.text === 'string' && reasoning.text.trim()) {
              reasoningSegments.push(reasoning.text.trim());
            }
          }
        }
      }
    }

    const reasoningText = reasoningSegments.join('\n');
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
