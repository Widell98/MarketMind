
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STRATEGY_MODEL = Deno.env.get('OPENAI_STRATEGY_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

const extractOpenAIResponseText = (data: any): string => {
  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (Array.isArray(item?.content)) {
        const text = item.content
          .map((part: { text?: string }) => part?.text?.trim?.())
          .filter(Boolean)
          .join('\n')
          .trim();
        if (text) {
          return text;
        }
      }
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const quotaExceededResponse = () =>
  jsonResponse({
    success: false,
    error: 'quota_exceeded',
    message: 'Du har nått din dagliga gräns för OpenAI API-användning. Vänligen kontrollera din fakturering eller försök igen senare.'
  }, 429);

const INVESTMENT_COMPANY_KEYWORDS = [
  'investor',
  'investment',
  'industrivärden',
  'industrivarden',
  'latour',
  'kinnevik',
  'lundberg',
  'svolder',
  'bure',
  'oresund',
  'ratos',
  'traction',
  'börsnoterade investmentbolag',
  'berkshire',
  'brookfield'
];

const INDEX_KEYWORDS = [
  'global',
  'world',
  'index',
  'etf',
  'ishares',
  'xact',
  'sp500',
  's&p',
  'msci',
  'vanguard',
  'lyxor',
  'all world',
  'core'
];

const DEFENSIVE_KEYWORDS = [
  'hälsa',
  'health',
  'sjukvård',
  'medic',
  'pharma',
  'biotech',
  'försvar',
  'defence',
  'defense',
  'säkerhet',
  'dagligvaror',
  'consumer staples',
  'livsmedel',
  'utility',
  'utilities',
  'vatten',
  'vattenkraft'
];

const CASHFLOW_KEYWORDS = [
  'bank',
  'finans',
  'financial',
  'försäkring',
  'lån',
  'real estate',
  'fastighet',
  'property',
  'reits',
  'utdelning',
  'dividend',
  'inkomst',
  'yield',
  'energi',
  'energy',
  'kraft',
  'infrastruktur',
  'telekom',
  'telecom',
  'telecommunications'
];

const GROWTH_KEYWORDS = [
  'tech',
  'teknik',
  'innovation',
  'ai',
  'cloud',
  'software',
  'spel',
  'gaming',
  'digital',
  'småbolag',
  'growth',
  'förnybar',
  'renewable',
  'grön',
  'clean energy',
  'elbil',
  'ev',
  'cyklisk',
  'cyclical',
  'lyx',
  'luxury'
];

const CASHFLOW_TICKERS = /SHB|SEB|NDA|SWED|AVANZ|CAST|SBB|BALD|FABG|KO|PEP|T|TEL2|TELIA|VNQ|XACTHYG|LUNE|EQNR|MAIN|O\b/;
const DEFENSIVE_TICKERS = /AZN|NVO|JNJ|MRK|ABBV|BMY|AXFO|ICA|WMT|KO|PEP|NG/;
const GROWTH_TICKERS = /NVDA|AAPL|MSFT|GOOGL|META|AMZN|TSLA|ADBE|CRM|SHOP|SNOW|EVO|SINCH|SPOT|SECT B/;

const PORTFOLIO_RESPONSE_FORMAT = {
  type: 'json_schema',
  name: 'portfolio_strategy_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      plan: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action_summary: { type: 'string' },
          risk_alignment: { type: 'string' },
          next_steps: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          recommended_assets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                ticker: { type: 'string' },
                allocation_percent: { type: 'number' },
                rationale: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
      },
      recommended_assets: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            symbol: { type: 'string' },
            allocation: { type: 'number' },
            sector: { type: 'string' },
            reasoning: { type: 'string' },
          },
          required: ['name'],
        },
      },
      complementary_ideas: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
} as const;

function detectSector(name: string, symbol?: string) {
  const n = name.toLowerCase();
  const s = (symbol || '').toUpperCase();

  if (INVESTMENT_COMPANY_KEYWORDS.some(keyword => n.includes(keyword))) {
    return 'Investmentbolag';
  }

  if (INDEX_KEYWORDS.some(keyword => n.includes(keyword)) || /ETF|INDEX|MSCI/.test(s)) {
    return 'Indexfond';
  }

  if (CASHFLOW_KEYWORDS.some(keyword => n.includes(keyword)) || CASHFLOW_TICKERS.test(s)) {
    if (n.includes('fastighet') || /CAST|SBB|BALD|FABG/.test(s)) {
      return 'Fastighet';
    }
    if (n.includes('bank') || /SHB|SEB|NDA|SWED|AVANZ/.test(s)) {
      return 'Bank';
    }
    if (n.includes('tele') || /TEL2|TELIA|T\b/.test(s)) {
      return 'Telekom';
    }
    if (n.includes('energi') || n.includes('energy') || /LUNE|EQNR|NESTE/.test(s)) {
      return 'Energi';
    }
    return 'Kassaflöde';
  }

  if (DEFENSIVE_KEYWORDS.some(keyword => n.includes(keyword)) || DEFENSIVE_TICKERS.test(s)) {
    if (n.includes('hälsa') || n.includes('health') || n.includes('pharma') || /AZN|NVO|BMY|MRK|ABBV/.test(s)) {
      return 'Hälsovård';
    }
    if (n.includes('dagligvaror') || n.includes('consumer') || n.includes('mat') || /AXFO|ICA/.test(s)) {
      return 'Dagligvaror';
    }
    if (n.includes('försvar') || n.includes('defence') || /SAAB/.test(s)) {
      return 'Försvar';
    }
    return 'Defensiv';
  }

  if (GROWTH_KEYWORDS.some(keyword => n.includes(keyword)) || GROWTH_TICKERS.test(s)) {
    if (n.includes('förnybar') || n.includes('renewable') || n.includes('grön') || /NIBE|ORSTED/.test(s)) {
      return 'Förnybar energi';
    }
    if (n.includes('spel') || n.includes('gaming') || /EVO|EMBRAC|STORY|STILL/.test(s)) {
      return 'Gaming & Underhållning';
    }
    return 'Teknik';
  }

  if (n.includes('industri') || /ATCO|VOLV|SAND|ABB|HEXAB|SKF/.test(s)) {
    return 'Industri';
  }

  if (n.includes('konsument') || n.includes('consumer') || n.includes('retail') || /HM B|HMB|ADIDAS|LVMH/.test(s)) {
    return 'Konsument';
  }

  return 'Allmän';
}

