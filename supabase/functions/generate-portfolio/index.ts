
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { riskProfileId, userId } = await req.json();
    
    console.log('Generate portfolio request:', { riskProfileId, userId });

    if (!riskProfileId || !userId) {
      throw new Error('Missing required parameters: riskProfileId and userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get risk profile data
    const { data: riskProfile, error: riskError } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('id', riskProfileId)
      .single();

    if (riskError || !riskProfile) {
      console.error('Error fetching risk profile:', riskError);
      throw new Error('Risk profile not found');
    }

    console.log('Risk profile found:', riskProfile);

    // Get existing holdings to avoid duplicates
    const { data: holdings } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    // Filter out existing holdings
    const existingSymbols = new Set();
    const existingCompanies = new Set();
    
    if (holdings && holdings.length > 0) {
      holdings.forEach(holding => {
        if (holding.symbol && holding.holding_type !== 'recommendation') {
          existingSymbols.add(holding.symbol.toUpperCase());
        }
        if (holding.name && holding.holding_type !== 'recommendation') {
          existingCompanies.add(holding.name.toLowerCase());
        }
      });
    }

    // Fetch user AI memory for deeper personalization
    const { data: aiMemory } = await supabase
      .from('user_ai_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Call OpenAI API for personalized recommendations
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const conversationData = buildConversationData({
      riskProfile,
      aiMemory,
      existingHoldings: holdings,
      existingSymbols,
    });

    const advisorPrompt = buildAdvisorPrompt(conversationData);

    console.log('Calling OpenAI API with gpt-4o using streamlined advisor prompt...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: advisorPrompt }
        ],
        temperature: 0.75,
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      
      // Handle specific quota exceeded error
      if (openAIResponse.status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: 'quota_exceeded',
          message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiRecommendations = openAIData.choices?.[0]?.message?.content || '';

    console.log('OpenAI full response:', JSON.stringify(openAIData, null, 2));
    console.log('AI recommendations received:', aiRecommendations);

    if (!aiRecommendations) {
      console.error('No AI recommendations received from OpenAI');
      throw new Error('No AI response received from OpenAI');
    }

      const parsedAdvisorResponse = parseAdvisorResponse(aiRecommendations);
      const recommendedStocks = normalizeRecommendations(parsedAdvisorResponse.recommendations, existingSymbols);

      if (recommendedStocks.length === 0) {
        console.warn('No structured recommendations could be parsed from the AI response.');
      }


    // Create portfolio record
    const portfolioData = {
      user_id: userId,
      risk_profile_id: riskProfileId,
      portfolio_name: 'AI-Genererad Portfölj',
      asset_allocation: {
        ...calculateAssetAllocation(recommendedStocks),
        advisor_summary: parsedAdvisorResponse.summary,
        advisor_recommendations: parsedAdvisorResponse.recommendations,
      },
      recommended_stocks: recommendedStocks,
      advisor_summary: parsedAdvisorResponse.summary || null,
      advisor_recommendations: parsedAdvisorResponse.recommendations,
      total_value: riskProfile.current_portfolio_value || 0,
      expected_return: calculateExpectedReturn(recommendedStocks),
      risk_score: calculateRiskScore(riskProfile.risk_tolerance, riskProfile.risk_comfort_level),
      is_active: true
    };

    console.log('Creating portfolio with data:', portfolioData);

    // Insert portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .insert(portfolioData)
      .select()
      .single();

    if (portfolioError) {
      console.error('Error creating portfolio:', portfolioError);
      throw new Error('Failed to create portfolio');
    }

    console.log('Portfolio created successfully:', portfolio.id);

    // Add recommended stocks to user_holdings as recommendations
    if (recommendedStocks.length > 0) {
      const holdingsData = recommendedStocks.map(stock => ({
        user_id: userId,
        holding_type: 'recommendation',
        name: stock.name,
        symbol: stock.symbol,
        sector: stock.sector || 'Allmän',
        market: 'Swedish',
        currency: 'SEK',
        allocation: stock.allocation,
        quantity: 0,
        current_value: 0,
        purchase_price: 0,
        purchase_date: new Date().toISOString().split('T')[0]
      }));

      console.log('Inserting holdings data:', holdingsData);

      const { error: holdingsError } = await supabase
        .from('user_holdings')
        .insert(holdingsData);

      if (holdingsError) {
        console.error('Error inserting holdings:', holdingsError);
        // Don't throw error here as portfolio is already created
      } else {
        console.log('Holdings inserted successfully');
      }
    }

    console.log('Returning response with AI recommendations:', aiRecommendations?.substring(0, 200));
    
    return new Response(JSON.stringify({
      success: true,
      portfolio: portfolio,
      aiRecommendations: aiRecommendations,
      aiResponse: aiRecommendations, // Add this for compatibility
      response: aiRecommendations, // Add this for compatibility 
      confidence: calculateConfidence(recommendedStocks, riskProfile),
      recommendedStocks: recommendedStocks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
    
    // Check if it's a quota-related error
    if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'quota_exceeded',
        message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


type NormalizedRecommendation = {
  name: string;
  symbol?: string;
  allocation: number;
  sector?: string;
  reason?: string;
};

type StoredRiskProfile = {
  sector_interests?: string[] | null;
  risk_tolerance?: string | null;
  risk_comfort_level?: number | null;
  current_portfolio_value?: number | null;
  [key: string]: unknown;
};

type StoredAiMemory = Record<string, unknown> | null;

type ExistingHolding = {
  name?: string | null;
  symbol?: string | null;
  allocation?: number | null;
  quantity?: number | null;
  holding_type?: string | null;
  [key: string]: unknown;
};

interface AdvisorParseResult {
  summary: string;
  recommendations: unknown[];
}

function buildConversationData(params: {
  riskProfile: StoredRiskProfile;
  aiMemory: StoredAiMemory;
  existingHoldings?: ExistingHolding[] | null;
  existingSymbols: Set<string>;
}): Record<string, unknown> {
  const { riskProfile, aiMemory, existingHoldings, existingSymbols } = params;

  const sanitizedHoldings = Array.isArray(existingHoldings)
    ? existingHoldings
        .filter((holding): holding is ExistingHolding => {
          if (!holding || typeof holding !== 'object') {
            return false;
          }
          const symbol = typeof holding.symbol === 'string' ? holding.symbol : null;
          const holdingType = typeof holding.holding_type === 'string' ? holding.holding_type : null;
          return Boolean(symbol) && holdingType !== 'recommendation';
        })
        .map(holding => ({
          name: typeof holding.name === 'string' ? holding.name : undefined,
          symbol: typeof holding.symbol === 'string' ? holding.symbol : undefined,
          allocation: typeof holding.allocation === 'number' ? holding.allocation : undefined,
          quantity: typeof holding.quantity === 'number' ? holding.quantity : undefined,
          holding_type: typeof holding.holding_type === 'string' ? holding.holding_type : undefined,
        }))
    : [];

  const sectorInterests = Array.isArray(riskProfile.sector_interests)
    ? riskProfile.sector_interests.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    generated_at: new Date().toISOString(),
    risk_profile: riskProfile,
    ai_memory: aiMemory || null,
    existing_holdings: sanitizedHoldings,
    constraints: {
      avoid_tickers: Array.from(existingSymbols),
      preferred_sectors: sectorInterests,
    },
  };
}

function buildAdvisorPrompt(conversationData: Record<string, unknown>): string {
  const conversationJson = JSON.stringify(conversationData, null, 2);
  return `Du är en erfaren svensk investeringsrådgivare som analyserar en användares profil och ger personliga rekommendationer.

Analysera följande data:
${conversationJson}

Skriv ett svar på svenska i två delar:

En sammanhängande rådgivartext (3–6 meningar) där du förklarar:

användarens riskprofil och sparhorisont,

hur användaren bör tänka och agera kring investeringar,

vilka typer av tillgångar (aktier, fonder, räntor, indexfonder etc.) som passar,

och avsluta med en trygg slutsats som passar användarens profil.

En JSON-lista med 5–8 rekommenderade investeringar:
{
"recommendations": [
{ "name": "Bolag eller fondnamn", "ticker": "TICKER", "reason": "Kort motivering" }
]
}

Separera textdelen och JSON-delen med raden:
---JSON---

Skapa alltid unika, datadrivna rekommendationer baserat på användarens profil. Ingen hårdkodning.`;
}

function parseAdvisorResponse(body: string): AdvisorParseResult {
  if (!body) {
    return { summary: '', recommendations: [] };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { summary: '', recommendations: [] };
  }

  const [summaryPart, jsonPart] = trimmed.split('---JSON---');
  let summary = (summaryPart || '').trim();
  let recommendations: unknown[] = [];

  const tryParse = (content: string | undefined): unknown[] => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content.trim());
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        const maybeRecommendations = (parsed as { recommendations?: unknown }).recommendations;
        if (Array.isArray(maybeRecommendations)) {
          return maybeRecommendations;
        }
      }
    } catch (error) {
      console.warn('Failed to parse advisor JSON payload', error);
    }
    return [];
  };

  if (jsonPart) {
    recommendations = tryParse(jsonPart);
  } else {
    recommendations = tryParse(trimmed);
  }

  if (!summary && trimmed && summaryPart === undefined) {
    summary = trimmed;
  }

  return { summary, recommendations };
}

function normalizeRecommendations(recommendations: unknown, existingSymbols: Set<string>): NormalizedRecommendation[] {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  const sanitized = recommendations
    .map(rec => {
      if (!rec || typeof rec !== 'object') return null;
      const record = rec as Record<string, unknown>;
      const nameCandidate = typeof record.name === 'string' ? record.name : typeof record.company === 'string' ? record.company : '';
      const name = nameCandidate ? nameCandidate.trim() : '';
      if (!name) return null;

      const tickerValue = typeof record.ticker === 'string' ? record.ticker.trim() : typeof record.symbol === 'string' ? record.symbol.trim() : '';
      const allocationValue = extractAllocation(
        record.allocation ??
        record.weight ??
        record.percentage ??
        record.share ??
        record.targetAllocation ??
        record.recommendedWeight
      );
      const reasonSource = typeof record.reason === 'string'
        ? record.reason
        : typeof record.motivation === 'string'
          ? record.motivation
          : undefined;
      const sectorSource = typeof record.sector === 'string' ? record.sector : undefined;

      return {
        name,
        symbol: tickerValue || undefined,
        allocation: allocationValue ?? undefined,
        sector: sectorSource ? sectorSource.trim() : undefined,
        reason: reasonSource ? reasonSource.trim() : undefined,
      };
    })
    .filter((item): item is {
      name: string;
      symbol?: string;
      allocation?: number;
      sector?: string;
      reason?: string;
    } => item !== null);

  const seen = new Set<string>();
  const filtered = sanitized
    .filter(item => {
      const ticker = item.symbol ? item.symbol.toUpperCase() : '';
      if (ticker && existingSymbols.has(ticker)) {
        return false;
      }
      const key = ticker || item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 8);

  if (filtered.length === 0) {
    return [];
  }

  const assignedTotal = filtered.reduce((sum, item) => sum + (typeof item.allocation === 'number' ? item.allocation : 0), 0);
  const missing = filtered.filter(item => typeof item.allocation !== 'number' || Number.isNaN(item.allocation));

  if (missing.length > 0) {
    const remaining = Math.max(0, 100 - assignedTotal);
    const base = missing.length ? Math.floor(remaining / missing.length) : 0;
    let remainder = remaining - base * missing.length;
    missing.forEach(item => {
      item.allocation = base + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
    });
  } else if (filtered.length > 0) {
    if (assignedTotal === 0) {
      const equalShare = Math.floor(100 / filtered.length);
      let remainder = 100 - equalShare * filtered.length;
      filtered.forEach(item => {
        item.allocation = equalShare + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
      });
    } else if (assignedTotal !== 100) {
      const scale = 100 / assignedTotal;
      filtered.forEach(item => {
        if (typeof item.allocation === 'number') {
          item.allocation = item.allocation * scale;
        }
      });
    }
  }

  ensureSum100(filtered as NormalizedRecommendation[]);

  return filtered.map(item => ({
    name: item.name,
    symbol: item.symbol,
    allocation: typeof item.allocation === 'number' ? item.allocation : 0,
    sector: item.sector || detectSector(item.name, item.symbol, item.reason),
    reason: item.reason,
  }));
}

function extractAllocation(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return null;
}

function calculateAssetAllocation(stocks: NormalizedRecommendation[]): { stocks: number; bonds: number; cash: number } {
  if (!stocks || stocks.length === 0) {
    return { stocks: 0, bonds: 0, cash: 100 };
  }

  let stocksTotal = 0;
  let bondsTotal = 0;

  stocks.forEach(stock => {
    const allocation = typeof stock.allocation === 'number' ? stock.allocation : 0;
    const sector = (stock.sector || '').toLowerCase();
    if (sector.includes('ränta') || sector.includes('obligation') || sector.includes('rente')) {
      bondsTotal += allocation;
    } else {
      stocksTotal += allocation;
    }
  });

  let total = stocksTotal + bondsTotal;
  if (total > 100 && total > 0) {
    const scale = 100 / total;
    stocksTotal = Math.round(stocksTotal * scale);
    bondsTotal = Math.round(bondsTotal * scale);
    total = stocksTotal + bondsTotal;
  }

  const cashTotal = Math.max(0, 100 - total);

  return {
    stocks: stocksTotal,
    bonds: bondsTotal,
    cash: cashTotal,
  };
}

function calculateExpectedReturn(stocks: NormalizedRecommendation[]): number {
  if (!stocks || stocks.length === 0) {
    return 0;
  }

  let totalReturn = 0;

  stocks.forEach(stock => {
    const allocationShare = (typeof stock.allocation === 'number' ? stock.allocation : 0) / 100;
    if (allocationShare <= 0) return;

    let sectorReturn = 0.08; // Basantagande 8%
    const sector = (stock.sector || '').toLowerCase();

    if (sector.includes('teknik') || sector.includes('tech')) {
      sectorReturn = 0.12;
    } else if (sector.includes('bank') || sector.includes('finans')) {
      sectorReturn = 0.06;
    } else if (sector.includes('fastighet') || sector.includes('real estate')) {
      sectorReturn = 0.07;
    } else if (sector.includes('index') || sector.includes('etf')) {
      sectorReturn = 0.08;
    } else if (sector.includes('investment')) {
      sectorReturn = 0.09;
    } else if (sector.includes('ränta') || sector.includes('obligation')) {
      sectorReturn = 0.04;
    }

    totalReturn += allocationShare * sectorReturn;
  });

  return totalReturn;
}

function calculateRiskScore(riskTolerance: string, riskComfort?: number): number {
  const baseRiskMap: Record<string, number> = {
    conservative: 3,
    moderate: 5,
    aggressive: 8,
  };

  let baseScore = baseRiskMap[(riskTolerance || '').toLowerCase()] ?? 5;

  if (typeof riskComfort === 'number') {
    baseScore = (baseScore + riskComfort) / 2;
  }

  return Math.round(baseScore);
}

function calculateConfidence(stocks: NormalizedRecommendation[], riskProfile: StoredRiskProfile): number {
  let confidence = 0.5;

  if (Array.isArray(stocks) && stocks.length >= 5) confidence += 0.2;
  if (riskProfile?.sector_interests && riskProfile.sector_interests.length > 0) confidence += 0.1;
  if (riskProfile?.investment_experience) confidence += 0.1;
  if (riskProfile?.risk_comfort_level) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function detectSector(name: string, symbol?: string, reason?: string) {
  const text = `${name} ${reason || ''}`.toLowerCase();
  const ticker = (symbol || '').toUpperCase();

  if (text.includes('bank') || /SHB|SEB|NDA|SWED/i.test(ticker)) return 'Bank';
  if (text.includes('fastighet') || /CAST|SBB|BALD/i.test(ticker)) return 'Fastighet';
  if (text.includes('investment') || text.includes('investmentbolag') || /INVE|KINNE|LATO/i.test(ticker)) return 'Investmentbolag';
  if (text.includes('index') || text.includes('global') || text.includes('etf') || /XACT|SPP|ISHARES/i.test(ticker)) return 'Indexfond';
  if (text.includes('tech') || text.includes('teknik') || /NVDA|AAPL|MSFT|EVO|ADBE/i.test(ticker)) return 'Teknik';
  if (text.includes('ränta') || text.includes('obligation') || /IBXX|AGGH/i.test(ticker)) return 'Räntefond';
  return 'Allmän';
}

function ensureSum100(items: Array<{ allocation?: number }>) {
  if (!items || items.length === 0) {
    return;
  }

  let total = 0;
  items.forEach(item => {
    if (typeof item.allocation !== 'number' || Number.isNaN(item.allocation)) {
      item.allocation = 0;
    }
    item.allocation = Math.round(item.allocation);
    total += item.allocation;
  });

  const diff = 100 - total;
  if (diff !== 0) {
    const last = items[items.length - 1];
    last.allocation = Math.max(0, (last.allocation || 0) + diff);
  }
}
