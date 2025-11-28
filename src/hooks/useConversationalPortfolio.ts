import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hasLikelyTicker, isListedCompany } from '@/utils/listedCompanies';

export interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  monthlyAmountNumeric?: number;
  hasCurrentPortfolio?: boolean;
  tradingFrequency?: string;
  currentHoldings?: Array<{
    id: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    symbol?: string;
    currency?: string;
  }>;
  age?: number;
  experience?: string;
  sectors?: string[];
  sectorInterests?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
  portfolioChangeFrequency?: string;
  // Enhanced fields
  monthlyIncome?: string;
  annualIncome?: string;
  availableCapital?: string;
  liquidCapital?: string;
  emergencyFund?: string;
  emergencyBufferMonths?: number;
  financialObligations?: string[];
  housingSituation?: string;
  hasLoans?: boolean;
  loanDetails?: string;
  hasChildren?: boolean;
  sustainabilityPreference?: string;
  geographicPreference?: string;
  marketCrashReaction?: string;
  volatilityComfort?: number;
  marketExperience?: string;
  investmentExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredAssets?: string;
  currentAllocation?: string | Record<string, any>;
  currentPortfolioValue?: string;
  previousPerformance?: string;
  sectorExposure?: string[];
  investmentStyle?: string;
  dividendYieldRequirement?: string;
  maxDrawdownTolerance?: number;
  specificGoalAmount?: string;
  targetAmount?: string;
  targetDate?: string;
  taxConsideration?: string;
  investmentPurpose?: string[];
  preferredStockCount?: number;
  panicSellingHistory?: boolean;
  controlImportance?: number;
  activityPreference?: string;
  overexposureAwareness?: string;
  communicationStyle?: string;
  preferredResponseLength?: string;
  additionalNotes?: string;
  currentPortfolioStrategy?: string;
  optimizationGoals?: string[];
  optimizationRiskFocus?: string;
  optimizationDiversificationFocus?: string[];
  optimizationPreference?: 'analyze_only' | 'improve_with_new_ideas' | 'rebalance';
  optimizationTimeline?: string;
}

type PortfolioGenerationMode = 'new' | 'optimize';

export interface StockRecommendation {
  name: string;
  symbol?: string;
  sector?: string;
  reasoning?: string;
  allocation?: number;
  isin?: string;
  actionType?: string;
  changePercent?: number;
  notes?: string;
  expectedPrice?: number;
}