const RISK_ROLE_CANONICAL: Record<string, string> = {
  bas: 'Bas',
  grund: 'Bas',
  core: 'Bas',
  trygg: 'Bas',
  stabil: 'Skydd',
  stabilitet: 'Skydd',
  defensiv: 'Skydd',
  skydd: 'Skydd',
  säkring: 'Skydd',
  kassaflöde: 'Kassaflöde',
  income: 'Kassaflöde',
  utdelning: 'Kassaflöde',
  dividend: 'Kassaflöde',
  tillväxt: 'Tillväxt',
  growth: 'Tillväxt',
  offensiv: 'Tillväxt',
  komplettering: 'Komplettering',
  satellite: 'Komplettering'
};

const isCanonicalRiskRole = (value: string | null | undefined) =>
  value === 'Bas' || value === 'Tillväxt' || value === 'Skydd' || value === 'Kassaflöde' || value === 'Komplettering';

function normalizeRiskRoleValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.toLowerCase();
  const mapped = RISK_ROLE_CANONICAL[normalized];
  if (mapped) {
    return mapped;
  }
  if (isCanonicalRiskRole(trimmed)) {
    return trimmed;
  }
  return null;
}

function deriveRiskRoleFromSector(
  sector: string | undefined,
  name: string | undefined
): string | null {
  const sectorValue = (sector || '').toLowerCase();
  const nameValue = (name || '').toLowerCase();

  if (!sectorValue && !nameValue) {
    return null;
  }

  const sectorMatchers = [sectorValue, nameValue].filter(Boolean) as string[];

  const sectorHas = (regex: RegExp) => sectorMatchers.some(value => regex.test(value));

  if (sectorHas(/investment|investmentbolag|indexfond|index|etf|global|världen|all world|core/)) {
    return 'Bas';
  }

  if (sectorHas(/bank|finans|financial|försäkring|fastighet|property|reits|utdelning|dividend|yield|cashflow|kassaflöde|telekom|telecom|energi|energy|infrastruktur/)) {
    return 'Kassaflöde';
  }

  if (sectorHas(/hälsa|health|sjukvård|medic|pharma|biotech|dagligvaror|consumer staples|defensiv|försvar|defence|säkerhet|utility|utilities|vatten|vattenkraft/)) {
    return 'Skydd';
  }

  if (sectorHas(/tech|teknik|innovation|ai|cloud|software|spel|gaming|digital|småbolag|growth|förnybar|renewable|grön|clean energy|elbil|ev|cyklisk|cyclical|industri|konsument|luxury|lyx/)) {
    return 'Tillväxt';
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { riskProfileId, userId, conversationPrompt, conversationData } = await req.json();

    console.log('Generate portfolio request:', {
      riskProfileId,
      userId,
      hasConversationPrompt: Boolean(conversationPrompt),
      hasConversationData: conversationData && typeof conversationData === 'object'
    });

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

    // Enhanced system persona for initial portfolio advisor
    let contextInfo = 'KLIENTDATA OCH TIDIGARE SAMTAL:';

    let conversationSummary = '';

    if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
      const rawData = conversationData as Record<string, unknown>;
      const details: string[] = [];

      const asString = (value: unknown) => typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
      const asNumber = (value: unknown) => {
        if (typeof value === 'number' && !Number.isNaN(value)) return value;
        if (typeof value === 'string') {
          const numeric = Number(value.replace(/[^\d.-]/g, ''));
          return Number.isFinite(numeric) ? numeric : null;
        }
        return null;
      };
      const asStringArray = (value: unknown) => {
        if (!Array.isArray(value)) return null;
        const parsed = value
          .map(item => (typeof item === 'string' && item.trim().length > 0 ? item.trim() : null))
          .filter((item): item is string => Boolean(item));
        return parsed.length > 0 ? parsed : null;
      };

      const addDetail = (label: string, value: string | number | null) => {
        if (value !== null && value !== '') {
          details.push(`${label}: ${value}`);
        }
      };

      const addArrayDetail = (label: string, value: unknown) => {
        const arr = asStringArray(value);
        if (arr) {
          details.push(`${label}: ${arr.join(', ')}`);
        }
      };

      const experienceLabel = asString(rawData.marketExperience)
        || (typeof rawData.isBeginnerInvestor === 'boolean'
          ? rawData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren'
          : null);

      addDetail('Investeringsmål', asString(rawData.investmentGoal));
      addDetail('Sökt portföljstorlek', asString(rawData.portfolioSize));
      addDetail('Investerarens erfarenhet', experienceLabel);
      addDetail('Önskad investeringsstil', asString(rawData.investmentStyle));
      addDetail('Utdelningskrav', asString(rawData.dividendYieldRequirement));
      addDetail('Hållbarhetsfokus', asString(rawData.sustainabilityPreference));
      addDetail('Geografisk inriktning', asString(rawData.geographicPreference));
      addDetail('Reaktion på börsras', asString(rawData.marketCrashReaction));

      const comfort = typeof rawData.volatilityComfort === 'number' ? rawData.volatilityComfort
        : typeof rawData.volatilityComfort === 'string' ? Number(rawData.volatilityComfort) : null;
      addDetail('Volatilitetskomfort (1-10)', comfort !== null && Number.isFinite(comfort) ? comfort : null);

      const monthlyIncome = asNumber(rawData.monthlyIncome);
      addDetail('Månadsinkomst', monthlyIncome !== null && Number.isFinite(monthlyIncome) ? `${monthlyIncome.toLocaleString('sv-SE')} SEK` : null);

      const annualIncome = asNumber(rawData.annualIncome);
      addDetail('Årsinkomst', annualIncome !== null && Number.isFinite(annualIncome) ? `${annualIncome.toLocaleString('sv-SE')} SEK` : null);

      const capital = asNumber(rawData.availableCapital);
      addDetail('Tillgängligt kapital', capital !== null && Number.isFinite(capital) ? `${capital.toLocaleString('sv-SE')} SEK` : null);

      const liquidCapital = asNumber(rawData.liquidCapital);
      addDetail('Likvida medel', liquidCapital !== null && Number.isFinite(liquidCapital) ? `${liquidCapital.toLocaleString('sv-SE')} SEK` : null);

      if (typeof rawData.housingSituation === 'string') {
        addDetail('Bostadssituation', rawData.housingSituation);
      }

      if (typeof rawData.hasLoans === 'boolean') {
        addDetail('Har lån', rawData.hasLoans ? 'Ja' : 'Nej');
      }

      if (typeof rawData.loanDetails === 'string' && rawData.loanDetails.trim().length > 0) {
        addDetail('Lånedetaljer', rawData.loanDetails);
      }

      if (typeof rawData.hasChildren === 'boolean') {
        addDetail('Har försörjningsansvar', rawData.hasChildren ? 'Ja' : 'Nej');
      }

      if (typeof rawData.emergencyFund === 'string') {
        const emergencyMap: Record<string, string> = {
          yes_full: 'Full buffert',
          yes_partial: 'Delvis buffert',
          no: 'Ingen buffert'
        };
        addDetail('Buffertstatus', emergencyMap[rawData.emergencyFund] || rawData.emergencyFund);
      }

      if (typeof rawData.emergencyBufferMonths === 'number' && Number.isFinite(rawData.emergencyBufferMonths)) {
        addDetail('Buffert (månader)', rawData.emergencyBufferMonths);
      }

      addArrayDetail('Ekonomiska åtaganden', rawData.financialObligations);
      addArrayDetail('Föredragna sektorer', rawData.sectors || rawData.sectorExposure);
      addArrayDetail('Särskilda intressen', rawData.interests);
      addArrayDetail('Föredragna bolag', rawData.companies);
      addArrayDetail('Investeringssyften', rawData.investmentPurpose);

      const targetAmount = asNumber(rawData.targetAmount ?? rawData.specificGoalAmount);
      addDetail('Målbelopp', targetAmount !== null && Number.isFinite(targetAmount) ? `${targetAmount.toLocaleString('sv-SE')} SEK` : null);

      addDetail('Måldatum', asString(rawData.targetDate));

      if (typeof rawData.preferredStockCount === 'number' && Number.isFinite(rawData.preferredStockCount)) {
        addDetail('Önskat antal innehav', rawData.preferredStockCount);
      }

      if (typeof rawData.controlImportance === 'number' && Number.isFinite(rawData.controlImportance)) {
        addDetail('Kontrollbehov (1-5)', rawData.controlImportance);
      }

      if (typeof rawData.panicSellingHistory === 'boolean') {
        addDetail('Historik av panikförsäljning', rawData.panicSellingHistory ? 'Ja' : 'Nej');
      }

      addDetail('Aktivitetsnivå', asString(rawData.activityPreference));
      addDetail('Ombalanseringsfrekvens', asString(rawData.portfolioChangeFrequency || rawData.rebalancingFrequency));
      addDetail('Medvetenhet om överexponering', asString(rawData.overexposureAwareness));

      const currentPortfolioValue = asNumber(rawData.currentPortfolioValue);
      addDetail('Nuvarande portföljvärde (rapport)', currentPortfolioValue !== null && Number.isFinite(currentPortfolioValue) ? `${currentPortfolioValue.toLocaleString('sv-SE')} SEK` : null);

      const helpNeeded = asString(rawData.portfolioHelp);
      if (helpNeeded) {
        details.push(`Specifikt stöd som efterfrågas: ${helpNeeded}`);
      }

      addDetail('Önskad kommunikationsstil', asString(rawData.communicationStyle));
      addDetail('Önskad svarslängd', asString(rawData.preferredResponseLength));

      if (typeof rawData.additionalNotes === 'string' && rawData.additionalNotes.trim().length > 0) {
        details.push(`Ytterligare anteckningar: ${rawData.additionalNotes.trim()}`);
      }

      if (details.length > 0) {
        conversationSummary = details.map(detail => `- ${detail}`).join('\n');
        contextInfo += `\n\nFÖRDJUPAD KUNDKONVERSATION:\n${conversationSummary}`;
      }
    }

    // Add detailed user profile information
    if (riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL:
- Ålder: ${riskProfile.age || 'Ej angivet'} år
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Tidshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (0–2 år)' : riskProfile.investment_horizon === 'medium' ? 'Medel (3–5 år)' : 'Lång (5+ år)'}
- Månatlig budget: ${riskProfile.monthly_investment_amount ? riskProfile.monthly_investment_amount.toLocaleString() + ' SEK' : 'Ej angivet'}
- Riskkomfort: ${riskProfile.risk_comfort_level || 5}/10
- Sektorintressen: ${riskProfile.sector_interests ? riskProfile.sector_interests.join(', ') : 'Allmänna'}`;
      
      if (riskProfile.annual_income) {
        contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
      }
      
      if (riskProfile.liquid_capital) {
        contextInfo += `\n- Tillgängligt kapital: ${riskProfile.liquid_capital.toLocaleString()} SEK`;
      }

      if (riskProfile.investment_goal) {
        contextInfo += `\n- Investeringsmål: ${riskProfile.investment_goal}`;
      }

      if (riskProfile.market_crash_reaction) {
        contextInfo += `\n- Reaktion på börskrasch: ${riskProfile.market_crash_reaction}`;
      }
    }

    // Add AI memory to personalize further
    if (aiMemory) {
      const favSectors = Array.isArray(aiMemory.favorite_sectors) && aiMemory.favorite_sectors.length ? aiMemory.favorite_sectors.join(', ') : null;
      const prefCompanies = Array.isArray(aiMemory.preferred_companies) && aiMemory.preferred_companies.length ? aiMemory.preferred_companies.join(', ') : null;
      const style = aiMemory.communication_style || null;
      const respLen = aiMemory.preferred_response_length || null;
      contextInfo += `\n\nAI-MINNEN OCH PREFERENSER:${favSectors ? `\n- Favoritsektorer: ${favSectors}` : ''}${prefCompanies ? `\n- Föredragna bolag: ${prefCompanies}` : ''}${style ? `\n- Kommunikationsstil: ${style}` : ''}${respLen ? `\n- Föredragen svarslängd: ${respLen}` : ''}`;
    }

    if (existingSymbols.size > 0) {
      contextInfo += `\n\nNUVARANDE INNEHAV (UNDVIK DESSA I REKOMMENDATIONER):`;
      Array.from(existingSymbols).forEach(symbol => {
        contextInfo += `\n- ${symbol}`;
      });
      
      contextInfo += `\n\nVIKTIGT: Föreslå ALDRIG aktier som användaren redan äger.`;
    }

    const interestList = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        const collected: string[] = [];
        const maybePushArray = (value: unknown) => {
          if (Array.isArray(value)) {
            value.forEach((entry) => {
              if (typeof entry === 'string' && entry.trim()) {
                collected.push(entry.trim());
              }
            });
          }
        };
        maybePushArray(raw.interests);
        maybePushArray(raw.sectors);
        maybePushArray(raw.sectorInterests);
        if (collected.length > 0) {
          return Array.from(new Set(collected)).join(', ');
        }
      }
      if (riskProfile?.sector_interests && riskProfile.sector_interests.length) {
        return riskProfile.sector_interests.join(', ');
      }
      return 'Ej angivet';
    })();

    const preferredAssets = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (Array.isArray(raw.preferredAssets)) {
          const parsed = raw.preferredAssets.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
          if (parsed.length > 0) {
            return parsed.join(', ');
          }
        }
        if (typeof raw.preferredAssets === 'string' && raw.preferredAssets.trim().length > 0) {
          return raw.preferredAssets.trim();
        }
      }
      return 'Ej angivet';
    })();

    const riskToleranceSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.riskTolerance === 'string' && raw.riskTolerance.trim().length > 0) {
          return raw.riskTolerance.trim();
        }
      }
      return riskProfile?.risk_tolerance || 'Medel';
    })();

    const investmentGoalSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.investmentGoal === 'string' && raw.investmentGoal.trim().length > 0) {
          return raw.investmentGoal.trim();
        }
      }
      return riskProfile?.investment_goal || 'Långsiktig tillväxt';
    })();

    const horizonSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.timeHorizon === 'string' && raw.timeHorizon.trim().length > 0) {
          return raw.timeHorizon.trim();
        }
      }
      return riskProfile?.investment_horizon || 'Lång';
    })();

    const availableCapitalSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.availableCapital === 'number' && Number.isFinite(raw.availableCapital)) {
          return `${raw.availableCapital.toLocaleString('sv-SE')} SEK`;
        }
        if (typeof raw.availableCapital === 'string' && raw.availableCapital.trim().length > 0) {
          return raw.availableCapital.trim();
        }
      }
      if (typeof riskProfile?.liquid_capital === 'number') {
        return `${riskProfile.liquid_capital.toLocaleString('sv-SE')} SEK`;
      }
      return 'Ej angivet';
    })();

    const experienceSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.investmentExperienceLevel === 'string' && raw.investmentExperienceLevel.trim().length > 0) {
          return raw.investmentExperienceLevel.trim();
        }
        if (typeof raw.marketExperience === 'string' && raw.marketExperience.trim().length > 0) {
          return raw.marketExperience.trim();
        }
      }
      return riskProfile?.investment_experience || 'Ej angivet';
    })();

    const monthlyInvestmentSummary = (() => {
      if (conversationData && typeof conversationData === 'object' && !Array.isArray(conversationData)) {
        const raw = conversationData as Record<string, unknown>;
        if (typeof raw.monthlyInvestmentAmount === 'number' && Number.isFinite(raw.monthlyInvestmentAmount)) {
          return `${raw.monthlyInvestmentAmount.toLocaleString('sv-SE')} SEK`;
        }
        if (typeof raw.monthlyInvestmentAmount === 'string' && raw.monthlyInvestmentAmount.trim().length > 0) {
          return raw.monthlyInvestmentAmount.trim();
        }
      }
      if (riskProfile?.monthly_investment_amount) {
        return `${riskProfile.monthly_investment_amount.toLocaleString('sv-SE')} SEK`;
      }
      return 'Ej angivet';
    })();

    const serializedConversationData = conversationData && typeof conversationData === 'object'
      ? JSON.stringify(conversationData, null, 2)
      : '{}';

    const systemPrompt = `Du är en svensk licensierad och auktoriserad investeringsrådgivare med lång erfarenhet av att skapa skräddarsydda portföljer. Du följer Finansinspektionens regler och MiFID II, prioriterar kundens mål, tidshorisont och riskkapacitet samt kommunicerar tydligt på svenska.

Tillgänglig klientinformation:
${contextInfo}

Rådgivningsregler:
- Basera rekommendationerna på användarens mål, tidsram, likvida medel och intressen. Använd endast riskprofilen om användaren uttryckligen efterfrågar riskanpassade råd i sin senaste instruktion.
- Säkerställ att portföljen är diversifierad och att varje innehav har en tydlig roll (Bas, Tillväxt, Skydd eller Kassaflöde).
- Justera antalet tillgångar efter kundens önskemål (normalt 3–8 poster) och undvik dubletter mot befintliga innehav.
- Alla förslag ska vara tillgängliga via svenska handelsplattformar (Avanza, Nordnet) och lämpa sig för ISK/KF när det är relevant.

Regler för preferenser:
- Om användaren visar intresse för krypto, teknik eller tillväxt: inkludera kryptorelaterade och högbeta-tillgångar i rimlig andel.
- Om användaren har hållbarhetsfokus: inkludera investmentbolag med tydligt hållbarhetsarbete och gröna kvalitetsbolag (t.ex. Latour, Öresund, Boliden, NIBE).
- Om risktoleransen är konservativ: prioritera investmentbolag, defensiva aktier (Investor, Axfood) och eventuellt räntebärande alternativ.
- Om risktoleransen är balanserad: kombinera investmentbolag och stabila aktier från Sverige, USA eller andra etablerade marknader med internationell exponering.
- Om risktoleransen är aggressiv: inkludera tillväxt, småbolag, krypto och innovativa sektorer.
- Om användaren efterfrågar investmentbolag: inkludera exempelvis Investor, Latour eller Kinnevik samt gärna väletablerade internationella alternativ som Berkshire Hathaway eller Brookfield.
- Om kunden vill ha svenska företag: fokusera på OMX-noterade bolag och investmentbolag.

Formatkrav:
- Leverera svaret som giltig JSON utan extra text.
- Använd exakt strukturen:
{
  "summary": "5-6 meningar om varför portföljen passar användaren",
  "risk_alignment": "Hur portföljen matchar risktolerans och mål",
  "next_steps": ["Konkreta råd för nästa steg"],
  "recommended_assets": [
    {
      "name": "Exakt namn på aktie eller investmentbolag",
      "ticker": "Ticker",
      "sector": "Sektor",
      "allocation_percent": 0,
      "rationale": "Analys kopplad till användarens mål och risk",
      "risk_role": "Bas / Tillväxt / Skydd / Kassaflöde"
    }
  ],
  "disclaimer": "Kort juridiskt förbehåll på svenska"
}
- Summan av allocation_percent ska vara 100 och varje post måste innehålla analys, portföljroll och tydlig koppling till kundprofilen.
- Föreslå aldrig identiska portföljer till olika användare och återanvänd inte samma textblock.
- Ange alltid korrekt ticker för varje rekommendation.
- Undvik överdrivna varningar men påminn om risk och att historisk avkastning inte garanterar framtida resultat.
`;

    const baseRiskProfileSummary = `Riskprofil (sammanfattning):
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Årsinkomst: ${riskProfile.annual_income ? riskProfile.annual_income.toLocaleString('sv-SE') + ' SEK' : 'Ej angiven'}
- Månatligt investeringsbelopp: ${monthlyInvestmentSummary}
- Risktolerans: ${riskProfile.risk_tolerance || 'Medel'}
- Investeringsmål: ${riskProfile.investment_goal || 'Långsiktig tillväxt'}
- Tidshorisont: ${riskProfile.investment_horizon || 'Lång'}
- Erfarenhet: ${riskProfile.investment_experience || 'Medel'}
- Riskkomfort: ${riskProfile.risk_comfort_level || 5}/10
- Intressesektorer: ${riskProfile.sector_interests && riskProfile.sector_interests.length ? riskProfile.sector_interests.join(', ') : 'Ej angivet'}
- Nuvarande portföljvärde: ${riskProfile.current_portfolio_value ? riskProfile.current_portfolio_value.toLocaleString('sv-SE') + ' SEK' : '0 SEK'}`;

    const userMessage = `Skapa en personlig portfölj baserad på följande användardata:

${serializedConversationData}

Tänk särskilt på:

Risktolerans: ${riskToleranceSummary}
Investeringsmål: ${investmentGoalSummary}
Tidshorisont: ${horizonSummary}
Intressen/Sektorer: ${interestList}
Mest intresserad av: ${preferredAssets}
Tillgängligt kapital: ${availableCapitalSummary}
Månatligt investeringsbelopp: ${monthlyInvestmentSummary}
Erfarenhetsnivå: ${experienceSummary}

⚙️ Anpassa rekommendationerna:
- Om användaren gillar krypto eller teknik → inkludera mer risk och tillväxt.
- Om användaren prioriterar hållbarhet → fokusera på investmentbolag med hållbarhetsprofil och gröna bolag.
- Om användaren är konservativ → ge defensiva och stabila innehav.
- Om användaren är balanserad → kombinera investmentbolag och stabila bolag från Sverige, USA eller andra etablerade marknader tillsammans med internationella kvalitetsaktier.
- Om användaren är aggressiv → inkludera tillväxtaktier, krypto och innovativa ETF:er.

Svara ENDAST med giltig JSON enligt formatet i systeminstruktionen och säkerställ att all text är på svenska.`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    messages.push({ role: 'user', content: userMessage });

    if (conversationPrompt && typeof conversationPrompt === 'string' && conversationPrompt.trim().length > 0) {
      messages.push({ role: 'user', content: conversationPrompt.trim() });
    }

    messages.push({ role: 'user', content: baseRiskProfileSummary });

    if (conversationSummary) {
      messages.push({ role: 'user', content: `Fördjupad samtalskontext:\n${conversationSummary}` });
    }

    if (conversationData && typeof conversationData === 'object') {
      try {
        messages.push({ role: 'user', content: `Rå konsultationsdata (JSON):\n${JSON.stringify(conversationData)}` });
      } catch (jsonError) {
        console.warn('Could not serialize conversationData for OpenAI message:', jsonError);
      }
    }

    console.log('Calling OpenAI API with', STRATEGY_MODEL, '...');

    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: STRATEGY_MODEL,
        input: messages,
        temperature: 0.85,
        max_output_tokens: 2500,
        text: {
          format: PORTFOLIO_RESPONSE_FORMAT,
        },
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);

      // Handle specific quota exceeded error
      if (openAIResponse.status === 429) {
        return quotaExceededResponse();
      }

      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiRecommendationsRaw = extractOpenAIResponseText(openAIData);

    console.log('OpenAI full response:', JSON.stringify(openAIData, null, 2));
    console.log('AI recommendations received:', aiRecommendationsRaw);

    if (!aiRecommendationsRaw) {
      console.error('No AI recommendations received from OpenAI');
      throw new Error('No AI response received from OpenAI');
    }

    let { plan: structuredPlan, recommendedStocks } = extractStructuredPlan(aiRecommendationsRaw, riskProfile);

    if (!structuredPlan || recommendedStocks.length === 0) {
      console.warn('Structured plan missing, attempting fallback parsing of AI response.');
      const fallbackPlan = buildFallbackPlanFromText(aiRecommendationsRaw, riskProfile);
      if (fallbackPlan) {
        structuredPlan = fallbackPlan.plan;
        recommendedStocks = fallbackPlan.recommendedStocks;
      }
    }

    if (!structuredPlan || recommendedStocks.length === 0) {
      console.error('AI response was missing structured recommendations even after fallback. Raw output:', aiRecommendationsRaw);
      return jsonResponse({
        success: true,
        aiRecommendations: aiRecommendationsRaw,
        aiResponse: aiRecommendationsRaw,
        aiResponseRaw: aiRecommendationsRaw,
        plan: null,
        confidence: 0,
        recommendedStocks: [],
        portfolio: null,
        warning: 'AI kunde inte struktureras till en portfölj. Råtext returneras utan att skapa portfölj.'
      });
    }

    ensureSum100(recommendedStocks);
    const normalizedResponse = JSON.stringify(structuredPlan, null, 2);

    // Create portfolio record
    const portfolioData = {
      user_id: userId,
      risk_profile_id: riskProfileId,
      portfolio_name: 'AI-Genererad Portfölj',
      asset_allocation: {
        allocation_summary: calculateAssetAllocation(recommendedStocks),
        structured_plan: structuredPlan,
      },
      recommended_stocks: recommendedStocks,
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

    console.log('Returning response with normalized plan:', normalizedResponse.substring(0, 200));

    return jsonResponse({
      success: true,
      portfolio: portfolio,
      aiRecommendations: normalizedResponse,
      aiResponse: normalizedResponse,
      aiResponseRaw: aiRecommendationsRaw,
      plan: structuredPlan,
      confidence: calculateConfidence(recommendedStocks, riskProfile),
      recommendedStocks: recommendedStocks
    });

  } catch (error) {
    console.error('Error in generate-portfolio function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a quota-related error
    if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
      return quotaExceededResponse();
    }

    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
});

function calculateAssetAllocation(stocks: Array<{allocation: number, sector?: string}>): any {
  let stocksTotal = 0;
  let bondsTotal = 0;
  let cashTotal = 0;
  
  stocks.forEach(stock => {
    if (stock.sector === 'Bank' || stock.sector === 'Fastighet') {
      bondsTotal += stock.allocation;
    } else {
      stocksTotal += stock.allocation;
    }
  });
  
  // Ensure total is 100%, adjust cash accordingly
  const total = stocksTotal + bondsTotal;
  if (total < 100) {
    cashTotal = 100 - total;
  }
  
  return {
    stocks: stocksTotal,
    bonds: bondsTotal,
    cash: cashTotal
  };
}

function calculateExpectedReturn(stocks: Array<{allocation: number, sector?: string}>): number {
  // More sophisticated calculation based on sectors
  let totalReturn = 0;
  
  stocks.forEach(stock => {
    let sectorReturn = 0.08; // Default 8%
    
    switch (stock.sector) {
      case 'Teknik':
        sectorReturn = 0.12; // 12% for tech
        break;
      case 'Bank':
        sectorReturn = 0.06; // 6% for banks
        break;
      case 'Fastighet':
        sectorReturn = 0.07; // 7% for real estate
        break;
      case 'Indexfond':
        sectorReturn = 0.08; // 8% for index funds
        break;
      case 'Investmentbolag':
        sectorReturn = 0.09; // 9% for investment companies
        break;
    }
    
    totalReturn += (stock.allocation / 100) * sectorReturn;
  });
  
  return totalReturn;
}

function calculateRiskScore(riskTolerance: string, riskComfort?: number): number {
  const baseRiskMap: {[key: string]: number} = {
    'conservative': 3,
    'moderate': 5,
    'aggressive': 8
  };
  
  let baseScore = baseRiskMap[riskTolerance] || 5;
  
  // Adjust based on risk comfort level if available
  if (riskComfort) {
    baseScore = (baseScore + riskComfort) / 2;
  }
  
  return Math.round(baseScore);
}

function calculateConfidence(stocks: Array<any>, riskProfile: any): number {
  let confidence = 0.5; // Base confidence
  
  if (stocks.length >= 5) confidence += 0.2; // Good diversification
  if (riskProfile.sector_interests && riskProfile.sector_interests.length > 0) confidence += 0.1; // Has preferences
  if (riskProfile.investment_experience) confidence += 0.1; // Has experience data
  if (riskProfile.risk_comfort_level) confidence += 0.1; // Has risk comfort data
  
  return Math.min(confidence, 1.0);
}

// --- Fallback helpers to guarantee a usable response ---
function ensureSum100(items: Array<{ allocation: number }>) {
  // Round allocations and fix total to 100
  let total = items.reduce((acc, it) => acc + Math.round(it.allocation), 0);
  items.forEach(it => (it.allocation = Math.round(it.allocation)));
  const diff = 100 - total;
  if (items.length > 0 && diff !== 0) {
    items[items.length - 1].allocation = Math.max(0, items[items.length - 1].allocation + diff);
  }
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(entry => (entry != null ? String(entry).trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map(entry => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function parseAllocationPercent(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(?:[.,]\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0].replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return Math.max(0, Math.min(100, Math.round(parsed)));
      }
    }
  }
  return 0;
}

function describeRiskLevel(riskProfile: any): string {
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (tolerance === 'conservative') return 'en konservativ och trygg';
  if (tolerance === 'aggressive') return 'en offensiv och tillväxtorienterad';
  return 'en balanserad';
}

function describeHorizon(riskProfile: any): string {
  const horizon = (riskProfile?.investment_horizon || 'long').toLowerCase();
  if (horizon === 'short') return 'kort (0–2 år)';
  if (horizon === 'medium') return 'medellång (3–5 år)';
  return 'lång (5+ år)';
}

function formatCurrency(amount?: number | null): string | null {
  if (!amount || !Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('sv-SE').format(Math.round(amount));
  } catch (_error) {
    return String(Math.round(amount));
  }
}

function buildDefaultNextSteps(riskProfile: any): string[] {
  const monthlyAmount = formatCurrency(riskProfile?.monthly_investment_amount);
  const followUpInterval = (riskProfile?.risk_tolerance || 'moderate').toLowerCase() === 'aggressive' ? 'var tredje månad' : 'var sjätte månad';

  const steps: string[] = [];
  if (monthlyAmount) {
    steps.push(`1. Sätt upp ett automatiskt månadssparande på cirka ${monthlyAmount} SEK in på ditt ISK/KF.`);
  } else {
    steps.push('1. Sätt upp ett automatiskt månadssparande som passar din budget in på ditt ISK/KF.');
  }
  steps.push('2. Köp varje rekommenderat innehav i två till tre delköp under de kommande fyra veckorna för att sprida marknadsrisken.');
  steps.push(`3. Planera in en portföljgenomgång ${followUpInterval} för att säkerställa att allokeringen ligger kvar kring målvikterna.`);
  steps.push('4. Behåll en buffert motsvarande 3–6 månaders utgifter på sparkonto innan du ökar risken ytterligare.');
  return steps;
}

function fallbackActionSummary(riskProfile: any): string {
  const goal = (riskProfile?.investment_goal || 'långsiktig tillväxt').toLowerCase();
  return `Portföljen är utformad för ${goal} med ${describeRiskLevel(riskProfile)} riskprofil och en ${describeHorizon(riskProfile)} sparhorisont. Rekommendationerna tar hänsyn till dina svar och undviker nuvarande innehav.`;
}

function fallbackRiskAlignment(riskProfile: any): string {
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (tolerance === 'conservative') {
    return 'Tyngdpunkten ligger på stabila investmentbolag och kvalitetsbolag med lägre volatilitet för att skydda kapitalet samtidigt som tillväxtpotential finns kvar.';
  }
  if (tolerance === 'aggressive') {
    return 'Portföljen kombinerar basinvestmentbolag med offensiva tillväxtbolag så att du får högre avkastningspotential men med tillräcklig riskspridning.';
  }
  return 'Mixen av ledande investmentbolag och selektiva kvalitetsbolag ger en balanserad risk där både stabilitet och tillväxt vägs in.';
}

function determineRiskRole(
  stock: { sector?: string; name?: string; symbol?: string; risk_role?: string; role?: string },
  riskProfile: any
): string {
  const providedRole = normalizeRiskRoleValue(stock.risk_role || stock.role);
  const detectedSector = stock.sector || (stock.name ? detectSector(stock.name, stock.symbol) : undefined);
  const sectorRole = deriveRiskRoleFromSector(detectedSector, stock.name);

  if (sectorRole && providedRole) {
    if (sectorRole === providedRole) {
      return sectorRole;
    }

    if (providedRole === 'Tillväxt' && sectorRole !== 'Tillväxt') {
      return sectorRole;
    }

    if (providedRole === 'Bas' && sectorRole && sectorRole !== 'Bas' && sectorRole !== 'Komplettering') {
      return sectorRole;
    }

    if (providedRole === 'Skydd' && sectorRole === 'Kassaflöde') {
      return sectorRole;
    }

    return providedRole;
  }

  if (sectorRole) {
    return sectorRole;
  }

  if (providedRole) {
    return providedRole;
  }

  const tolerance = String(riskProfile?.risk_tolerance || 'balanced').toLowerCase();
  if (/(konservativ|conservative|låg)/.test(tolerance)) {
    return 'Skydd';
  }
  if (/(aggressiv|aggressive|hög|high|offensiv)/.test(tolerance)) {
    return 'Tillväxt';
  }
  return 'Bas';
}

function buildSectorRationale(stock: { name: string; sector?: string }, riskProfile: any): string {
  const sector = stock.sector || 'marknaden';
  const tolerance = (riskProfile?.risk_tolerance || 'moderate').toLowerCase();
  if (sector === 'Indexfond') {
    return 'Bred indexexponering som ger låga avgifter och stabil bas i portföljen.';
  }
  if (sector === 'Investmentbolag') {
    return 'Sprider risk genom en korg av nordiska kvalitetsbolag med bevisad historik.';
  }
  if (sector === 'Bank') {
    return 'Starkt kassaflöde och utdelningar som dämpar svängningar i portföljen.';
  }
  if (sector === 'Fastighet') {
    return 'Ger exponering mot realtillgångar och kompletterar aktiedelen.';
  }
  if (sector === 'Teknik') {
    return tolerance === 'aggressive'
      ? 'Tillför högre tillväxtpotential inom innovativa bolag.'
      : 'Ger kontrollerad tillväxt via etablerade teknikbolag med starka balansräkningar.';
  }
  return `Ger diversifiering inom ${sector.toLowerCase()} och kompletterar helheten.`;
}

function extractStructuredPlan(rawText: string, riskProfile: any): { plan: any | null; recommendedStocks: Array<{ name: string; symbol?: string; allocation: number; sector?: string; reasoning?: string }> } {
  try {
    const sanitized = sanitizeJsonLikeString(rawText);
    if (!sanitized) {
      return { plan: null, recommendedStocks: [] };
    }

    const parsed = JSON.parse(sanitized);
    const planCandidate = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    if (!planCandidate) {
      return { plan: null, recommendedStocks: [] };
    }

    const assetCandidates = Array.isArray((planCandidate as any).recommended_assets)
      ? (planCandidate as any).recommended_assets
      : Array.isArray((planCandidate as any).recommendations)
        ? (planCandidate as any).recommendations
        : [];

    const normalizedAssets = assetCandidates
      .map((asset: any) => {
        if (!asset) return null;
        const name = asset.name || asset.asset || asset.title;
        if (!name) return null;
        const ticker = asset.ticker || asset.symbol || asset.code || '';
        const allocation = parseAllocationPercent(asset.allocation_percent ?? asset.allocation ?? asset.weight);
        const rationale = asset.rationale || asset.reasoning || asset.analysis || '';
        const sector = asset.sector || detectSector(String(name), ticker ? String(ticker) : undefined);
        const riskRole = determineRiskRole(
          {
            sector,
            name: String(name).trim(),
            symbol: ticker ? String(ticker).trim() : undefined,
            risk_role: asset.risk_role,
            role: asset.role
          },
          riskProfile
        );
        return {
          planAsset: {
            name: String(name).trim(),
            ticker: ticker ? String(ticker).trim() : '',
            allocation_percent: allocation,
            rationale: rationale ? String(rationale).trim() : buildSectorRationale({ name: String(name).trim(), sector }, riskProfile),
            risk_role: riskRole
          },
          stock: {
            name: String(name).trim(),
            symbol: ticker ? String(ticker).trim() : undefined,
            allocation,
            sector,
            reasoning: rationale ? String(rationale).trim() : undefined
          }
        };
      })
      .filter(Boolean) as Array<{ planAsset: any; stock: any }>;

    const recommendedStocks = normalizedAssets.map(item => item.stock);
    ensureSum100(recommendedStocks);

    const plan = {
      action_summary: planCandidate.action_summary || planCandidate.summary || fallbackActionSummary(riskProfile),
      risk_alignment: planCandidate.risk_alignment || planCandidate.risk_analysis || fallbackRiskAlignment(riskProfile),
      next_steps: toStringArray(planCandidate.next_steps || planCandidate.action_plan || planCandidate.implementation_plan || planCandidate.implementation_steps || planCandidate.follow_up || planCandidate.follow_up_steps) || buildDefaultNextSteps(riskProfile),
      recommended_assets: normalizedAssets.map((item, index) => ({
        ...item.planAsset,
        allocation_percent: recommendedStocks[index] ? recommendedStocks[index].allocation : item.planAsset.allocation_percent
      })),
      disclaimer: planCandidate.disclaimer || planCandidate.footer || 'Råden är utbildningsmaterial och ersätter inte personlig rådgivning. Investeringar innebär risk och värdet kan både öka och minska.'
    };

    if (plan.next_steps.length === 0) {
      plan.next_steps = buildDefaultNextSteps(riskProfile);
    }

    return {
      plan,
      recommendedStocks
    };
  } catch (error) {
    console.warn('Failed to parse structured plan JSON:', error);
    return { plan: null, recommendedStocks: [] };
  }
}

function buildFallbackPlanFromText(rawText: string, riskProfile: any): { plan: any; recommendedStocks: Array<{ name: string; symbol?: string; allocation: number; sector?: string; reasoning?: string }> } | null {
  const fallbackStocks = extractFallbackStocksFromText(rawText, riskProfile);
  if (fallbackStocks.length === 0) {
    return null;
  }

  ensureSum100(fallbackStocks);

  const plan = {
    action_summary: fallbackActionSummary(riskProfile),
    risk_alignment: fallbackRiskAlignment(riskProfile),
    next_steps: buildDefaultNextSteps(riskProfile),
      recommended_assets: fallbackStocks.map(stock => ({
        name: stock.name,
        ticker: stock.symbol || '',
        allocation_percent: stock.allocation,
        rationale: stock.reasoning || buildSectorRationale(stock, riskProfile),
        risk_role: determineRiskRole(stock, riskProfile)
      })),
    disclaimer: 'Råden är utbildningsmaterial och ersätter inte personlig rådgivning. Investeringar innebär risk och värdet kan både öka och minska.'
  };

  return { plan, recommendedStocks: fallbackStocks };
}

function extractFallbackStocksFromText(rawText: string, riskProfile: any): Array<{ name: string; symbol?: string; allocation: number; sector?: string; reasoning?: string }> {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const stocks: Array<{ name: string; symbol?: string; allocation: number; sector?: string; reasoning?: string }> = [];
  const seen = new Set<string>();

  const allocationRegex = /(?:\d+\.\s*|[-*•]\s*)?([A-Za-zÅÄÖåäö0-9 .,&'’\/-]{3,}?)(?:\s*\(([^)]+)\))?(?:\s*[-–—:]\s*(?:Analys|Varför|Reasoning|Roll|Rekommendation)?\s*)?(?:Allokering|Allokation|Vikt|Allocation|Andel)?\s*:?\s*(\d{1,3})\s*%/gim;
  let match: RegExpExecArray | null;

  while ((match = allocationRegex.exec(rawText)) !== null) {
    const name = match[1]?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const rawTicker = match[2]?.trim();
    const ticker = rawTicker && rawTicker.length <= 10 ? rawTicker.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : undefined;
    const allocation = Math.max(0, Math.min(100, parseInt(match[3] || '0', 10)));
    const sector = detectSector(name, ticker);

    stocks.push({
      name,
      symbol: ticker,
      allocation,
      sector,
      reasoning: buildSectorRationale({ name, sector }, riskProfile)
    });
    seen.add(key);
  }

  if (stocks.length === 0) {
    const bulletRegex = /(?:\d+\.\s*|[-*•]\s*)([A-Za-zÅÄÖåäö0-9 .,&'’\/-]{3,}?)(?:\s*\(([^)]+)\))?(?:\s*[-–—:]\s*(.*))?/gim;
    let bulletMatch: RegExpExecArray | null;

    while ((bulletMatch = bulletRegex.exec(rawText)) !== null) {
      const name = bulletMatch[1]?.trim();
      if (!name) continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;

      const rawTicker = bulletMatch[2]?.trim();
      const ticker = rawTicker && rawTicker.length <= 10 ? rawTicker.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : undefined;
      const reasoningText = bulletMatch[3]?.trim();
      const sector = detectSector(name, ticker);

      stocks.push({
        name,
        symbol: ticker,
        allocation: 0,
        sector,
        reasoning: reasoningText && reasoningText.length > 0 ? reasoningText : buildSectorRationale({ name, sector }, riskProfile)
      });
      seen.add(key);
    }
  }

  if (stocks.length === 0) {
    return [];
  }

  let total = stocks.reduce((sum, item) => sum + (Number.isFinite(item.allocation) ? item.allocation : 0), 0);
  if (!Number.isFinite(total) || total === 0) {
    const equalWeight = Math.floor(100 / stocks.length);
    stocks.forEach(stock => {
      stock.allocation = equalWeight;
    });
    let remainder = 100 - equalWeight * stocks.length;
    let index = 0;
    while (remainder > 0 && stocks.length > 0) {
      stocks[index % stocks.length].allocation += 1;
      remainder -= 1;
      index += 1;
    }
  } else if (total !== 100) {
    const scale = 100 / total;
    stocks.forEach(stock => {
      stock.allocation = Math.round(stock.allocation * scale);
    });
    ensureSum100(stocks);
  }

  stocks.forEach(stock => {
    if (!stock.sector) {
      stock.sector = detectSector(stock.name, stock.symbol);
    }
    if (!stock.reasoning) {
      stock.reasoning = buildSectorRationale(stock, riskProfile);
    }
  });

  return stocks;
}

function sanitizeJsonLikeString(rawText: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1].trim()) {
    return fencedMatch[1].trim();
  }

  if (trimmed.startsWith('```')) {
    const withoutLeadingFence = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    if (withoutLeadingFence) {
      return withoutLeadingFence;
    }
  }

  const startIndex = trimmed.indexOf('{');
  const endIndex = trimmed.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return trimmed.slice(startIndex, endIndex + 1).trim();
  }

  return trimmed;
}

