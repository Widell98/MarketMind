
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, sessionId, portfolioId } = await req.json();
    console.log(`Portfolio AI Chat request for user ${user.id}: ${message}`);

    // Get user's portfolio data
    const portfolioData = await getUserPortfolioData(user.id, portfolioId);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, portfolioData, user.id);

    // Save conversation to database
    await saveConversation(sessionId, user.id, message, aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in portfolio AI chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserPortfolioData(userId: string, portfolioId?: string) {
  try {
    // Get user's active portfolio
    const { data: portfolios } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const portfolio = portfolios?.[0];
    
    // Get user's holdings
    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    // Get user's risk profile
    const { data: riskProfile } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      portfolio,
      holdings: holdings || [],
      riskProfile
    };
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return { portfolio: null, holdings: [], riskProfile: null };
  }
}

async function generateAIResponse(message: string, portfolioData: any, userId: string) {
  if (!openAIApiKey) {
    return generateFallbackResponse(message, portfolioData);
  }

  try {
    const systemPrompt = `Du är en erfaren svensk investeringsrådgivare och AI-assistent som hjälper användare med deras investeringsportfölj. Du ska ge personliga, genomtänkta och praktiska råd baserat på användarens situation.

VIKTIGA RIKTLINJER:
- Skriv naturligt och konversationellt, som en riktig rådgivare
- Anpassa språket efter användarens fråga (formellt eller informellt)
- Avsluta alltid ditt svar med en sammanfattning av användarens nuvarande innehav
- Använd svenska termer och hänvisa till svenska förhållanden
- Var konkret och praktisk i dina råd
- Inkludera alltid riskvärdering när det är relevant

ANVÄNDARENS PORTFOLJDATA:
${JSON.stringify(portfolioData, null, 2)}

Ge alltid rådgivning som avslutas med "Dina nuvarande innehav:" följt av en lista över användarens aktieinnehav.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error generating AI response:', error);
    return generateFallbackResponse(message, portfolioData);
  }
}

function generateFallbackResponse(message: string, portfolioData: any) {
  const holdings = portfolioData.holdings || [];
  const holdingsText = holdings.length > 0 
    ? holdings.map(h => `${h.name} (${h.symbol})`).join(', ')
    : 'Inga innehav registrerade';

  return `Tack för din fråga om "${message}". Som din AI-investeringsassistent kan jag hjälpa dig med analys av din portfölj och ge råd baserat på din riskprofil och investeringsmål.

Baserat på din nuvarande situation rekommenderar jag att du håller koll på marknadsläget och överväger diversifiering av din portfölj för att minska risk.

Dina nuvarande innehav: ${holdingsText}`;
}

async function saveConversation(sessionId: string, userId: string, userMessage: string, aiResponse: string) {
  try {
    await supabase
      .from('chat_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        title: userMessage.substring(0, 50) + '...',
        updated_at: new Date().toISOString()
      });

    await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          role: 'user',
          content: userMessage
        },
        {
          session_id: sessionId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse
        }
      ]);

    console.log('Conversation saved successfully');
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}