export const useConversationalPortfolio = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const coerceArray = (value: unknown): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') {
      return Object.values(value);
    }
    return [];
  };

  // Helper function to get known stock sectors
  const getKnownStockSector = (stockName: string): string => {
    const sectorMap: Record<string, string> = {
      'Investor': 'Finans',
      'Volvo': 'Industri', 
      'Ericsson': 'Teknologi',
      'H&M': 'Konsument',
      'Spotify': 'Teknologi',
      'Evolution Gaming': 'Teknologi',
      'Elekta': 'Hälsa',
      'Atlas Copco': 'Industri',
      'Sandvik': 'Industri',
      'SKF': 'Industri',
      'Telia': 'Teknologi',
      'Nordea': 'Finans',
      'SEB': 'Finans',
      'Handelsbanken': 'Finans',
      'Swedbank': 'Finans',
      'Saab': 'Industri',
      'Kinnevik': 'Finans',
      'ICA Gruppen': 'Konsument',
      'Getinge': 'Hälsa',
      'Boliden': 'Råvaror',
      'SSAB': 'Industri',
      'Autoliv': 'Industri'
    };
    return sectorMap[stockName] || 'Övrigt';
  };

  // Enhanced stock recommendation extraction - completely dynamic
  const extractStockRecommendations = (aiResponse: string): StockRecommendation[] => {
    const recommendations: StockRecommendation[] = [];

    const resolvePercent = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const numeric = parseFloat(value.replace(/[^\\d.,-]/g, '').replace(',', '.'));
        return Number.isFinite(numeric) ? numeric : undefined;
      }
      return undefined;
    };

    const pushUniqueRecommendation = (recommendation: StockRecommendation) => {
      if (!recommendation.name) {
        return;
      }

      const listingValid = isListedCompany(recommendation.name, recommendation.symbol) || hasLikelyTicker(recommendation.symbol);
      if (!listingValid) {
        return;
      }

      const exists = recommendations.some(existing =>
        existing.name.toLowerCase() === recommendation.name.toLowerCase() ||
        (existing.symbol && recommendation.symbol && existing.symbol.toLowerCase() === recommendation.symbol.toLowerCase())
      );

      if (!exists) {
        recommendations.push(recommendation);
      }
    };

    try {
      const parsed = JSON.parse(aiResponse);
      const recs = Array.isArray(parsed)
        ? parsed
        : parsed.recommendations || parsed.recommended_assets;

      if (Array.isArray(recs)) {
        recs.forEach((rec: any) => {
          if (!rec || !rec.name) {
            return;
          }

          pushUniqueRecommendation({
            name: String(rec.name).trim(),
            symbol: rec.symbol || rec.ticker || undefined,
            sector: rec.sector || rec.category,
            reasoning: rec.reasoning || rec.rationale || rec.analysis || rec.comment || rec.notes,
            allocation: resolvePercent(rec.allocation_percent) ?? resolvePercent(rec.allocation) ?? undefined,
            isin: rec.isin,
            actionType: typeof rec.action_type === 'string' ? rec.action_type : typeof rec.action === 'string' ? rec.action : undefined,
            changePercent: resolvePercent(rec.change_percent) ?? resolvePercent(rec.weight_change_percent) ?? resolvePercent(rec.delta_percent),
            notes: rec.notes || rec.comment || rec.detail,
            expectedPrice: typeof rec.expected_price === 'number' ? rec.expected_price : undefined,
          });
        });

        return recommendations.slice(0, 10);
      }
    } catch (error) {
      console.warn('AI response not valid JSON, using regex fallback');
    }

    const patterns = [
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\s*\(([A-Z\s-]+?)\)\*\*:\s*([^.]+(?:\.[^.]*)*?)(?:.*?Allokering:\s*(\d+)%)?/gi,
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\s*\(([A-Z\s-]+?)\)\*\*:\s*([^.]+(?:\.[^.]*)*?)/gi,
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\*\*:\s*([^.]+(?:\.[^.]*)*?)(?:.*?Allokering:\s*(\d+)%)?/gi,
      /(?:\d+\.\s*)?([A-ZÅÄÖ][a-zåäö\s&.-]+)\s*\(([A-Z\s-]+)\):\s*([^.\n]+)/g,
    ];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(aiResponse)) !== null) {
        let name = '';
        let symbol = '';
        let reasoning = '';
        let allocation = 10;

        if (patternIndex === 0) {
          [, name, symbol, reasoning] = match;
          const allocationMatch = match[4];
          allocation = allocationMatch ? parseInt(allocationMatch) : 12;
        } else if (patternIndex === 1) {
          [, name, symbol, reasoning] = match;
          allocation = 10;
        } else if (patternIndex === 2) {
          [, name, reasoning] = match;
          const allocationMatch = match[3];
          allocation = allocationMatch ? parseInt(allocationMatch) : 15;
        } else if (patternIndex === 3) {
          [, name, symbol, reasoning] = match;
        }

        if (!name || name.trim().length <= 2) {
          continue;
        }

        const cleanName = name.trim();
        const cleanSymbol = symbol ? symbol.trim().replace(/\s+/g, '').replace(/^([A-Z]+)\s*([A-Z])$/, '$1-$2') : '';

        let detectedSector = 'Allmän';
        const reasoningLower = reasoning?.toLowerCase() || '';
        const nameLower = cleanName.toLowerCase();

        if (reasoningLower.includes('teknologi') || reasoningLower.includes('tech') || nameLower.includes('gaming') || nameLower.includes('hexagon')) {
          detectedSector = 'Teknologi';
        } else if (reasoningLower.includes('fastighet') || reasoningLower.includes('real estate') || nameLower.includes('castellum') || nameLower.includes('sbb')) {
          detectedSector = 'Fastighet';
        } else if (reasoningLower.includes('bank') || nameLower.includes('bank') || nameLower.includes('swedbank') || nameLower.includes('handelsbanken')) {
          detectedSector = 'Bank';
        } else if (reasoningLower.includes('industri') || reasoningLower.includes('industrial') || nameLower.includes('volvo') || nameLower.includes('atlas copco')) {
          detectedSector = 'Industri';
        } else if (reasoningLower.includes('fond') || reasoningLower.includes('fund') || reasoningLower.includes('index') || nameLower.includes('fond')) {
          detectedSector = 'Fond';
        } else if (reasoningLower.includes('investmentbolag') || nameLower.includes('investor') || nameLower.includes('kinnevik')) {
          detectedSector = 'Investmentbolag';
        }

        pushUniqueRecommendation({
          name: cleanName,
          symbol: cleanSymbol || undefined,
          sector: detectedSector,
          reasoning: reasoning ? reasoning.trim() : 'AI-rekommenderad investering',
          allocation: allocation || 10,
        });
      }
    });

    const knownSwedishStocks = [
      'Investor', 'Volvo', 'Ericsson', 'H&M', 'Spotify', 'Evolution Gaming',
      'Elekta', 'Atlas Copco', 'Sandvik', 'SKF', 'Telia', 'Nordea',
      'SEB', 'Handelsbanken', 'Swedbank', 'Kinnevik', 'ICA Gruppen',
      'Getinge', 'Boliden', 'SSAB', 'Saab', 'Autoliv'
    ];

    knownSwedishStocks.forEach(stock => {
      const regex = new RegExp(`\\b${stock}\\b`, 'gi');
      if (!regex.test(aiResponse)) {
        return;
      }

      pushUniqueRecommendation({
        name: stock,
        sector: getKnownStockSector(stock),
      });
    });

    return recommendations.slice(0, 10);
  };

  type WeightedHolding = {
    name: string;
    symbol?: string;
    quantity: number;
    price: number;
    estimatedValue: number;
    weight: number | null;
  };

  const computeHoldingsWithPercentages = (
    holdings: ConversationData['currentHoldings'] | undefined
  ): WeightedHolding[] => {
    const normalizedHoldings = (holdings ?? [])
      .map(holding => {
        const quantity = typeof holding.quantity === 'number' ? holding.quantity : Number(holding.quantity);
        const price = typeof holding.purchasePrice === 'number'
          ? holding.purchasePrice
          : Number(holding.purchasePrice);

        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
          return null;
        }

        const estimatedValue = quantity * price;
        return {
          name: holding.name,
          symbol: holding.symbol,
          quantity,
          price,
          estimatedValue,
        };
      })
      .filter((item): item is {
        name: string;
        symbol?: string;
        quantity: number;
        price: number;
        estimatedValue: number;
      } => Boolean(item));

    const totalEstimatedHoldingValue = normalizedHoldings.reduce((sum, holding) => sum + holding.estimatedValue, 0);

    return normalizedHoldings
      .map(holding => ({
        ...holding,
        weight: totalEstimatedHoldingValue > 0
          ? (holding.estimatedValue / totalEstimatedHoldingValue) * 100
          : null,
      }))
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  };

  const buildEnhancedAIPrompt = (conversationData: ConversationData, mode: 'new' | 'optimize') => {
    const mapValue = (value: string | undefined, mapping: Record<string, string>) => {
      if (!value) return undefined;
      const normalized = value.toLowerCase();
      return mapping[normalized] ?? mapping[value] ?? value;
    };

    const mapArrayValues = (values: string[] | undefined, mapping: Record<string, string>) => {
      if (!values || values.length === 0) return undefined;
      const mapped = values
        .map(value => {
          const normalized = value.toLowerCase();
          return mapping[normalized] ?? mapping[value] ?? value;
        })
        .filter(Boolean);
      return mapped.length > 0 ? Array.from(new Set(mapped)) : undefined;
    };

    const resolveNumericString = (value?: string | number): string | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.round(value).toString();
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        const digits = value.replace(/[^\d]/g, '');
        if (digits.length > 0) {
          return digits;
        }
        return value.trim();
      }

      return null;
    };

    const formatCurrency = (value?: string | number) => {
      const numericString = resolveNumericString(value);
      if (!numericString) {
        return 'Ej angivet';
      }

      const parsed = Number(numericString);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return numericString;
      }

      return new Intl.NumberFormat('sv-SE').format(parsed);
    };

    const formatBoolean = (value: boolean | undefined) =>
      typeof value === 'boolean' ? (value ? 'Ja' : 'Nej') : 'Ej angivet';

    const holdingsWithPercentages = computeHoldingsWithPercentages(conversationData.currentHoldings);

    const investmentGoalText = mapValue(conversationData.investmentGoal, {
      pension: 'Pensionssparande',
      wealth: 'Förmögenhetsuppbyggnad',
      income: 'Regelbunden inkomst',
      house: 'Bostadsköp',
      education: 'Utbildning/Barn',
      long_term_savings: 'Bygga ett långsiktigt sparande',
      learn_and_test: 'Lära mig mer och testa på',
      specific_goal: 'Spara till något specifikt (t.ex. bostad, resa)',
      quick_return: 'Snabb avkastning',
      long_term_growth: 'Bygga långsiktigt sparande',
      dividend_income: 'Extra inkomst via utdelningar',
      other: 'Annat mål',
    }) ?? 'Ej angivet';

    const timeHorizonText = mapValue(conversationData.timeHorizon, {
      short: '0–2 år (kort sikt)',
      medium: '3–5 år (medellång sikt)',
      long: '5+ år (lång sikt)',
      very_long: '15+ år (mycket lång sikt)',
      unknown: 'Vet inte än',
    }) ?? 'Ej angiven';

    const riskToleranceText = mapValue(conversationData.riskTolerance, {
      conservative: 'Konservativ (låg risk)',
      balanced: 'Balanserad (måttlig risk)',
      aggressive: 'Aggressiv (hög risk)',
    }) ?? 'Ej angiven';

    const monthlyInvestmentText = formatCurrency(
      conversationData.monthlyAmount ?? conversationData.monthlyAmountNumeric
    );

    const annualIncomeText = mapValue(conversationData.annualIncome, {})
      ?? formatCurrency(conversationData.annualIncome);

    const monthlyIncomeText = mapValue(conversationData.monthlyIncome, {
      '20000-30000': '20 000 - 30 000 kr',
      '30000-45000': '30 000 - 45 000 kr',
      '45000-60000': '45 000 - 60 000 kr',
      '60000+': 'Över 60 000 kr',
    }) ?? formatCurrency(conversationData.monthlyIncome);

    const availableCapitalText = mapValue(conversationData.availableCapital, {
      under_1000: 'Mindre än 1 000 kr',
      '1000_10000': '1 000 – 10 000 kr',
      '10000_50000': '10 000 – 50 000 kr',
      over_50000: 'Mer än 50 000 kr',
      '10000-50000': '10 000 - 50 000 kr',
      '50000-100000': '50 000 - 100 000 kr',
      '100000-250000': '100 000 - 250 000 kr',
      '250000+': 'Över 250 000 kr',
    }) ?? formatCurrency(conversationData.availableCapital);

    const emergencyFundText = mapValue(conversationData.emergencyFund, {
      yes_full: 'Ja, 6+ månaders utgifter',
      yes_partial: 'Ja, 1-3 månaders utgifter',
      no: 'Nej, ingen buffert än',
    });

    const sustainabilityText = mapValue(conversationData.sustainabilityPreference, {
      very_important: 'Mycket viktigt - bara hållbara investeringar',
      somewhat_important: 'Ganska viktigt - föredrar hållbara alternativ',
      not_priority: 'Inte prioritet - fokuserar på avkastning',
    });

    const geographicText = mapValue(conversationData.geographicPreference, {
      sweden_only: 'Mest svenska företag',
      europe: 'Europiska marknader',
      usa: 'Amerikanska marknaden',
      global: 'Global spridning',
    });

    const marketCrashText = mapValue(conversationData.marketCrashReaction, {
      sell_all: 'Sälja allt för att stoppa förlusterna',
      sell_some: 'Sälja en del av innehaven',
      hold: 'Behålla allt och vänta',
      buy_more: 'Jag ser det som ett köptillfälle',
      sell: 'Jag blir orolig och vill sälja',
      wait: 'Jag försöker avvakta',
    });

    const portfolioHelpText = mapValue(conversationData.portfolioHelp, {
      simple_start: 'Hjälp mig börja enkelt',
      diverse_portfolio: 'Skapa diversifierad portfölj',
      growth_focused: 'Fokusera på tillväxt',
      dividend_income: 'Prioritera utdelning',
      long_term_portfolio: 'Bygga en långsiktig portfölj',
      analyze_holdings: 'Ge analyser på mina aktier',
      find_new_investments: 'Hitta nya intressanta investeringar',
      learn_more: 'Lära mig mer om investeringar',
      step_by_step: 'Komma igång steg-för-steg',
      learn_basics: 'Lära mig grunderna om aktier & investmentbolag',
      starter_portfolio: 'Få förslag på en enkel startportfölj',
      investment_inspiration: 'Inspiration till olika investeringstyper',
    });

    const portfolioSizeText = mapValue(conversationData.portfolioSize, {
      under_10000: 'Under 10 000 kr',
      '10000_50000': '10 000 – 50 000 kr',
      '50000_200000': '50 000 – 200 000 kr',
      over_200000: 'Mer än 200 000 kr',
      small: 'Liten portfölj',
      medium: 'Medelstor portfölj',
      large: 'Stor portfölj',
      very_large: 'Mycket stor portfölj',
    }) ?? conversationData.portfolioSize;

    const preferredAssetsText = mapValue(conversationData.preferredAssets, {
      stocks: 'Aktier',
      investment_companies: 'Investmentbolag',
      crypto: 'Kryptovalutor',
      commodities: 'Råvaror (t.ex. guld, olja)',
    }) ?? conversationData.preferredAssets;

    const optimizationGoalsText = mapArrayValues(conversationData.optimizationGoals, {
      risk_balance: 'Balansera risken bättre',
      diversify: 'Öka diversifieringen',
      reduce_fees: 'Sänka avgifter och kostnader',
      add_growth: 'Öka tillväxtpotentialen',
      income_focus: 'Förstärka utdelningsströmmen',
      sustainability: 'Höja hållbarhetsprofilen',
    });

    const optimizationPreferenceText = mapValue(conversationData.optimizationPreference, {
      analyze_only: 'Analysera och förbättra utan nya köp',
      improve_with_new_ideas: 'Komplettera med nya idéer vid behov',
      rebalance: 'Konkreta rebalanseringsförslag med köp/sälj',
    });

    const optimizationTimelineText = mapValue(conversationData.optimizationTimeline, {
      immediate: 'Omedelbart',
      short_term: 'Inom 3 månader',
      medium_term: 'Under det kommande året',
      long_term: 'Löpande över flera år',
    }) ?? conversationData.optimizationTimeline;

    const optimizationRiskFocusText = mapValue(conversationData.optimizationRiskFocus, {
      drawdown: 'Stora kurssvängningar/drawdowns',
      concentration: 'Hög koncentration i få innehav',
      market: 'Marknadsrisk/känslighet',
      currency: 'Valutarisk',
      liquidity: 'Likviditetsrisk',
    }) ?? conversationData.optimizationRiskFocus;

    const optimizationDiversificationText = mapArrayValues(conversationData.optimizationDiversificationFocus, {
      nordics: 'Nordiska marknaden',
      global: 'Global exponering',
      sectors: 'Flera sektorer',
      small_caps: 'Småbolagstillväxt',
      thematic: 'Tematiska/fonder',
    });

    const tradingFrequencyText = mapValue(conversationData.tradingFrequency, {
      rarely: 'Sällan (några gånger per år)',
      monthly: 'Någon gång i månaden',
      weekly: 'Varje vecka eller oftare',
    }) ?? conversationData.tradingFrequency;

    const rebalancingText = mapValue(conversationData.rebalancingFrequency, {
      monthly: 'Månadsvis',
      quarterly: 'Kvartalsvis',
      yearly: 'Årligen',
      rarely: 'Sällan',
    });

    const investmentStyleText = mapValue(conversationData.investmentStyle, {
      value: 'Value - undervärderade företag',
      growth: 'Growth - snabbt växande företag',
      dividend: 'Dividend - fokus på utdelningar',
      momentum: 'Momentum - trender och teknisk analys',
      mixed: 'Blandad strategi',
    });

    const dividendRequirementText = mapValue(conversationData.dividendYieldRequirement, {
      high: 'Hög (4%+)',
      moderate: 'Måttlig (2-4%)',
      low: 'Låg (<2%)',
      none: 'Ingen - återinvestering prioriteras',
    });

    const marketExperienceText = mapValue(conversationData.marketExperience, {
      '2-5': '2-5 år',
      '5-10': '5-10 år',
      '10-20': '10-20 år',
      '20+': 'Över 20 år',
    });

    const previousPerformanceText = mapValue(conversationData.previousPerformance, {
      outperformed: 'Bättre än marknaden',
      matched: 'Samma som marknaden',
      underperformed: 'Sämre än marknaden',
      unsure: 'Osäker/har inte mätt',
    });

    const emergencyBufferText =
      typeof conversationData.emergencyBufferMonths === 'number'
        ? `${conversationData.emergencyBufferMonths} månader`
        : undefined;

    const liquidCapitalText = formatCurrency(conversationData.liquidCapital);
    const currentPortfolioValueText = formatCurrency(conversationData.currentPortfolioValue);

    // Helper function to check if a value is actually provided (not null/undefined/empty)
    const hasValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    };

    // Only include age if it's actually provided
    const formattedAge = typeof conversationData.age === 'number' && conversationData.age > 0
      ? `${conversationData.age} år`
      : null;

    // Only include monthly investment if it's actually provided
    const formattedMonthlyInvestment = monthlyInvestmentText && monthlyInvestmentText !== 'Ej angivet'
      ? `${monthlyInvestmentText} SEK`
      : null;

    // Build base profile - only include fields that are actually answered
    const baseProfileParts: string[] = [];
    
    // These are the core base questions that should always be included if answered
    if (typeof conversationData.isBeginnerInvestor === 'boolean') {
      baseProfileParts.push(`- Erfarenhetsnivå: ${conversationData.isBeginnerInvestor ? 'Nybörjare (första gången investera)' : 'Erfaren investerare (flera års erfarenhet)'}`);
    }
    
    if (formattedAge) {
      baseProfileParts.push(`- Ålder: ${formattedAge}`);
    }
    
    if (formattedMonthlyInvestment) {
      baseProfileParts.push(`- Månatligt investeringsbelopp: ${formattedMonthlyInvestment}`);
    }
    
    if (investmentGoalText && investmentGoalText !== 'Ej angivet') {
      baseProfileParts.push(`- Investeringsmål: ${investmentGoalText}`);
    }
    
    if (timeHorizonText && timeHorizonText !== 'Ej angivet') {
      baseProfileParts.push(`- Tidshorisont: ${timeHorizonText}`);
    }
    
    if (riskToleranceText && riskToleranceText !== 'Ej angivet') {
      baseProfileParts.push(`- Risktolerans: ${riskToleranceText}`);
    }
    
    if (typeof conversationData.hasCurrentPortfolio === 'boolean') {
      baseProfileParts.push(`- Befintlig portfölj: ${formatBoolean(conversationData.hasCurrentPortfolio)}`);
    }

    let prompt = `Skapa en detaljerad och personlig portföljstrategi baserat på följande konsultation:

GRUNDLÄGGANDE PROFIL:
${baseProfileParts.length > 0 ? baseProfileParts.join('\n') : '- Endast grundläggande information tillgänglig'}`;

    // Additional profile information - only include if actually provided
    const additionalProfileParts: string[] = [];
    
    if (annualIncomeText && annualIncomeText !== 'Ej angivet') {
      additionalProfileParts.push(`- Årsinkomst: ${annualIncomeText} SEK`);
    }

    if (monthlyIncomeText && monthlyIncomeText !== 'Ej angivet') {
      additionalProfileParts.push(`- Månadsinkomst: ${monthlyIncomeText}`);
    }

    if (availableCapitalText && availableCapitalText !== 'Ej angivet') {
      additionalProfileParts.push(`- Tillgängligt kapital för investeringar: ${availableCapitalText}`);
    }

    if (preferredAssetsText && preferredAssetsText !== 'Ej angivet') {
      additionalProfileParts.push(`- Mest intresserad av: ${preferredAssetsText}`);
    }

    if (hasValue(conversationData.sectors) && conversationData.sectors && conversationData.sectors.length > 0) {
      additionalProfileParts.push(`- Favoritbranscher: ${conversationData.sectors.join(', ')}`);
    }
    
    if (additionalProfileParts.length > 0) {
      prompt += `\n\n${additionalProfileParts.join('\n')}`;
    }

    // Optimization-specific fields - only include if mode is optimize and values are provided
    if (mode === 'optimize') {
      const optimizationParts: string[] = [];
      
      if (hasValue(conversationData.currentPortfolioStrategy)) {
        optimizationParts.push(`- Nuvarande strategi: ${conversationData.currentPortfolioStrategy}`);
      }

      if (hasValue(optimizationGoalsText) && optimizationGoalsText && optimizationGoalsText.length > 0) {
        optimizationParts.push(`- Optimeringsmål: ${optimizationGoalsText.join(', ')}`);
      }

      if (hasValue(optimizationPreferenceText)) {
        optimizationParts.push(`- Önskat arbetssätt: ${optimizationPreferenceText}`);
      }

      if (hasValue(optimizationTimelineText)) {
        optimizationParts.push(`- Tidslinje för förändringar: ${optimizationTimelineText}`);
      }

      if (hasValue(optimizationRiskFocusText)) {
        optimizationParts.push(`- Största riskoro idag: ${optimizationRiskFocusText}`);
      }

      if (hasValue(optimizationDiversificationText) && optimizationDiversificationText && optimizationDiversificationText.length > 0) {
        optimizationParts.push(`- Områden att diversifiera mot: ${optimizationDiversificationText.join(', ')}`);
      }
      
      if (optimizationParts.length > 0) {
        prompt += `\n\nOPTIMERINGSDATA:\n${optimizationParts.join('\n')}`;
      }
    }

    // Financial details - only include if actually provided
    const financialParts: string[] = [];
    
    if (liquidCapitalText && liquidCapitalText !== 'Ej angivet') {
      financialParts.push(`- Likvida medel: ${liquidCapitalText} SEK`);
    }

    if (hasValue(emergencyBufferText)) {
      financialParts.push(`- Buffert (antal månader): ${emergencyBufferText}`);
    }

    if (hasValue(emergencyFundText)) {
      financialParts.push(`- Buffertstatus: ${emergencyFundText}`);
    }

    if (hasValue(conversationData.financialObligations) && conversationData.financialObligations && conversationData.financialObligations.length > 0) {
      financialParts.push(`- Ekonomiska förpliktelser: ${conversationData.financialObligations.join(', ')}`);
    }

    if (hasValue(conversationData.housingSituation)) {
      financialParts.push(`- Bostadssituation: ${conversationData.housingSituation}`);
    }

    if (typeof conversationData.hasLoans === 'boolean') {
      financialParts.push(`- Har ytterligare lån: ${conversationData.hasLoans ? 'Ja' : 'Nej'}`);
    }

    if (hasValue(conversationData.loanDetails)) {
      financialParts.push(`- Lånedetaljer: ${conversationData.loanDetails}`);
    }

    if (typeof conversationData.hasChildren === 'boolean') {
      financialParts.push(`- Har barn/försörjningsansvar: ${conversationData.hasChildren ? 'Ja' : 'Nej'}`);
    }

    if (currentPortfolioValueText && currentPortfolioValueText !== 'Ej angivet') {
      financialParts.push(`- Nuvarande portföljvärde: ${currentPortfolioValueText} SEK`);
    }
    
    if (financialParts.length > 0) {
      prompt += `\n\nEKONOMISK SITUATION:\n${financialParts.join('\n')}`;
    }

    if (mode === 'optimize') {
      prompt += `

ANALYS AV BEFINTLIG PORTFÖLJ (INGA REKOMMENDATIONER):
VIKTIGT: Du ska ENDAST ge en analys och sammanfattning av den nuvarande portföljen. Du får INTE generera några köpråd, säljråd eller omstruktureringsförslag.

1. Analysera den nuvarande portföljens risknivå baserat på innehav, allokering och diversifiering.
2. Beskriv fördelningen av innehav (sektorer, geografi, storlek).
3. Identifiera vad som ser bra ut i portföljen (styrkor, välbalanserade delar, bra diversifiering).
4. Ge en sammanfattning av portföljens nuvarande status och profil.
5. Kommentera riskhantering och diversifiering baserat på användarens riskprofil.
6. INKLUDERA INGA köp-, sälj- eller omstruktureringsrekommendationer.
7. INKLUDERA INGA action_type fält som "increase", "reduce", "sell", "add", eller "rebalance".
8. Fokusera enbart på att beskriva och analysera det som finns, inte på vad som bör ändras.

FORMAT FÖR SVARET:
- action_summary: Börja med riskprofilen (t.ex. "Aggressiv riskprofil – hög tillväxtorientering" eller "Konservativ riskprofil – fokus på stabilitet"). Detta ska vara en kort, tydlig beskrivning på en rad. INKLUDERA INTE detaljerad portföljbeskrivning här.
- risk_alignment: En LÅNG, GEDIGEN analys (minst 5-8 meningar, helst längre) som inkluderar:
  * Specifik beskrivning av alla viktiga innehav med deras tickers och ungefärlig vikt i portföljen
  * Sektorfördelning och geografisk spridning (Sverige, USA, Europa, etc.)
  * Koncentrationsrisker: identifiera om vissa innehav eller sektorer står för en stor del av portföljen
  * DOLD EXPONERING: Om användaren har fonder eller investmentbolag, analysera vilka underliggande innehav dessa kan innehålla och hur det påverkar den faktiska allokeringen. Exempel: "Om du äger Investor (INVE-B) som är 20% av portföljen, och Investor i sin tur äger 10% i Atlas Copco, har du en dold exponering på 2% mot Atlas Copco utöver eventuell direkt exponering"
  * Risknivå: bedöm hur portföljens faktiska risknivå matchar användarens angivna riskprofil
  * Diversifiering: analysera om portföljen är väl diversifierad eller om den är koncentrerad i få innehav/sektorer
  * Styrkor och svagheter i portföljens sammansättning
  Använd naturligt språk, var konkret och specifik. Nämn aktier, fonder och investmentbolag med deras tickers. Detta ska vara en omfattande, professionell portföljanalys.
- next_steps: Generella råd om övervakning (max 2 punkter), t.ex. "Övervaka utvecklingen i de mest koncentrerade innehaven" eller "Bredda geografiskt och sektoriellt över tid". INGA specifika köp/sälj-åtgärder. Var kortfattad och konkret.
- recommended_assets: Tom lista [].
- complementary_assets: Tom lista [].
- disclaimer: "Analysen är informationsbaserad och ej rådgivning."

VIKTIGT: action_summary och risk_alignment ska INTE upprepa samma information. action_summary är bara riskprofilen på en rad. risk_alignment är den detaljerade beskrivningen av portföljen.`;

      prompt += `

FORMATKRAV FÖR ANALYS:
- Returnera ett JSON-objekt med fälten: action_summary (kort beskrivning av riskprofil), risk_alignment (detaljerad analys av portföljens sammansättning och matchning med riskprofil), next_steps (max 2 generella övervakningsråd), recommended_assets (tom lista []), complementary_assets (tom lista []), disclaimer.
- recommended_assets och complementary_assets ska vara tomma listor [].
- Fokusera på att beskriva portföljen i action_summary och risk_alignment med naturligt, läsbart språk.
`;

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `

NUVARANDE INNEHAV SOM SKA ANALYSERAS: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`;

        if (holdingsWithPercentages.length > 0) {
          const topHoldings = holdingsWithPercentages.slice(0, 6).map(h => {
            const percentLabel = typeof h.weight === 'number'
              ? `${h.weight.toFixed(1).replace('.', ',')}%`
              : 'okänd vikt';
            const symbolLabel = h.symbol ? ` (${h.symbol.toUpperCase()})` : '';
            return `${h.name}${symbolLabel}: ${percentLabel}`;
          });

          if (topHoldings.length > 0) {
            prompt += `
- Uppskattad vikt per nyckelinnehav: ${topHoldings.join(', ')}`;
          }

          const concentrationAlerts = holdingsWithPercentages
            .filter(h => typeof h.weight === 'number' && h.weight >= 20)
            .map(h => {
              const symbolLabel = h.symbol ? ` (${h.symbol.toUpperCase()})` : '';
              return `${h.name}${symbolLabel} ~${h.weight!.toFixed(1).replace('.', ',')}%`;
            });

          if (concentrationAlerts.length > 0) {
            prompt += `
- Koncentrationsrisker att notera: ${concentrationAlerts.join(', ')}. Observera dessa i din analys, men föreslå INGA åtgärder.`;
          }
        }
      }

    } else if (conversationData.isBeginnerInvestor === true) {
      // Beginner investor profile - only include if values are provided
      const beginnerParts: string[] = [];

      if (hasValue(conversationData.interests) && conversationData.interests && conversationData.interests.length > 0) {
        beginnerParts.push(`- Personliga intressen: ${conversationData.interests.join(', ')}`);
      }

      if (hasValue(conversationData.companies) && conversationData.companies && conversationData.companies.length > 0) {
        beginnerParts.push(`- Företag de gillar: ${conversationData.companies.join(', ')}`);
      }

      if (hasValue(sustainabilityText)) {
        beginnerParts.push(`- Hållbarhetspreferens: ${sustainabilityText}`);
      }

      if (hasValue(geographicText)) {
        beginnerParts.push(`- Geografisk preferens: ${geographicText}`);
      }

      if (hasValue(marketCrashText)) {
        beginnerParts.push(`- Reaktion på börskrasch: ${marketCrashText}`);
      }

      if (hasValue(conversationData.volatilityComfort) && typeof conversationData.volatilityComfort === 'number') {
        beginnerParts.push(`- Komfort med volatilitet: ${conversationData.volatilityComfort}/10`);
      }

      if (hasValue(portfolioHelpText)) {
        beginnerParts.push(`- Önskad hjälp från rådgivaren: ${portfolioHelpText}`);
      }

      if (hasValue(conversationData.currentHoldings) && conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        beginnerParts.push(`- Nuvarande innehav: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`);
      }
      
      if (beginnerParts.length > 0) {
        prompt += `\n\nNYBÖRJARE - UTFÖRLIG EKONOMISK PROFIL:\n${beginnerParts.join('\n')}`;
      }

      prompt += `

UPPDRAG FÖR NYBÖRJARE:
1. Skapa en nybörjarvänlig portfölj som STARKT kopplar till användarens ekonomiska situation och intressen
2. Föreslå konkreta investmentbolag och kvalitetsaktier som matchar deras intressen och geografi, gärna välkända alternativ från Sverige eller USA som är lätta att handla från Sverige
3. Ta STOR hänsyn till deras ekonomiska buffert och förpliktelser
4. Anpassa riskexponering baserat på deras psykologiska profil och reaktionsmönster
5. Förklara VARFÖR varje innehav passar deras specifika profil
6. Inkludera utbildande element om diversifiering
7. Ge enkla, actionable steg för att komma igång
8. Föreslå specifika investmentbolag (svenska, amerikanska eller andra väletablerade) och lättillgängliga kvalitetsaktier som är enkla att köpa via Avanza/Nordnet eller motsvarande plattformar
9. Förklara risker på ett förståeligt sätt kopplat till deras komfortnivå
10. Föreslå en detaljerad månadsplan baserad på deras inkomst och tillgängliga kapital

VIKTIGT: Använd EXAKT detta format för varje rekommendation och INKLUDERA ALLTID SYMBOLER:
1. **Företagsnamn (BÖRSSYMBOL)**: Beskrivning av varför denna investering passar din profil. Allokering: XX%
2. **Investmentbolag (BÖRSSYMBOL)**: Beskrivning av varför detta bolag passar. Allokering: XX%

EXEMPEL (ANPASSA MED ANVÄNDARSPECIFIKA DATA):
1. **Företag A (TICKER-A)**: Kort beskrivning kopplad till användarens profil. Allokering: 15%
  2. **Investmentbolag B (TICKER-B)**: Kort beskrivning kopplad till användarens mål. Allokering: 20%`;

    } else {
      // Experienced investor profile - only include if values are provided
      const experiencedParts: string[] = [];

      if (hasValue(marketExperienceText)) {
        experiencedParts.push(`- Investeringserfarenhet: ${marketExperienceText}`);
      }

      if (hasValue(previousPerformanceText)) {
        experiencedParts.push(`- Historisk prestanda vs marknad: ${previousPerformanceText}`);
      }

      if (hasValue(conversationData.currentAllocation)) {
        experiencedParts.push(`- Nuvarande allokering: ${conversationData.currentAllocation}`);
      }

      if (hasValue(conversationData.sectorExposure) && conversationData.sectorExposure && conversationData.sectorExposure.length > 0) {
        experiencedParts.push(`- Befintlig sektorexponering: ${conversationData.sectorExposure.join(', ')}`);
      }

      if (hasValue(investmentStyleText)) {
        experiencedParts.push(`- Investeringsstil: ${investmentStyleText}`);
      }

      if (hasValue(dividendRequirementText)) {
        experiencedParts.push(`- Direktavkastningskrav: ${dividendRequirementText}`);
      }

      if (hasValue(conversationData.maxDrawdownTolerance) && typeof conversationData.maxDrawdownTolerance === 'number') {
        experiencedParts.push(`- Maximal drawdown-tolerans: ${conversationData.maxDrawdownTolerance}/10`);
      }

      if (hasValue(conversationData.taxConsideration)) {
        experiencedParts.push(`- Skatteoptimering: ${conversationData.taxConsideration}`);
      }

      if (hasValue(portfolioSizeText)) {
        experiencedParts.push(`- Portföljstorlek: ${portfolioSizeText}`);
      }

      if (hasValue(tradingFrequencyText)) {
        experiencedParts.push(`- Handelsfrekvens: ${tradingFrequencyText}`);
      }

      if (hasValue(rebalancingText)) {
        experiencedParts.push(`- Rebalanseringsfrekvens: ${rebalancingText}`);
      }

      if (hasValue(marketCrashText)) {
        experiencedParts.push(`- Reaktion på börskrasch: ${marketCrashText}`);
      }

      if (hasValue(conversationData.currentHoldings) && conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        experiencedParts.push(`- Nuvarande innehav: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`);
      }
      
      if (experiencedParts.length > 0) {
        prompt += `\n\nERFAREN INVESTERARE - AVANCERAD PROFIL:\n${experiencedParts.join('\n')}`;
      }

      prompt += `

UPPDRAG FÖR ERFAREN INVESTERARE:
1. Analysera den nuvarande strategin och identifiera SPECIFIKA optimeringsmöjligheter
2. Föreslå avancerade portföljtekniker baserat på deras erfarenhet och prestanda
3. Ta hänsyn till deras befintliga sektorexponering och föreslå diversifieringsstrategi
4. Inkludera sofistikerade allokeringsstrategier anpassade till deras stil
5. Föreslå specifika instrument som passar deras riskprofil och drawdown-tolerans
6. Diskutera skatteoptimering och ISK/KF-strategi baserat på deras prioriteringar
7. Analysera korrelationer och riskjusterad avkastning kopplat till deras historiska prestanda
8. Föreslå rebalanseringsstrategier som matchar deras frekvens och stil
9. Ge konkreta exit-strategier och optimeringsregler
10. Inkludera avancerade metriker och uppföljning

VIKTIGT: Använd EXAKT detta format för varje rekommendation och INKLUDERA ALLTID SYMBOLER:
1. **Företagsnamn (BÖRSSYMBOL)**: Beskrivning av varför denna investering passar din profil. Allokering: XX%
2. **Investmentbolag (BÖRSSYMBOL)**: Beskrivning av varför detta bolag passar. Allokering: XX%

EXEMPEL (ANPASSA MED ANVÄNDARSPECIFIKA DATA):
1. **Företag A (TICKER-A)**: Kort beskrivning kopplad till användarens profil. Allokering: 15%
  2. **Investmentbolag B (TICKER-B)**: Kort beskrivning kopplad till användarens mål. Allokering: 20%`;
    }

    const investmentPurposes = conversationData.investmentPurpose && conversationData.investmentPurpose.length > 0
      ? conversationData.investmentPurpose
      : undefined;

    const combinedGoalAmount = conversationData.specificGoalAmount || conversationData.targetAmount;

    // Deep preferences - only include if values are actually provided
    const deepPreferenceParts: string[] = [];

      if (hasValue(investmentPurposes) && investmentPurposes && investmentPurposes.length > 0) {
        deepPreferenceParts.push(`- Investeringssyften: ${investmentPurposes.join(', ')}`);
      }

      if (hasValue(combinedGoalAmount)) {
        deepPreferenceParts.push(`- Specifikt målbelopp: ${combinedGoalAmount}`);
      }

      if (hasValue(conversationData.targetDate)) {
        deepPreferenceParts.push(`- Måldatum för uppnått mål: ${conversationData.targetDate}`);
      }

      if (hasValue(conversationData.preferredStockCount) && typeof conversationData.preferredStockCount === 'number') {
        deepPreferenceParts.push(`- Önskat antal innehav i portföljen: ${conversationData.preferredStockCount}`);
      }

      if (hasValue(conversationData.controlImportance) && typeof conversationData.controlImportance === 'number') {
        deepPreferenceParts.push(`- Kontrollbehov (1-5): ${conversationData.controlImportance}`);
      }

      if (typeof conversationData.panicSellingHistory === 'boolean') {
        deepPreferenceParts.push(`- Har paniksålt tidigare: ${conversationData.panicSellingHistory ? 'Ja' : 'Nej'}`);
      }

      if (hasValue(conversationData.activityPreference)) {
        deepPreferenceParts.push(`- Aktivitetspreferens: ${conversationData.activityPreference}`);
      }

      if (hasValue(conversationData.portfolioChangeFrequency) || hasValue(conversationData.rebalancingFrequency)) {
        deepPreferenceParts.push(`- Föredragen ombalanseringsfrekvens: ${conversationData.portfolioChangeFrequency || rebalancingText || conversationData.rebalancingFrequency}`);
      }

      if (hasValue(conversationData.overexposureAwareness)) {
        deepPreferenceParts.push(`- Medvetenhet kring överexponering: ${conversationData.overexposureAwareness}`);
      }

      if (hasValue(conversationData.communicationStyle)) {
        deepPreferenceParts.push(`- Önskad kommunikationsstil: ${conversationData.communicationStyle}`);
      }

      if (hasValue(conversationData.preferredResponseLength)) {
        deepPreferenceParts.push(`- Önskad svarslängd: ${conversationData.preferredResponseLength}`);
      }

      if (hasValue(conversationData.additionalNotes)) {
        deepPreferenceParts.push(`- Ytterligare anteckningar: ${conversationData.additionalNotes}`);
      }
      
      if (deepPreferenceParts.length > 0) {
        prompt += `\n\nFÖRDJUPADE PREFERENSER:\n${deepPreferenceParts.join('\n')}`;
      }

    prompt += `

VIKTIGT: Du får INTE återanvända identiska portföljer till olika användare. Varje rekommendation måste vara unik och tydligt kopplad till den här användarens profil.

Svara enbart med giltig JSON enligt följande struktur:
{
  "recommendations": [
    { "name": "", "symbol": "", "sector": "", "reasoning": "", "allocation_percent": 0 }
  ],
  "summary": "",
  "risk_alignment": "",
  "next_steps": [""],
  "disclaimer": ""
}

Inkludera alltid minst 3 och max 8 rekommendationer beroende på risknivå, med tydliga tickers (om tillgängligt), sektor, och tydlig motivering för varje tillgång.

Fokusera extra mycket på att motivera hur varje rekommendation kopplar till användarens mål, tidshorisont, risktolerans och finansiella situation.

UNDVIK generiska svar. Använd den detaljerade profilen för att ge en portfölj som känns skräddarsydd för just den här användaren.

Påminn användaren om att investeringar innebär risk och att historisk avkastning inte garanterar framtida resultat.

Föreslå ALDRIG samma portfölj till olika användare

**ANVÄND NUMRERADE LISTA FÖR INVESTERINGSREKOMMENDATIONER:**

**Investeringsrekommendationer:**

1. **Företagsnamn (SYMBOL)**: Detaljerad beskrivning. Allokering: XX%
2. **Investmentbolag (SYMBOL)**: Detaljerad beskrivning. Allokering: XX%

Ge en välstrukturerad, personlig och actionable portföljstrategi på svenska som är perfekt anpassad för användarens specifika situation, erfarenhetsnivå och psykologiska profil.

SVARSKRAV: Svara ENDAST med giltig JSON i följande format:
{
  "recommendations": [
    { "name": "", "symbol": "", "sector": "", "reasoning": "", "allocation": 0 }
  ],
  "summary": ""
}`;

    return prompt;
  };
  const generatePortfolioFromConversation = async (
    conversationData: ConversationData,
    options?: { mode?: PortfolioGenerationMode }
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Du måste vara inloggad för att generera en portfölj",
        variant: "destructive",
      });
      return null;
    }

    const requestedMode = options?.mode;
    const mode: PortfolioGenerationMode =
      requestedMode === 'new' || requestedMode === 'optimize'
        ? requestedMode
        : conversationData.hasCurrentPortfolio
          ? 'optimize'
          : 'new';

    const holdingsWithPercentages = computeHoldingsWithPercentages(conversationData.currentHoldings);

    const ensureString = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

    const ensureNumber = (value: unknown): number | undefined =>
      typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    const ensureBoolean = (value: unknown): boolean | undefined =>
      typeof value === 'boolean' ? value : undefined;

    const ensureStringArray = (value: unknown): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) {
        const parsed = value
          .map(item => (typeof item === 'string' ? item.trim() : undefined))
          .filter((item): item is string => Boolean(item && item.length > 0));
        return parsed.length > 0 ? Array.from(new Set(parsed)) : undefined;
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return ensureStringArray(parsed);
        } catch {
          const splitted = value
            .split(/[,;]/)
            .map(part => part.trim())
            .filter(part => part.length > 0);
          return splitted.length > 0 ? Array.from(new Set(splitted)) : undefined;
        }
      }
      return undefined;
    };

    const ensureHoldingsArray = (
      value: unknown
    ): ConversationData['currentHoldings'] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) {
        return value.filter(item => item && typeof item === 'object') as ConversationData['currentHoldings'];
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => item && typeof item === 'object') as ConversationData['currentHoldings'];
          }
        } catch (error) {
          console.warn('Could not parse holdings JSON from existing profile', error);
        }
      }
      return undefined;
    };

    const parsePlanPercent = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const numeric = parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
        return Number.isFinite(numeric) ? numeric : undefined;
      }
      return undefined;
    };

    const normalizePlanActionType = (value: unknown): string | undefined => {
      if (typeof value !== 'string') {
        return undefined;
      }

      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return undefined;
      }

      if (/behåll|hold|keep/.test(normalized)) return 'hold';
      if (/öka|increase|köp mer|buy/.test(normalized)) return 'increase';
      if (/lägg till|add|nytt|introduc|komplettera|complement/.test(normalized)) return 'add';
      if (/minska|reduce|trim|skala/.test(normalized)) return 'reduce';
      if (/sälj|sell|exit|avyttra/.test(normalized)) return 'sell';
      if (/rebal/.test(normalized)) return 'rebalance';
      if (/övervaka|bevaka|monitor/.test(normalized)) return 'monitor';

      return normalized;
    };

    const mapPlanAssetToRecommendation = (asset: any): StockRecommendation | null => {
      if (!asset || !asset.name) {
        return null;
      }

      const normalizedName = String(asset.name).trim();
      const normalizedSymbol = asset.ticker || asset.symbol || undefined;
      const listingValid = isListedCompany(normalizedName, normalizedSymbol) || hasLikelyTicker(normalizedSymbol);

      if (!listingValid) {
        return null;
      }

      const allocation =
        parsePlanPercent(asset.allocation_percent) ??
        parsePlanPercent(asset.allocation) ??
        parsePlanPercent(asset.target_weight) ??
        parsePlanPercent(asset.target_allocation_percent);

      const changePercent =
        parsePlanPercent(asset.change_percent) ??
        parsePlanPercent(asset.weight_change_percent) ??
        parsePlanPercent(asset.delta_percent) ??
        parsePlanPercent(asset.adjustment_percent);

      const actionType =
        normalizePlanActionType(asset.action_type) ||
        normalizePlanActionType(asset.action) ||
        normalizePlanActionType(asset.recommendation_type) ||
        normalizePlanActionType(asset.intent);

      return {
        name: normalizedName,
        symbol: normalizedSymbol,
        sector: asset.sector || asset.category,
        reasoning: asset.rationale || asset.reasoning || asset.analysis || asset.comment || asset.notes,
        allocation,
        isin: asset.isin,
        actionType,
        changePercent,
        notes: asset.notes || asset.comment || asset.detail,
      };
    };

    const dedupeRecommendations = (items: StockRecommendation[]): StockRecommendation[] => {
      const seen = new Set<string>();
      return items.filter(item => {
        const nameKey = item.name?.toLowerCase() ?? '';
        const symbolKey = item.symbol?.toLowerCase() ?? '';
        const compositeKey = `${nameKey}|${symbolKey}`;
        if (seen.has(compositeKey)) {
          return false;
        }
        seen.add(compositeKey);
        return true;
      });
    };

    const normalizeTradeOutputs = ({
      stockRecommendations,
      complementaryIdeas,
      structuredPlan,
      mode,
    }: {
      stockRecommendations: StockRecommendation[];
      complementaryIdeas: StockRecommendation[];
      structuredPlan: any;
      mode: PortfolioGenerationMode;
    }) => {
      if (mode !== 'optimize') {
        return { stockRecommendations, complementaryIdeas, structuredPlan };
      }

      const weightedHoldings = holdingsWithPercentages.filter(
        holding => typeof holding.weight === 'number' && Number.isFinite(holding.weight)
      );

      if (weightedHoldings.length === 0) {
        return { stockRecommendations, complementaryIdeas, structuredPlan };
      }

      const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
      const roundOneDecimal = (value: number): number => {
        const rounded = Math.round(value * 10) / 10;
        return Math.abs(rounded) < 0.05 ? 0 : rounded;
      };
      const toFiniteNumber = (value: unknown): number | undefined =>
        typeof value === 'number' && Number.isFinite(value) ? value : undefined;

      const normalizeKeyPart = (value?: string | null) => value?.trim().toLowerCase() ?? '';
      const makeKey = (name?: string | null, symbol?: string | null) => {
        const nameKey = normalizeKeyPart(name);
        const symbolKey = normalizeKeyPart(symbol);
        return `${nameKey}|${symbolKey}`;
      };

      const weightByKey = new Map<string, number>();
      weightedHoldings.forEach(holding => {
        const normalizedWeight = clamp(holding.weight!, 0, 100);
        const nameKey = makeKey(holding.name, null);
        if (nameKey !== '|') {
          weightByKey.set(nameKey, normalizedWeight);
        }

        if (holding.symbol) {
          const symbolKey = makeKey(null, holding.symbol);
          if (symbolKey !== '|') {
            weightByKey.set(symbolKey, normalizedWeight);
          }
          const compositeKey = makeKey(holding.name, holding.symbol);
          if (compositeKey !== '|') {
            weightByKey.set(compositeKey, normalizedWeight);
          }
        }
      });

      const resolveExistingWeight = (item: StockRecommendation): number | null => {
        const symbolWeight = item.symbol ? weightByKey.get(makeKey(null, item.symbol)) : undefined;
        if (typeof symbolWeight === 'number') {
          return symbolWeight;
        }

        const compositeWeight = weightByKey.get(makeKey(item.name, item.symbol ?? null));
        if (typeof compositeWeight === 'number') {
          return compositeWeight;
        }

        const nameWeight = weightByKey.get(makeKey(item.name, null));
        return typeof nameWeight === 'number' ? nameWeight : null;
      };

      type TradeEntry = {
        key: string;
        base: StockRecommendation;
        action?: string;
        existingWeight: number | null;
        delta: number;
        newAllocation: number | null;
      };

      const buildEntries = (items: StockRecommendation[]): TradeEntry[] => {
        return items.map(item => {
          const action = item.actionType ? item.actionType.toLowerCase() : undefined;
          const existingWeight = resolveExistingWeight(item);
          const baseWeight = existingWeight !== null ? clamp(existingWeight, 0, 100) : null;
          const rawChange = toFiniteNumber(item.changePercent);
          const rawAllocation = toFiniteNumber(item.allocation);

          let delta = 0;
          let targetAllocation: number | null = rawAllocation ?? null;

          if (baseWeight !== null) {
            if (action === 'reduce' || action === 'sell') {
              const requestedDecrease = rawChange != null ? Math.abs(rawChange) : targetAllocation != null ? Math.max(0, baseWeight - targetAllocation) : 0;
              const applied = Math.min(requestedDecrease, baseWeight);
              delta = -applied;
              targetAllocation = baseWeight + delta;
            } else if (action === 'increase') {
              const requestedIncrease = rawChange != null ? Math.abs(rawChange) : targetAllocation != null ? Math.max(0, targetAllocation - baseWeight) : 0;
              const maxIncrease = Math.max(0, 100 - baseWeight);
              const applied = Math.min(requestedIncrease, maxIncrease);
              delta = applied;
              targetAllocation = baseWeight + delta;
            } else if (action === 'rebalance') {
              if (targetAllocation != null) {
                delta = targetAllocation - baseWeight;
              } else if (rawChange != null) {
                delta = rawChange;
              }
              delta = clamp(delta, -baseWeight, Math.max(0, 100 - baseWeight));
              targetAllocation = baseWeight + delta;
            } else if (targetAllocation != null || rawChange != null) {
              const requested = targetAllocation != null ? targetAllocation - baseWeight : rawChange ?? 0;
              delta = clamp(requested, -baseWeight, Math.max(0, 100 - baseWeight));
              targetAllocation = baseWeight + delta;
            } else {
              targetAllocation = baseWeight;
            }
          } else {
            if (action === 'add' || action === 'increase') {
              const requested = rawChange != null ? Math.abs(rawChange) : rawAllocation != null ? Math.max(0, rawAllocation) : 0;
              delta = Math.max(0, requested);
              targetAllocation = delta;
            } else if (rawAllocation != null) {
              delta = rawAllocation;
              targetAllocation = rawAllocation;
            } else if (rawChange != null) {
              delta = rawChange;
              targetAllocation = rawChange;
            } else {
              targetAllocation = 0;
              delta = 0;
            }
          }

          if (!Number.isFinite(delta)) {
            delta = 0;
          }

          if (targetAllocation != null && !Number.isFinite(targetAllocation)) {
            targetAllocation = null;
          }

          return {
            key: makeKey(item.name, item.symbol ?? null),
            base: item,
            action,
            existingWeight: baseWeight,
            delta,
            newAllocation: targetAllocation,
          };
        });
      };

      const stockEntries = buildEntries(stockRecommendations);
      const complementaryEntries = buildEntries(complementaryIdeas);
      const allEntries = [...stockEntries, ...complementaryEntries];

      const totalBuys = allEntries.reduce((sum, entry) => (entry.delta > 0 ? sum + entry.delta : sum), 0);
      const totalSells = allEntries.reduce((sum, entry) => (entry.delta < 0 ? sum - entry.delta : sum), 0);
      const currentTotalWeight = weightedHoldings.reduce((sum, holding) => sum + clamp(holding.weight!, 0, 100), 0);
      const availableNewCapital = Math.max(0, Math.min(100, 100 - Math.min(currentTotalWeight, 100)));
      const buyCapacity = totalSells + availableNewCapital;
      const buyScale = buyCapacity <= 0 || totalBuys === 0 ? 0 : buyCapacity < totalBuys ? buyCapacity / totalBuys : 1;

      allEntries.forEach(entry => {
        if (entry.delta > 0) {
          entry.delta = entry.delta * buyScale;
        }

        if (entry.existingWeight !== null) {
          const baseWeight = entry.existingWeight;
          const nextWeight = clamp(baseWeight + entry.delta, 0, 100);
          entry.newAllocation = nextWeight;
        } else {
          entry.newAllocation = Math.max(0, entry.delta);
        }
      });

      const mapEntryToRecommendation = (entry: TradeEntry): StockRecommendation => {
        const normalizedAllocation = entry.newAllocation != null ? roundOneDecimal(entry.newAllocation) : undefined;
        const normalizedChange = roundOneDecimal(entry.delta);

        return {
          ...entry.base,
          allocation: typeof normalizedAllocation === 'number' ? normalizedAllocation : entry.base.allocation,
          changePercent: normalizedChange,
        };
      };

      const normalizedStock = stockEntries.map(mapEntryToRecommendation);
      const normalizedComplementary = complementaryEntries.map(mapEntryToRecommendation);

      const adjustments = new Map<string, { allocation?: number; change?: number }>();
      [...stockEntries, ...complementaryEntries].forEach(entry => {
        const normalizedAllocation = entry.newAllocation != null ? roundOneDecimal(entry.newAllocation) : undefined;
        const normalizedChange = roundOneDecimal(entry.delta);
        adjustments.set(entry.key, {
          allocation: typeof normalizedAllocation === 'number' ? normalizedAllocation : undefined,
          change: normalizedChange,
        });
      });

      const updatePlan = (plan: any) => {
        if (!plan || typeof plan !== 'object') {
          return plan;
        }

        const clone: Record<string, any> = { ...plan };

        const updateAssetsForKeys = (keys: string[]) => {
          keys.forEach(key => {
            if (Array.isArray(clone[key])) {
              clone[key] = clone[key].map((asset: any) => {
                if (!asset || !asset.name) {
                  return asset;
                }

                const assetKey = makeKey(String(asset.name), (asset.ticker || asset.symbol || asset.code || null) as string | null);
                const normalized = adjustments.get(assetKey);
                if (!normalized) {
                  return asset;
                }

                const updated = { ...asset };

                if (typeof normalized.allocation === 'number') {
                  updated.allocation_percent = normalized.allocation;
                  updated.allocation = normalized.allocation;
                  updated.target_weight = normalized.allocation;
                  updated.weight = normalized.allocation;
                }

                if (typeof normalized.change === 'number') {
                  updated.change_percent = normalized.change;
                  updated.weight_change_percent = normalized.change;
                  updated.delta_percent = normalized.change;
                  updated.adjustment_percent = normalized.change;
                }

                return updated;
              });
            }
          });
        };

        updateAssetsForKeys(['recommended_assets', 'recommendations']);
        updateAssetsForKeys(['complementary_assets', 'complementaryIdeas', 'complementaryAssets']);

        return clone;
      };

      const normalizedPlan = updatePlan(structuredPlan);

      return {
        stockRecommendations: normalizedStock,
        complementaryIdeas: normalizedComplementary,
        structuredPlan: normalizedPlan,
      };
    };

    const extractNumericValue = (value: string | number | undefined): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value !== 'string') {
        return null;
      }

      const normalized = value.replace(/\s+/g, '');
      const rangeParts = normalized.split(/[-–—]/).map(part => part.replace(/[^\d.,]/g, ''));
      const numbers = rangeParts
        .map(part => {
          if (!part) return NaN;
          const withDecimal = part.replace(',', '.');
          const parsed = Number(withDecimal);
          return Number.isFinite(parsed) ? parsed : NaN;
        })
        .filter(num => Number.isFinite(num));

      if (numbers.length === 0) {
        return null;
      }

      if (numbers.length === 1) {
        return Math.round(numbers[0]);
      }

      const sum = numbers.reduce((total, num) => total + num, 0);
      return Math.round(sum / numbers.length);
    };

    const normalizeExistingProfile = (profile: any): ConversationData => {
      if (!profile) {
        return {};
      }

      const normalized: ConversationData = {};

      const age = ensureNumber(profile.age);
      if (typeof age === 'number') {
        normalized.age = age;
      }

      normalized.investmentGoal = ensureString(profile.investment_goal);
      normalized.timeHorizon = ensureString(profile.investment_horizon);
      normalized.riskTolerance = ensureString(profile.risk_tolerance);

      const monthlyInvestment = ensureNumber(profile.monthly_investment_amount);
      if (typeof monthlyInvestment === 'number') {
        normalized.monthlyAmount = monthlyInvestment.toString();
        normalized.monthlyAmountNumeric = monthlyInvestment;
      }

      const annualIncome = ensureNumber(profile.annual_income);
      if (typeof annualIncome === 'number') {
        normalized.annualIncome = annualIncome.toString();
        normalized.monthlyIncome = Math.round(annualIncome / 12).toString();
      }

      const liquidCapital = ensureNumber(profile.liquid_capital);
      if (typeof liquidCapital === 'number') {
        normalized.availableCapital = liquidCapital.toString();
        normalized.liquidCapital = liquidCapital.toString();
      }

      const emergencyBuffer = ensureNumber(profile.emergency_buffer_months);
      if (typeof emergencyBuffer === 'number') {
        normalized.emergencyBufferMonths = emergencyBuffer;
      }

      const investmentPurpose = ensureStringArray(profile.investment_purpose);
      if (investmentPurpose) {
        normalized.investmentPurpose = investmentPurpose;
      }

      const targetAmount = ensureNumber(profile.target_amount);
      if (typeof targetAmount === 'number') {
        normalized.targetAmount = targetAmount.toString();
        normalized.specificGoalAmount = targetAmount.toString();
      }

      const targetDate = ensureString(profile.target_date);
      if (targetDate) {
        normalized.targetDate = targetDate;
      }

      const preferredStockCount = ensureNumber(profile.preferred_stock_count);
      if (typeof preferredStockCount === 'number') {
        normalized.preferredStockCount = preferredStockCount;
      }

      const riskComfort = ensureNumber(profile.risk_comfort_level);
      if (typeof riskComfort === 'number') {
        normalized.volatilityComfort = riskComfort;
      }

      const panicSellingHistory = ensureBoolean(profile.panic_selling_history);
      if (typeof panicSellingHistory === 'boolean') {
        normalized.panicSellingHistory = panicSellingHistory;
      }

      const controlImportance = ensureNumber(profile.control_importance);
      if (typeof controlImportance === 'number') {
        normalized.controlImportance = controlImportance;
      }

      const crashReaction = ensureString(profile.market_crash_reaction);
      if (crashReaction) {
        normalized.marketCrashReaction = crashReaction;
      }

      const changeFrequency = ensureString(profile.portfolio_change_frequency);
      if (changeFrequency) {
        normalized.portfolioChangeFrequency = changeFrequency;
        normalized.rebalancingFrequency = changeFrequency;
      }

      const activityPreference = ensureString(profile.activity_preference);
      if (activityPreference) {
        normalized.activityPreference = activityPreference;
      }

      const stylePreference = ensureString(profile.investment_style_preference);
      if (stylePreference) {
        normalized.investmentStyle = stylePreference;
      }

      const investmentExperience = ensureString(profile.investment_experience) as ConversationData['investmentExperienceLevel'] | undefined;
      if (investmentExperience) {
        normalized.investmentExperienceLevel = investmentExperience;
        normalized.isBeginnerInvestor = investmentExperience === 'beginner';
      }

      const currentPortfolioValue = ensureNumber(profile.current_portfolio_value);
      if (typeof currentPortfolioValue === 'number') {
        normalized.currentPortfolioValue = currentPortfolioValue.toString();
      }

      const overexposureAwareness = ensureString(profile.overexposure_awareness);
      if (overexposureAwareness) {
        normalized.overexposureAwareness = overexposureAwareness;
      }

      const sectorInterests = ensureStringArray(profile.sector_interests);
      if (sectorInterests) {
        normalized.sectorExposure = sectorInterests;
        normalized.sectors = sectorInterests;
        normalized.sectorInterests = sectorInterests;
      }

      const preferredAssets = ensureStringArray(profile.preferred_assets);
      if (preferredAssets && preferredAssets.length > 0) {
        normalized.preferredAssets = preferredAssets[0];
      } else {
        const singlePreferredAsset = ensureString(profile.preferred_assets);
        if (singlePreferredAsset) {
          normalized.preferredAssets = singlePreferredAsset;
        }
      }

      const portfolioHelpFocus = ensureString(profile.portfolio_help_focus);
      if (portfolioHelpFocus) {
        normalized.portfolioHelp = portfolioHelpFocus;
      }

      const currentPortfolioStrategy = ensureString(profile.current_portfolio_strategy);
      if (currentPortfolioStrategy) {
        normalized.currentPortfolioStrategy = currentPortfolioStrategy;
      }

      const optimizationGoals = ensureStringArray(profile.optimization_goals);
      if (optimizationGoals) {
        normalized.optimizationGoals = optimizationGoals;
      }

      const optimizationRiskFocus = ensureString(profile.optimization_risk_focus);
      if (optimizationRiskFocus) {
        normalized.optimizationRiskFocus = optimizationRiskFocus;
      }

      const optimizationDiversification = ensureStringArray(profile.optimization_diversification_focus);
      if (optimizationDiversification) {
        normalized.optimizationDiversificationFocus = optimizationDiversification;
      }

      const optimizationPreference = ensureString(profile.optimization_preference);
      if (optimizationPreference) {
        normalized.optimizationPreference = optimizationPreference;
      }

      const optimizationTimeline = ensureString(profile.optimization_timeline);
      if (optimizationTimeline) {
        normalized.optimizationTimeline = optimizationTimeline;
      }

      const holdings = ensureHoldingsArray(profile.current_holdings);
      if (holdings) {
        normalized.currentHoldings = holdings;
      }

      if (profile.current_allocation) {
        normalized.currentAllocation = profile.current_allocation;
      }

      const housingSituation = ensureString(profile.housing_situation);
      if (housingSituation) {
        normalized.housingSituation = housingSituation;
      }

      const hasLoans = ensureBoolean(profile.has_loans);
      if (typeof hasLoans === 'boolean') {
        normalized.hasLoans = hasLoans;
      }

      const loanDetails = ensureString(profile.loan_details);
      if (loanDetails) {
        normalized.loanDetails = loanDetails;
      }

      const hasChildren = ensureBoolean(profile.has_children);
      if (typeof hasChildren === 'boolean') {
        normalized.hasChildren = hasChildren;
      }

      return normalized;
    };

    const mergeProfiles = (base: ConversationData, updates: ConversationData): ConversationData => {
      const merged: ConversationData = { ...base };

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        if (typeof value === 'string' && value.trim().length === 0) {
          return;
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return;
          }
          (merged as any)[key] = value;
          return;
        }

        (merged as any)[key] = value;
      });

      return merged;
    };

    const resolveInvestmentExperience = (data: ConversationData): 'beginner' | 'intermediate' | 'advanced' => {
      if (data.investmentExperienceLevel) {
        return data.investmentExperienceLevel;
      }

      if (data.experience) {
        const experienceMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
          beginner: 'beginner',
          intermediate: 'intermediate',
          advanced: 'advanced',
          expert: 'advanced',
          novice: 'beginner',
        };
        const normalized = data.experience.toLowerCase();
        if (experienceMap[normalized]) {
          return experienceMap[normalized];
        }
      }

      if (data.marketExperience) {
        const marketMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
          '0-2': 'beginner',
          '0-3': 'beginner',
          '2-5': 'intermediate',
          '3-5': 'intermediate',
          '5-10': 'advanced',
          '10-20': 'advanced',
          '20+': 'advanced',
        };
        if (marketMap[data.marketExperience]) {
          return marketMap[data.marketExperience];
        }
      }

      if (data.isBeginnerInvestor === true) {
        return 'beginner';
      }

      if (data.isBeginnerInvestor === false) {
        return 'advanced';
      }

      return 'intermediate';
    };

    setLoading(true);

    try {
      const { data: latestRiskProfile } = await supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingProfileData = normalizeExistingProfile(latestRiskProfile);
      let mergedConversationData = mergeProfiles(existingProfileData, conversationData);

      if (mode === 'optimize') {
        mergedConversationData.hasCurrentPortfolio = true;
      }

      if (!mergedConversationData.liquidCapital && mergedConversationData.availableCapital) {
        mergedConversationData.liquidCapital = mergedConversationData.availableCapital;
      }

      if (!mergedConversationData.availableCapital && mergedConversationData.liquidCapital) {
        mergedConversationData.availableCapital = mergedConversationData.liquidCapital;
      }

      if (!mergedConversationData.portfolioChangeFrequency && mergedConversationData.rebalancingFrequency) {
        mergedConversationData.portfolioChangeFrequency = mergedConversationData.rebalancingFrequency;
      }

      if (!mergedConversationData.rebalancingFrequency && mergedConversationData.portfolioChangeFrequency) {
        mergedConversationData.rebalancingFrequency = mergedConversationData.portfolioChangeFrequency;
      }

      if (!mergedConversationData.targetAmount && mergedConversationData.specificGoalAmount) {
        mergedConversationData.targetAmount = mergedConversationData.specificGoalAmount;
      }

      if (!mergedConversationData.specificGoalAmount && mergedConversationData.targetAmount) {
        mergedConversationData.specificGoalAmount = mergedConversationData.targetAmount;
      }

      if (!mergedConversationData.investmentPurpose && mergedConversationData.investmentGoal) {
        mergedConversationData.investmentPurpose = [mergedConversationData.investmentGoal];
      }

      if (!mergedConversationData.monthlyIncome && mergedConversationData.annualIncome) {
        const annualNumeric = extractNumericValue(mergedConversationData.annualIncome);
        if (annualNumeric !== null) {
          mergedConversationData.monthlyIncome = Math.round(annualNumeric / 12).toString();
        }
      }

      if (!mergedConversationData.annualIncome && mergedConversationData.monthlyIncome) {
        const monthlyNumeric = extractNumericValue(mergedConversationData.monthlyIncome);
        if (monthlyNumeric !== null) {
          mergedConversationData.annualIncome = (monthlyNumeric * 12).toString();
        }
      }

      if (!mergedConversationData.volatilityComfort && typeof mergedConversationData.emergencyBufferMonths === 'number') {
        mergedConversationData.volatilityComfort = mergedConversationData.isBeginnerInvestor ? 3 : 5;
      }

      let resolvedMonthlyInvestment = extractNumericValue(mergedConversationData.monthlyAmount);
      if (resolvedMonthlyInvestment !== null) {
        mergedConversationData.monthlyAmount = resolvedMonthlyInvestment.toString();
        mergedConversationData.monthlyAmountNumeric = resolvedMonthlyInvestment;
      } else if (typeof mergedConversationData.monthlyAmountNumeric === 'number') {
        resolvedMonthlyInvestment = mergedConversationData.monthlyAmountNumeric;
        mergedConversationData.monthlyAmount = mergedConversationData.monthlyAmountNumeric.toString();
      } else if (typeof latestRiskProfile?.monthly_investment_amount === 'number') {
        resolvedMonthlyInvestment = latestRiskProfile.monthly_investment_amount;
        mergedConversationData.monthlyAmount = resolvedMonthlyInvestment.toString();
        mergedConversationData.monthlyAmountNumeric = resolvedMonthlyInvestment;
      }

      let resolvedMonthlyIncome = extractNumericValue(mergedConversationData.monthlyIncome);
      if (resolvedMonthlyIncome !== null) {
        mergedConversationData.monthlyIncome = resolvedMonthlyIncome.toString();
      }

      let resolvedAnnualIncome = extractNumericValue(mergedConversationData.annualIncome);
      if (resolvedAnnualIncome !== null) {
        mergedConversationData.annualIncome = resolvedAnnualIncome.toString();
      } else if (resolvedMonthlyIncome !== null) {
        resolvedAnnualIncome = resolvedMonthlyIncome * 12;
        mergedConversationData.annualIncome = resolvedAnnualIncome.toString();
      }

      const resolvedLiquidCapital = extractNumericValue(mergedConversationData.liquidCapital || mergedConversationData.availableCapital);
      if (resolvedLiquidCapital !== null) {
        const liquidCapitalString = resolvedLiquidCapital.toString();
        mergedConversationData.liquidCapital = liquidCapitalString;
        if (!mergedConversationData.availableCapital) {
          mergedConversationData.availableCapital = liquidCapitalString;
        }
      }

      const resolvedTargetAmount = extractNumericValue(mergedConversationData.targetAmount || mergedConversationData.specificGoalAmount);
      if (resolvedTargetAmount !== null) {
        const targetString = resolvedTargetAmount.toString();
        mergedConversationData.targetAmount = targetString;
        if (!mergedConversationData.specificGoalAmount) {
          mergedConversationData.specificGoalAmount = targetString;
        }
      }

      const resolvedCurrentPortfolioValue = extractNumericValue(mergedConversationData.currentPortfolioValue);
      if (resolvedCurrentPortfolioValue !== null) {
        mergedConversationData.currentPortfolioValue = resolvedCurrentPortfolioValue.toString();
      }

      // Create enhanced risk profile data with all new fields
      const normalizeSectorLabel = (value: unknown): string | null => {
        if (typeof value !== 'string') {
          return null;
        }
        const trimmed = value.trim();
        if (!trimmed) {
          return null;
        }
        if (/Hållbarhetsfokus/i.test(trimmed)) {
          return 'Hållbarhet & Miljö';
        }
        if (/Geografisk/i.test(trimmed)) {
          const region = trimmed.split(':')[1]?.trim();
          return region && region.length > 0 ? region : 'Geografisk spridning';
        }
        if (/Utdelningskrav/i.test(trimmed)) {
          return null;
        }
        return trimmed;
      };

      const explicitConversationSectors =
        ensureStringArray(conversationData.sectorInterests)
          ?? ensureStringArray(conversationData.sectors)
          ?? [];

      const normalizedConversationSectors = explicitConversationSectors
        .map(normalizeSectorLabel)
        .filter((label): label is string => Boolean(label));

      const fallbackSectorSources: string[] = [];

      if (normalizedConversationSectors.length === 0) {
        const mergedSectors = ensureStringArray(mergedConversationData.sectors);
        if (mergedSectors) {
          fallbackSectorSources.push(...mergedSectors);
        }

        if (Array.isArray(existingProfileData.sectors)) {
          fallbackSectorSources.push(...existingProfileData.sectors);
        }
      }

      if (Array.isArray(mergedConversationData.interests)) {
        fallbackSectorSources.push(...mergedConversationData.interests);
      }

      if (Array.isArray(mergedConversationData.sectorExposure)) {
        fallbackSectorSources.push(...mergedConversationData.sectorExposure);
      }

      const sanitizedFallbackSources = fallbackSectorSources
        .map(normalizeSectorLabel)
        .filter((label): label is string => Boolean(label));

      const aggregatedSectorSignals = Array.from(
        new Set([...normalizedConversationSectors, ...sanitizedFallbackSources])
      );

      const interestSignalText = aggregatedSectorSignals.join(' ').toLowerCase();

      const resolvedPreferredAsset = (() => {
        const directPreferred = typeof mergedConversationData.preferredAssets === 'string' && mergedConversationData.preferredAssets.trim()
          ? mergedConversationData.preferredAssets.trim()
          : typeof existingProfileData.preferredAssets === 'string' && existingProfileData.preferredAssets.trim()
            ? existingProfileData.preferredAssets.trim()
            : undefined;

        if (directPreferred) {
          return directPreferred;
        }

        if (interestSignalText.includes('krypto') || interestSignalText.includes('crypto')) {
          return 'crypto';
        }
        if (interestSignalText.includes('tech') || interestSignalText.includes('it') || interestSignalText.includes('innovation')) {
          return 'stocks';
        }
        if (interestSignalText.includes('råvar') || interestSignalText.includes('commodity')) {
          return 'commodities';
        }
        if (mergedConversationData.sustainabilityPreference && mergedConversationData.sustainabilityPreference !== 'not_priority') {
          return 'investment_companies';
        }
        if (mergedConversationData.riskTolerance === 'conservative') {
          return 'investment_companies';
        }
        if (mergedConversationData.riskTolerance === 'aggressive') {
          return 'stocks';
        }
        return mergedConversationData.isBeginnerInvestor ? 'investment_companies' : 'stocks';
      })();

      mergedConversationData.preferredAssets = resolvedPreferredAsset;

      const derivedSectorSignals: string[] = [];
      const registerDerivedSignal = (label: string) => {
        if (!label) return;
        if (!derivedSectorSignals.includes(label)) {
          derivedSectorSignals.push(label);
        }
      };

      if (normalizedConversationSectors.length === 0) {
        if (resolvedPreferredAsset === 'crypto') {
          registerDerivedSignal('Kryptovalutor');
        } else if (resolvedPreferredAsset === 'investment_companies') {
          registerDerivedSignal('Investmentbolag');
        } else if (resolvedPreferredAsset === 'commodities') {
          registerDerivedSignal('Råvaror');
        } else if (resolvedPreferredAsset === 'stocks') {
          registerDerivedSignal('Aktier & Tillväxt');
        }

        if (mergedConversationData.sustainabilityPreference && mergedConversationData.sustainabilityPreference !== 'not_priority') {
          registerDerivedSignal('Hållbarhet & Miljö');
        }

        switch (mergedConversationData.geographicPreference) {
          case 'sweden_only':
            registerDerivedSignal('Svenska marknaden');
            break;
          case 'europe':
            registerDerivedSignal('Europa & Industri');
            break;
          case 'usa':
            registerDerivedSignal('USA & Tech');
            break;
          case 'global':
            registerDerivedSignal('Global diversifiering');
            break;
          default:
            break;
        }

        if (interestSignalText.includes('energi')) {
          registerDerivedSignal('Energi');
        }
        if (interestSignalText.includes('bank') || interestSignalText.includes('finans')) {
          registerDerivedSignal('Bank & Finans');
        }
        if (interestSignalText.includes('fastighet')) {
          registerDerivedSignal('Fastigheter');
        }
        if (interestSignalText.includes('industri')) {
          registerDerivedSignal('Industri & Verkstad');
        }
        if (interestSignalText.includes('hälsa') || interestSignalText.includes('life science')) {
          registerDerivedSignal('Hälsa & Life Science');
        }
        if (interestSignalText.includes('konsument') || interestSignalText.includes('handel')) {
          registerDerivedSignal('Konsument & Handel');
        }
      }

      let sectorInterestsForProfile: string[];

      if (normalizedConversationSectors.length > 0) {
        sectorInterestsForProfile = Array.from(new Set(normalizedConversationSectors));
      } else {
        const combinedSignals = Array.from(new Set([
          ...aggregatedSectorSignals,
          ...derivedSectorSignals
        ].map(label => label.trim()).filter(Boolean)));

        if (combinedSignals.length === 0) {
          combinedSignals.push('Bred diversifiering');
        }

        sectorInterestsForProfile = combinedSignals;
      }

      mergedConversationData.sectors = sectorInterestsForProfile;
      mergedConversationData.sectorInterests = sectorInterestsForProfile;

      const emergencyBufferMonths = typeof mergedConversationData.emergencyBufferMonths === 'number'
        ? mergedConversationData.emergencyBufferMonths
        : mergedConversationData.emergencyFund === 'yes_full'
          ? 6
          : mergedConversationData.emergencyFund === 'yes_partial'
            ? 2
            : 0;

      const investmentPurpose = mergedConversationData.investmentPurpose && mergedConversationData.investmentPurpose.length > 0
        ? mergedConversationData.investmentPurpose
        : undefined;

      const panicSellingHistory = typeof mergedConversationData.panicSellingHistory === 'boolean'
        ? mergedConversationData.panicSellingHistory
        : mergedConversationData.marketCrashReaction === 'sell_all' || mergedConversationData.marketCrashReaction === 'sell_some';

      const controlImportance = typeof mergedConversationData.controlImportance === 'number'
        ? mergedConversationData.controlImportance
        : 3;

      const activityPreference = mergedConversationData.activityPreference || (mergedConversationData.isBeginnerInvestor ? 'passive' : 'active');

      const overexposureAwareness = mergedConversationData.overexposureAwareness || (mergedConversationData.isBeginnerInvestor ? 'low' : 'high');

      const preferredStockCount = typeof mergedConversationData.preferredStockCount === 'number'
        ? mergedConversationData.preferredStockCount
        : mergedConversationData.isBeginnerInvestor ? 5 : 12;

      const riskComfortLevel = mergedConversationData.volatilityComfort || (mergedConversationData.isBeginnerInvestor ? 3 : 5);

      const investmentExperienceLevel = resolveInvestmentExperience(mergedConversationData);

      if (!mergedConversationData.investmentExperienceLevel) {
        mergedConversationData.investmentExperienceLevel = investmentExperienceLevel;
      }

      if (mergedConversationData.isBeginnerInvestor === undefined) {
        mergedConversationData.isBeginnerInvestor = investmentExperienceLevel === 'beginner';
      }

      const hasLoans = typeof mergedConversationData.hasLoans === 'boolean'
        ? mergedConversationData.hasLoans
        : Boolean(mergedConversationData.financialObligations?.some(obligation =>
            ['mortgage', 'car_loan', 'student_loan'].includes(obligation)
          ));

      const hasChildren = typeof mergedConversationData.hasChildren === 'boolean'
        ? mergedConversationData.hasChildren
        : Boolean(mergedConversationData.financialObligations?.includes('child_support'));

      const loanDetails = mergedConversationData.loanDetails
        || (mergedConversationData.financialObligations && mergedConversationData.financialObligations.length > 0
          ? mergedConversationData.financialObligations.join(', ')
          : null);

      const portfolioChangeFrequency = mergedConversationData.portfolioChangeFrequency || mergedConversationData.rebalancingFrequency || null;

      const annualIncomeValue = resolvedAnnualIncome !== null
        ? resolvedAnnualIncome
        : resolvedMonthlyIncome !== null
          ? resolvedMonthlyIncome * 12
          : null;

      const estimatedPortfolioValue = (() => {
        switch (mergedConversationData.portfolioSize) {
          case 'under_10000':
            return 5000;
          case '10000_50000':
            return 30000;
          case '50000_200000':
            return 125000;
          case 'over_200000':
            return 300000;
          case 'small':
            return 50000;
          case 'medium':
            return 300000;
          case 'large':
            return 750000;
          case 'very_large':
            return 1500000;
          default:
            return null;
        }
      })();

      const currentPortfolioValue = resolvedCurrentPortfolioValue !== null
        ? resolvedCurrentPortfolioValue
        : estimatedPortfolioValue;

      const currentAllocationValue = typeof mergedConversationData.currentAllocation === 'string'
        ? { self_reported: mergedConversationData.currentAllocation }
        : mergedConversationData.currentAllocation || {};

      const monthlyInvestmentAmount = resolvedMonthlyInvestment !== null ? resolvedMonthlyInvestment : 5000;
      const liquidCapitalValue = resolvedLiquidCapital !== null ? resolvedLiquidCapital : null;
      const targetAmountValue = resolvedTargetAmount !== null ? resolvedTargetAmount : null;

      const enhancedPrompt = buildEnhancedAIPrompt(mergedConversationData, mode);

      const normalizedOptimizationGoals = ensureStringArray(mergedConversationData.optimizationGoals) ?? [];
      if (normalizedOptimizationGoals.length > 0) {
        mergedConversationData.optimizationGoals = normalizedOptimizationGoals;
      }

      const normalizedOptimizationDiversification =
        ensureStringArray(mergedConversationData.optimizationDiversificationFocus) ?? [];
      if (normalizedOptimizationDiversification.length > 0) {
        mergedConversationData.optimizationDiversificationFocus = normalizedOptimizationDiversification;
      }

      const normalizedPreferredAssets = ensureStringArray(
        Array.isArray(mergedConversationData.preferredAssets)
          ? mergedConversationData.preferredAssets
          : mergedConversationData.preferredAssets
            ? [mergedConversationData.preferredAssets]
            : undefined
      ) ?? [];

      const normalizedPortfolioHelp = ensureString(mergedConversationData.portfolioHelp) ?? null;
      if (normalizedPortfolioHelp) {
        mergedConversationData.portfolioHelp = normalizedPortfolioHelp;
      }

      const normalizedCurrentStrategy = ensureString(mergedConversationData.currentPortfolioStrategy) ?? null;

      const normalizedOptimizationPreference = ensureString(mergedConversationData.optimizationPreference) ?? null;
      const normalizedOptimizationTimeline = ensureString(mergedConversationData.optimizationTimeline) ?? null;
      const normalizedOptimizationRiskFocus = ensureString(mergedConversationData.optimizationRiskFocus) ?? null;

      const riskProfileData = {
        age: mergedConversationData.age ?? existingProfileData.age ?? 25,
        monthly_investment_amount: monthlyInvestmentAmount,
        investment_horizon: mergedConversationData.timeHorizon || null,
        investment_goal: mergedConversationData.investmentGoal || 'growth',
        risk_tolerance: mergedConversationData.riskTolerance || null,
        investment_experience: investmentExperienceLevel,
        sector_interests: sectorInterestsForProfile,
        current_holdings: mergedConversationData.currentHoldings || [],
        current_allocation: currentAllocationValue,
        housing_situation: mergedConversationData.housingSituation || null,
        has_loans: hasLoans,
        loan_details: loanDetails,
        has_children: hasChildren,
        liquid_capital: liquidCapitalValue,
        emergency_buffer_months: emergencyBufferMonths,
        investment_purpose: investmentPurpose || (mergedConversationData.investmentGoal ? [mergedConversationData.investmentGoal] : ['wealth_building']),
        target_amount: targetAmountValue,
        target_date: mergedConversationData.targetDate || null,
        risk_comfort_level: riskComfortLevel,
        panic_selling_history: panicSellingHistory,
        control_importance: controlImportance,
        market_crash_reaction: mergedConversationData.marketCrashReaction || null,
        portfolio_change_frequency: portfolioChangeFrequency,
        activity_preference: activityPreference,
        investment_style_preference: mergedConversationData.investmentStyle || (investmentExperienceLevel === 'beginner' ? 'long_term' : 'balanced'),
        overexposure_awareness: overexposureAwareness,
        preferred_stock_count: preferredStockCount,
        annual_income: annualIncomeValue,
        current_portfolio_value: currentPortfolioValue,
        portfolio_help_focus: normalizedPortfolioHelp,
        current_portfolio_strategy: normalizedCurrentStrategy,
        optimization_goals: normalizedOptimizationGoals,
        optimization_risk_focus: normalizedOptimizationRiskFocus,
        optimization_diversification_focus: normalizedOptimizationDiversification,
        optimization_preference: normalizedOptimizationPreference,
        optimization_timeline: normalizedOptimizationTimeline,
        preferred_assets: normalizedPreferredAssets,
        user_id: user.id
      };

      const { data: riskProfile, error: riskProfileError } = await supabase
        .from('user_risk_profiles')
        .insert(riskProfileData)
        .select()
        .single();

      if (riskProfileError) {
        console.error('Error creating risk profile:', riskProfileError);
        toast({
          title: "Error",
          description: "Kunde inte spara riskprofilen",
          variant: "destructive",
        });
        return null;
      }

      // Generate AI response with enhanced risk profile using proper endpoint.
      // The backend now owns the full system directive for OpenAI, so we only pass
      // through structured conversation data here to avoid conflicting prompts.
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-portfolio', {
        body: {
          riskProfileId: riskProfile.id,
          userId: user.id,
          conversationData: mergedConversationData,
          conversationPrompt: enhancedPrompt,
          mode
        }
      });

      if (aiError || !aiResponse) {
        console.error('Error generating AI response:', aiError);
        toast({
          title: "Error",
          description: "Kunde inte generera portföljstrategi",
          variant: "destructive",
        });
        return null;
      }
      let structuredPlan = aiResponse.plan;

      if (typeof structuredPlan === 'string') {
        try {
          // Remove markdown code blocks if present
          let cleanedPlan = structuredPlan.trim();
          if (cleanedPlan.startsWith('```json')) {
            cleanedPlan = cleanedPlan.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedPlan.startsWith('```')) {
            cleanedPlan = cleanedPlan.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          structuredPlan = JSON.parse(cleanedPlan);
        } catch (error) {
          console.warn('Failed to parse structured plan string:', error);
          // Try to extract JSON from the string if it contains markdown
          try {
            const jsonMatch = structuredPlan.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              structuredPlan = JSON.parse(jsonMatch[0]);
            }
          } catch (secondError) {
            console.warn('Failed to extract JSON from markdown:', secondError);
          }
        }
      }

      // Extract AI response from multiple possible fields for compatibility
      const aiRecommendationText = (() => {
        if (structuredPlan) {
          try {
            return JSON.stringify(structuredPlan);
          } catch (error) {
            console.warn('Failed to stringify structured plan:', error);
          }
        }

        const textCandidates = [aiResponse.aiRecommendations, aiResponse.aiResponse, aiResponse.response];
        for (const candidate of textCandidates) {
          if (typeof candidate === 'string' && candidate.trim().length > 0) {
            // Remove markdown code blocks if present
            let cleaned = candidate.trim();
            if (cleaned.startsWith('```json')) {
              cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            return cleaned;
          }
        }

        return '';
      })();


      // Extract stock recommendations from AI response or structured plan
      let stockRecommendations = extractStockRecommendations(aiRecommendationText);
      let complementaryIdeas: StockRecommendation[] = [];

      const recommendedAssetCandidates =
        structuredPlan && typeof structuredPlan === 'object'
          ? coerceArray(
              (structuredPlan as any).recommended_assets ??
              (structuredPlan as any).recommendations ??
              (structuredPlan as any).assets
            )
          : [];

      if (recommendedAssetCandidates.length > 0) {
        const mapped = recommendedAssetCandidates
          .map(mapPlanAssetToRecommendation)
          .filter((asset): asset is StockRecommendation => Boolean(asset));

        if (mapped.length > 0) {
          stockRecommendations = mapped;
        }
      }

      const complementaryAssetCandidates =
        structuredPlan && typeof structuredPlan === 'object'
          ? coerceArray(
              (structuredPlan as any).complementary_assets ??
              (structuredPlan as any).complementaryIdeas ??
              (structuredPlan as any).complementaryAssets
            )
          : [];

      if (complementaryAssetCandidates.length > 0) {
        const mappedComplementary = complementaryAssetCandidates
          .map(mapPlanAssetToRecommendation)
          .filter((asset): asset is StockRecommendation => Boolean(asset));

        if (mappedComplementary.length > 0) {
          complementaryIdeas = mappedComplementary;
        }
      }

      stockRecommendations = dedupeRecommendations(stockRecommendations);
      complementaryIdeas = dedupeRecommendations(complementaryIdeas);

      const normalizedTrades = normalizeTradeOutputs({
        stockRecommendations,
        complementaryIdeas,
        structuredPlan,
        mode,
      });

      stockRecommendations = normalizedTrades.stockRecommendations;
      complementaryIdeas = normalizedTrades.complementaryIdeas;
      structuredPlan = normalizedTrades.structuredPlan;

      if (mode === 'optimize') {
        // När användaren har en befintlig portfölj, ska vi endast ge analys
        // Inga köp-, sälj- eller omstruktureringsrekommendationer ska genereras
        // Men structuredPlan ska innehålla analysen med risker, allokering osv.
        complementaryIdeas = [];
        stockRecommendations = [];
        
        // Se till att structuredPlan innehåller analysinformation men ta bort rekommendationer och nästa steg
        if (structuredPlan && typeof structuredPlan === 'object') {
          // Ta bort next_steps och recommended_assets från analyser
          structuredPlan = {
            ...structuredPlan,
            next_steps: [],
            recommended_assets: [],
            complementary_assets: []
          };
        }
      }

      if (stockRecommendations.length === 0) {
        console.warn('No stock recommendations extracted, but continuing with portfolio creation');
        // Don't throw error, just show the AI response to user
      }

      // Save stock recommendations to user_holdings table
      if (mode === 'new' && stockRecommendations.length > 0) {
        const holdingsToInsert = stockRecommendations.map(stock => ({
          user_id: user.id,
          holding_type: 'recommendation',
          name: stock.name,
          symbol: stock.symbol || null,
          quantity: 0,
          current_value: 0,
          purchase_price: 0,
          purchase_date: new Date().toISOString().split('T')[0],
          sector: stock.sector || null,
          market: 'Swedish',
          currency: 'SEK',
          is_cash: false
        }));

        const { error: holdingsError } = await supabase
          .from('user_holdings')
          .insert(holdingsToInsert);

        if (holdingsError) {
          console.error('Error saving stock recommendations:', holdingsError);
        } else {
        }
      }

      const riskTolerance = mergedConversationData.riskTolerance?.toLowerCase();
      const expectedReturn = riskTolerance === 'aggressive' ? 0.12 : riskTolerance === 'conservative' ? 0.05 : 0.08;
      const comfortScore = riskComfortLevel ?? 5;
      const baseRiskScore = riskTolerance === 'aggressive' ? 7 : riskTolerance === 'conservative' ? 3 : 5;
      const combinedRiskScore = Math.round((baseRiskScore + comfortScore) / 2);

      // Calculate allocation summary from current holdings for analyses
      const calculateAllocationFromHoldings = (holdings: typeof holdingsWithPercentages) => {
        let stocksTotal = 0;
        let bondsTotal = 0;
        let cashTotal = 0;
        
        if (holdings.length === 0) {
          return { stocks: 0, bonds: 0, cash: 0 };
        }

        holdings.forEach(holding => {
          const percentage = holding.weight || 0;
          // Classify based on sector or name
          const sector = (holding as any).sector?.toLowerCase() || '';
          const name = (holding.name || '').toLowerCase();
          
          if (sector.includes('bank') || sector.includes('fastighet') || 
              name.includes('bank') || name.includes('fastighet') || 
              sector.includes('financial') || sector.includes('real estate')) {
            bondsTotal += percentage;
          } else if (sector.includes('cash') || name.includes('kontant') || name.includes('cash')) {
            cashTotal += percentage;
          } else {
            stocksTotal += percentage;
          }
        });

        // Normalize to 100%
        const total = stocksTotal + bondsTotal + cashTotal;
        if (total > 0 && total !== 100) {
          const scale = 100 / total;
          stocksTotal = stocksTotal * scale;
          bondsTotal = bondsTotal * scale;
          cashTotal = cashTotal * scale;
        }

        return {
          stocks: Math.round(stocksTotal),
          bonds: Math.round(bondsTotal),
          cash: Math.round(cashTotal)
        };
      };

      // Create enhanced asset allocation with all conversation data and AI analysis
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(mergedConversationData)),
        original_conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: structuredPlan || aiRecommendationText,
        ai_strategy_raw: aiRecommendationText,
        ai_prompt_used: enhancedPrompt,
        structured_plan: structuredPlan,
        stock_recommendations: stockRecommendations,
        complementary_ideas: complementaryIdeas,
        allocation_summary: mode === 'optimize' && holdingsWithPercentages.length > 0
          ? calculateAllocationFromHoldings(holdingsWithPercentages)
          : (stockRecommendations.length > 0 ? {
              stocks: stockRecommendations.reduce((sum, s) => sum + (s.allocation || 0), 0),
              bonds: 0,
              cash: 0
            } : undefined),
        risk_profile_summary: {
          experience_level: investmentExperienceLevel,
          risk_comfort: riskComfortLevel,
          geographic_preference: mergedConversationData.geographicPreference,
          sustainability_focus: mergedConversationData.sustainabilityPreference,
          investment_style: mergedConversationData.investmentStyle,
          market_crash_behavior: mergedConversationData.marketCrashReaction
        },
        analysis_metadata: {
          created_at: new Date().toISOString(),
          prompt_length: enhancedPrompt.length,
          response_length: aiRecommendationText?.length || 0,
          ai_model: 'gpt-4o',
          analysis_type: mode === 'optimize' ? 'portfolio_analysis' : 'comprehensive_portfolio_strategy'
        }
      };

      // Create a portfolio in the database with the AI response and extracted recommendations
      let portfolioRecord: any = null;

      if (mode === 'new') {
        const portfolioData = {
          user_id: user.id,
          risk_profile_id: riskProfile.id,
          portfolio_name: 'AI-Genererad Personlig Portfölj',
          asset_allocation: assetAllocation,
          recommended_stocks: stockRecommendations,
          total_value: 0,
          expected_return: expectedReturn,
          risk_score: combinedRiskScore,
          is_active: true
        };

        const { data: portfolio, error: portfolioError } = await supabase
          .from('user_portfolios')
          .insert(portfolioData)
          .select()
          .single();

        if (portfolioError) {
          console.error('Error creating portfolio:', portfolioError);
          toast({
            title: "Error",
            description: "Kunde inte spara portföljen",
            variant: "destructive",
          });
          return null;
        }

        portfolioRecord = portfolio;

        toast({
          title: "Framgång!",
          description: "Din personliga portföljstrategi har skapats med förbättrad riskanalys",
        });
      } else {
        // Save optimization/analysis results to database as well
        const portfolioData = {
          user_id: user.id,
          risk_profile_id: riskProfile.id,
          portfolio_name: 'Portföljsammanfattning gjord av AI',
          asset_allocation: assetAllocation,
          recommended_stocks: stockRecommendations,
          total_value: 0,
          expected_return: expectedReturn,
          risk_score: combinedRiskScore,
          is_active: false // Mark as inactive since it's an analysis, not an active portfolio
        };

        const { data: portfolio, error: portfolioError } = await supabase
          .from('user_portfolios')
          .insert(portfolioData)
          .select()
          .single();

        if (portfolioError) {
          console.error('Error creating portfolio analysis:', portfolioError);
          // Don't fail the whole operation if saving fails
        } else {
          portfolioRecord = portfolio;
        }

        toast({
          title: "Analys klar!",
          description: "Din befintliga portfölj har analyserats och optimeringsförslag har genererats.",
        });
      }

      return {
        aiResponse: aiRecommendationText,
        plan: structuredPlan || null,
        portfolio: aiResponse.portfolio || portfolioRecord,
        riskProfile,
        enhancedPrompt,
        stockRecommendations,
        complementaryIdeas,
        mode
      };

    } catch (error: any) {
      console.error('Error in generatePortfolioFromConversation:', error);
      toast({
        title: "Error",
        description: "Ett oväntat fel uppstod",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generatePortfolioFromConversation,
    loading
  };
};
