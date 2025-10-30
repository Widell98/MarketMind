
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { buildCorsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

serve(async (req) => {
  const { headers: corsHeaders, originAllowed } = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    if (!originAllowed) {
      return new Response('Origin not allowed', { status: 403, headers: corsHeaders });
    }

    return new Response(null, { headers: corsHeaders });
  }

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userLevel, userProgress, requestedCategory } = await req.json();
    
    console.log('Generating questions for user level:', userLevel);
    
    // Fetch current market data from Alpha Vantage
    const marketData = await fetchMarketData();
    
    // Generate personalized questions using OpenAI
    const questions = await generateQuestionsWithAI(userLevel, userProgress, marketData, requestedCategory);
    
    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMarketData() {
  if (!alphaVantageKey) {
    console.log('No Alpha Vantage key, using mock data');
    return getMockMarketData();
  }

  try {
    // Fetch key market indicators
    const responses = await Promise.all([
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageKey}`),
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${alphaVantageKey}`),
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${alphaVantageKey}`)
    ]);

    const [spyData, aaplData, nvdaData] = await Promise.all(
      responses.map(r => r.json())
    );

    return {
      spy: spyData['Global Quote'],
      aapl: aaplData['Global Quote'],
      nvda: nvdaData['Global Quote'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return getMockMarketData();
  }
}

function getMockMarketData() {
  return {
    spy: {
      '01. symbol': 'SPY',
      '05. price': '415.23',
      '09. change': '+1.23',
      '10. change percent': '+0.30%'
    },
    aapl: {
      '01. symbol': 'AAPL',
      '05. price': '185.64',
      '09. change': '-2.11',
      '10. change percent': '-1.12%'
    },
    nvda: {
      '01. symbol': 'NVDA',
      '05. price': '875.28',
      '09. change': '+15.44',
      '10. change percent': '+1.80%'
    },
    timestamp: new Date().toISOString()
  };
}

async function generateQuestionsWithAI(userLevel: string, userProgress: any, marketData: any, requestedCategory?: string) {
  if (!openAIApiKey) {
    console.log('No OpenAI key, using fallback questions');
    return getFallbackQuestions(userLevel, requestedCategory);
  }

  const weakestCategories = getWeakestCategories(userProgress);
  const targetCategory = requestedCategory || weakestCategories[0] || 'macro';
  
  const prompt = `
Generate 3 finance quiz questions for a ${userLevel} level user based on current market data and targeting the ${targetCategory} category.

Current Market Data:
- S&P 500 (SPY): ${marketData.spy['05. price']} (${marketData.spy['10. change percent']})
- Apple (AAPL): ${marketData.aapl['05. price']} (${marketData.aapl['10. change percent']})
- Nvidia (NVDA): ${marketData.nvda['05. price']} (${marketData.nvda['10. change percent']})

User's weak areas: ${weakestCategories.join(', ')}

Create questions that are:
1. ${userLevel} difficulty level appropriate
2. Focused on ${targetCategory} category
3. Use current market movements when relevant
4. Include exactly 4 multiple choice options
5. Provide clear explanations

Format as JSON array with this structure:
{
  "id": "unique_id",
  "theme": "Market Theme",
  "question": "Question text",
  "context": "Brief context",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct",
  "difficulty": "${userLevel}",
  "category": "${targetCategory}",
  "isGenerated": true
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert finance educator. Generate educational quiz questions based on current market data. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const questions = JSON.parse(content);
      return Array.isArray(questions) ? questions : [questions];
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return getFallbackQuestions(userLevel, targetCategory);
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return getFallbackQuestions(userLevel, targetCategory);
  }
}

function getWeakestCategories(userProgress: any) {
  if (!userProgress?.correctByCategory) return ['macro', 'stocks'];
  
  const categories = Object.entries(userProgress.correctByCategory)
    .sort(([,a], [,b]) => (a as number) - (b as number))
    .map(([category]) => category);
    
  return categories.slice(0, 2);
}

function getFallbackQuestions(userLevel: string, category: string) {
  const fallbackQuestions = [
    {
      id: 'fallback_1',
      theme: 'Market Fundamentals',
      question: 'What typically happens to stock prices when interest rates are lowered?',
      context: 'Central banks use interest rates as a monetary policy tool.',
      options: [
        'Stock prices typically rise',
        'Stock prices typically fall',
        'No correlation exists',
        'Only tech stocks are affected'
      ],
      correctAnswer: 0,
      explanation: 'Lower interest rates make borrowing cheaper and can increase investment in stocks, typically driving prices up.',
      difficulty: userLevel,
      category: category,
      isGenerated: true
    }
  ];
  
  return fallbackQuestions;
}
