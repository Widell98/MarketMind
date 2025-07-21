
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI weekly cases generation...');
    
    if (!openAIApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get market sectors and current trends for context
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods', 'Real Estate'];
    const investmentStyles = ['Growth', 'Value', 'Dividend', 'ESG'];
    
    const generatedCases = [];

    // Generate 3 AI cases with different focus areas
    for (let i = 0; i < 3; i++) {
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const style = investmentStyles[Math.floor(Math.random() * investmentStyles.length)];
      
      const prompt = `Som en professionell finansanalytiker, skapa ett realistiskt aktiefall för svenska investerare. 

Fokus: ${style}-investering inom ${sector}-sektorn
Stil: Professionell men tillgänglig
Längd: Kortfattat men informativt

Skapa:
1. Företagsnamn (kan vara fiktivt men realistiskt)
2. Investeringstitel (max 60 tecken)
3. Kort beskrivning (max 200 tecken)
4. Sektor
5. Estimerad marknadsvärdering
6. P/E-tal (realistiskt för sektorn)
7. Utdelningsavkastning (om relevant)
8. Målkurs
9. Stopploss-nivå
10. Kort investeringsargument

Svara endast med giltigt JSON i följande format:
{
  "title": "string",
  "company_name": "string", 
  "description": "string",
  "sector": "string",
  "market_cap": "string",
  "pe_ratio": "string",
  "dividend_yield": "string",
  "target_price": number,
  "entry_price": number,
  "stop_loss": number
}`;

      console.log(`Generating case ${i + 1} for ${sector} - ${style}...`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Du är en erfaren finansanalytiker som skapar investeringsanalyser för svenska investerare. Svara alltid med giltigt JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;

      try {
        const caseData = JSON.parse(generatedContent);
        
        // Add AI-specific fields
        caseData.ai_generated = true;
        caseData.is_public = true;
        caseData.status = 'active';
        
        generatedCases.push(caseData);
        console.log(`Successfully generated case: ${caseData.title}`);
        
      } catch (parseError) {
        console.error('Error parsing generated case:', parseError);
        console.error('Generated content:', generatedContent);
      }
    }

    if (generatedCases.length === 0) {
      throw new Error('No cases were successfully generated');
    }

    // Insert generated cases into database
    const { data: insertedCases, error: insertError } = await supabase
      .from('stock_cases')
      .insert(generatedCases)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedCases.length} AI-generated cases`);

    return new Response(JSON.stringify({ 
      success: true, 
      generated_cases: insertedCases.length,
      cases: insertedCases 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-weekly-cases function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
