import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRIMARY_CHAT_MODEL = Deno.env.get('OPENAI_PORTFOLIO_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get yesterday's date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const yesterdayDateStr = yesterday.toLocaleDateString('sv-SE');
    const todayDateStr = today.toLocaleDateString('sv-SE');

    // Check cache first (morning newsletter is generated once per day)
    const cacheKey = `morning_newsletter_${yesterday.toISOString().split('T')[0]}`;
    
    const { data: cachedData } = await supabase
      .from('morning_newsletter_cache')
      .select('content, generated_at')
      .eq('cache_key', cacheKey)
      .single();

    // If we have cached data from today (after 7 AM), return it
    if (cachedData && cachedData.generated_at) {
      const generatedAt = new Date(cachedData.generated_at);
      const now = new Date();
      
      // If generated today after 7 AM, return cached version
      if (generatedAt.toDateString() === now.toDateString() && generatedAt.getHours() >= 7) {
        console.log('Returning cached morning newsletter');
        return new Response(JSON.stringify({
          content: cachedData.content,
          generated_at: cachedData.generated_at,
          date: yesterdayDateStr
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate new newsletter using GPT
    console.log(`Generating morning newsletter for ${yesterdayDateStr}...`);

    const systemPrompt = `Du är en erfaren svensk finansiell analytiker som skriver morgonbrev. Ditt uppdrag är att sammanfatta gårdagens viktigaste börsnyheter och marknadsrörelser på ett tydligt och handlingsbart sätt för svenska investerare.

STIL & FORMAT:
- Skriv på svenska med professionell men tillgänglig ton
- Använd stycken på 2-3 meningar
- Fokusera på faktabaserad information och marknadssentiment
- Undvik spekulationer och håll dig till vad som faktiskt hände
- Strukturera innehållet logiskt med tydliga sektioner

INNEHÅLL:
- Börja med en kort översikt av gårdagens marknad (1-2 stycken)
- Beskriv viktiga indexrörelser (OMXS30, S&P 500, Nasdaq, etc.)
- Lyft fram 3-5 viktiga nyheter från gårdagen som påverkar marknaden
- Inkludera relevanta sektorer och bolag
- Avsluta med 2-3 fokusområden att bevaka idag

VIKTIGT:
- Alla nyheter ska vara relevanta för gårdagens datum
- Använd konkreta siffror och procent när det är möjligt
- Koppla nyheter till marknadspåverkan
- Håll brevet koncist men informativt (cirka 400-600 ord)`;

    const userPrompt = `Skapa ett morgonbrev för ${todayDateStr} som sammanfattar gårdagens (${yesterdayDateStr}) viktigaste börsnyheter och marknadsrörelser.

Fokusera på:
- Viktiga indexrörelser och marknadssentiment
- Stora nyheter från svenska och internationella börser
- Sektorer som stod ut (positivt eller negativt)
- Centralbanks- och makroekonomiska händelser
- Stora bolagsnyheter och rapportsläpp
- Geopolitiska faktorer som påverkar marknaden

Skriv brevet som om det är genererat kl 07:00 på morgonen och ger läsaren en tydlig bild av vad som hände igår och vad som är viktigt att bevaka idag.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PRIMARY_CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error:', errorBody);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const newsletterContent = data.choices[0]?.message?.content;

    if (!newsletterContent) {
      throw new Error('No content received from OpenAI');
    }

    // Save to cache
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(7, 0, 0, 0); // Expires next day at 7 AM

    await supabase
      .from('morning_newsletter_cache')
      .upsert({
        cache_key: cacheKey,
        content: newsletterContent,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      });

    console.log('Morning newsletter generated and cached');

    return new Response(JSON.stringify({
      content: newsletterContent,
      generated_at: new Date().toISOString(),
      date: yesterdayDateStr
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating morning newsletter:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
