import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const useConversationalPortfolio = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced stock recommendation extraction - completely dynamic
  const extractStockRecommendations = (aiResponse: string) => {
    const recommendations: Array<{
      name: string;
      symbol?: string;
      sector?: string;
      reasoning?: string;
      allocation?: number;
      isin?: string;
    }> = [];


    try {
      const parsed = JSON.parse(aiResponse);
      const recs = Array.isArray(parsed)
        ? parsed
        : parsed.recommendations || parsed.recommended_assets;
      if (Array.isArray(recs)) {
        recs.forEach((rec: any) => {
          if (rec && rec.name) {
            recommendations.push({
              name: rec.name,
              symbol: rec.symbol || rec.ticker,
              sector: rec.sector,
              reasoning: rec.reasoning || rec.rationale,
              allocation: typeof rec.allocation_percent === 'string'
                ? parseInt(rec.allocation_percent.replace(/[^\d]/g, ''))
                : typeof rec.allocation_percent === 'number'
                ? rec.allocation_percent
                : typeof rec.allocation === 'string'
                ? parseInt(rec.allocation.replace(/[^\d]/g, ''))
                : rec.allocation,
              isin: rec.isin
            });
          }
        });
        return recommendations.slice(0, 10);
      }
    } catch (e) {
      console.warn('AI response not valid JSON, using regex fallback');
    }

    // Enhanced patterns for parsing AI recommendations with numbered lists
    const patterns = [
      // Pattern: 1. **Company Name (SYMBOL)**: Description... Allokering: XX%
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\s*\(([A-Z\s-]+?)\)\*\*:\s*([^.]+(?:\.[^.]*)*?)(?:.*?Allokering:\s*(\d+)%)?/gi,
      // Pattern: **Company Name (SYMBOL)**: Description (without explicit allocation)
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\s*\(([A-Z\s-]+?)\)\*\*:\s*([^.]+(?:\.[^.]*)*?)/gi,
      // Pattern: **Company Name**: Description (for funds without symbols)
      /(?:\d+\.\s*)?\*\*([^*\(\)]+?)\*\*:\s*([^.]+(?:\.[^.]*)*?)(?:.*?Allokering:\s*(\d+)%)?/gi,
      // Pattern: Company Name (SYMBOL): Description (simple format)
      /(?:\d+\.\s*)?([A-ZÅÄÖ][a-zåäö\s&.-]+)\s*\(([A-Z\s-]+)\):\s*([^.\n]+)/g,
    ];

    // Extract using enhanced patterns
    patterns.forEach((pattern, patternIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(aiResponse)) !== null) {
        let name = '';
        let symbol = '';
        let reasoning = '';
        let allocation = 10; // Default allocation
        
        if (patternIndex === 0) {
          // Pattern: 1. **Company Name (SYMBOL)**: Description... Allokering: XX%
          [, name, symbol, reasoning] = match;
          const allocationMatch = match[4];
          allocation = allocationMatch ? parseInt(allocationMatch) : 12;
        } else if (patternIndex === 1) {
          // Pattern: **Company Name (SYMBOL)**: Description (without explicit allocation)
          [, name, symbol, reasoning] = match;
          allocation = 10; // Default for this pattern
        } else if (patternIndex === 2) {
          // Pattern: **Company Name**: Description (for funds)
          [, name, reasoning] = match;
          const allocationMatch = match[3];
          allocation = allocationMatch ? parseInt(allocationMatch) : 15;
          // No predefined symbol lookup - let AI provide it or leave empty
        } else if (patternIndex === 3) {
          // Pattern: Company Name (SYMBOL): Description
          [, name, symbol, reasoning] = match;
        }

        if (name && name.trim().length > 2) {
          const cleanName = name.trim();
          const cleanSymbol = symbol ? symbol.trim().replace(/\s+/g, '').replace(/^([A-Z]+)\s*([A-Z])$/, '$1-$2') : '';
          
          // Determine sector from AI reasoning or name context
          let detectedSector = 'Allmän';
          const reasoningLower = reasoning?.toLowerCase() || '';
          const nameLower = cleanName.toLowerCase();
          
          // Simple sector detection based on keywords
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

          // Avoid duplicates
          if (!recommendations.find(r => 
            r.name.toLowerCase() === cleanName.toLowerCase() || 
            (r.symbol && cleanSymbol && r.symbol.toLowerCase() === cleanSymbol.toLowerCase())
          )) {
            recommendations.push({
              name: cleanName,
              symbol: cleanSymbol || undefined,
              sector: detectedSector,
              reasoning: reasoning ? reasoning.trim() : 'AI-rekommenderad investering',
              allocation: allocation || 10
            });
          }
        }
      }
    });

    return recommendations.slice(0, 10); // Limit to 10 recommendations
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
      short: '1-3 år (kort sikt)',
      medium: '3-7 år (medellång sikt)',
      long: '7-15 år (lång sikt)',
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

    const formattedAge = typeof conversationData.age === 'number'
      ? `${conversationData.age} år`
      : 'Ej angiven';

    const formattedMonthlyInvestment = monthlyInvestmentText === 'Ej angivet'
      ? 'Ej angivet'
      : `${monthlyInvestmentText} SEK`;

    let prompt = `Skapa en detaljerad och personlig portföljstrategi baserat på följande omfattande konsultation:

GRUNDLÄGGANDE PROFIL:
- Erfarenhetsnivå: ${conversationData.isBeginnerInvestor ? 'Nybörjare (första gången investera)' : 'Erfaren investerare (flera års erfarenhet)'}
- Ålder: ${formattedAge}
- Månatligt investeringsbelopp: ${formattedMonthlyInvestment}
- Investeringsmål: ${investmentGoalText}
- Tidshorisont: ${timeHorizonText}
- Risktolerans: ${riskToleranceText}
- Befintlig portfölj: ${formatBoolean(conversationData.hasCurrentPortfolio)}`;

    if (annualIncomeText && annualIncomeText !== 'Ej angivet') {
      prompt += `
- Årsinkomst: ${annualIncomeText} SEK`;
    }

    if (monthlyIncomeText && monthlyIncomeText !== 'Ej angivet') {
      prompt += `
- Månadsinkomst: ${monthlyIncomeText}`;
    }

    if (availableCapitalText && availableCapitalText !== 'Ej angivet') {
      prompt += `
- Tillgängligt kapital för investeringar: ${availableCapitalText}`;
    }

    if (preferredAssetsText) {
      prompt += `
- Mest intresserad av: ${preferredAssetsText}`;
    }

    if (mode === 'optimize') {
      if (conversationData.currentPortfolioStrategy) {
        prompt += `
- Nuvarande strategi: ${conversationData.currentPortfolioStrategy}`;
      }

      if (optimizationGoalsText && optimizationGoalsText.length > 0) {
        prompt += `
- Optimeringsmål: ${optimizationGoalsText.join(', ')}`;
      }

      if (optimizationPreferenceText) {
        prompt += `
- Önskat arbetssätt: ${optimizationPreferenceText}`;
      }

      if (optimizationTimelineText) {
        prompt += `
- Tidslinje för förändringar: ${optimizationTimelineText}`;
      }

      if (optimizationRiskFocusText) {
        prompt += `
- Största riskoro idag: ${optimizationRiskFocusText}`;
      }

      if (optimizationDiversificationText && optimizationDiversificationText.length > 0) {
        prompt += `
- Områden att diversifiera mot: ${optimizationDiversificationText.join(', ')}`;
      }
    }

    if (liquidCapitalText && liquidCapitalText !== 'Ej angivet') {
      prompt += `
- Likvida medel: ${liquidCapitalText} SEK`;
    }

    if (emergencyBufferText) {
      prompt += `
- Buffert (antal månader): ${emergencyBufferText}`;
    }

    if (emergencyFundText) {
      prompt += `
- Buffertstatus: ${emergencyFundText}`;
    }

    if (conversationData.financialObligations && conversationData.financialObligations.length > 0) {
      prompt += `
- Ekonomiska förpliktelser: ${conversationData.financialObligations.join(', ')}`;
    }

    if (conversationData.housingSituation) {
      prompt += `
- Bostadssituation: ${conversationData.housingSituation}`;
    }

    if (typeof conversationData.hasLoans === 'boolean') {
      prompt += `
- Har ytterligare lån: ${conversationData.hasLoans ? 'Ja' : 'Nej'}`;
    }

    if (conversationData.loanDetails) {
      prompt += `
- Lånedetaljer: ${conversationData.loanDetails}`;
    }

    if (typeof conversationData.hasChildren === 'boolean') {
      prompt += `
- Har barn/försörjningsansvar: ${conversationData.hasChildren ? 'Ja' : 'Nej'}`;
    }

    if (currentPortfolioValueText && currentPortfolioValueText !== 'Ej angivet') {
      prompt += `
- Nuvarande portföljvärde: ${currentPortfolioValueText} SEK`;
    }

    if (mode === 'optimize') {
      prompt += `

OPTIMERING AV BEFINTLIG PORTFÖLJ:
1. Gör en djup analys av nuvarande innehav, allokering och riskprofil innan du föreslår förändringar.
2. Koppla varje rekommendation direkt till användarens uttryckta optimeringsmål och tidslinje.
3. Ge konkreta åtgärdsförslag för hur portföljen kan förbättras (t.ex. rebalansering, reducera avgifter, minska koncentrationsrisk).
4. Identifiera styrkor/svagheter i befintliga innehav och föreslå tydliga förbättringar.
5. Om användaren vill undvika nya investeringar, fokusera på omstrukturering av befintliga innehav snarare än att skapa en ny portfölj.
6. Om användaren accepterar nya idéer, föreslå endast kompletterande innehav som adresserar deras mål och förklara exakt hur de integreras.
7. Ge en prioriterad handlingsplan med tidsramar för genomförande.
8. Kommentera riskhantering, diversifiering och eventuella skatteeffekter baserat på användarens svar.
9. Använd samma numrerade format för rekommendationer men markera tydligt om det handlar om behålla, öka, minska eller nytt innehav.
10. Avsluta med en sammanfattning av förväntad effekt av optimeringen.`;

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `

NUVARANDE INNEHAV SOM SKA ANALYSERAS: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`;
      }

    } else if (conversationData.isBeginnerInvestor === true) {
      prompt += `

NYBÖRJARE - UTFÖRLIG EKONOMISK PROFIL:`;

      if (conversationData.interests && conversationData.interests.length > 0) {
        prompt += `
- Personliga intressen: ${conversationData.interests.join(', ')}`;
      }

      if (conversationData.companies && conversationData.companies.length > 0) {
        prompt += `
- Företag de gillar: ${conversationData.companies.join(', ')}`;
      }

      if (sustainabilityText) {
        prompt += `
- Hållbarhetspreferens: ${sustainabilityText}`;
      }

      if (geographicText) {
        prompt += `
- Geografisk preferens: ${geographicText}`;
      }

      if (marketCrashText) {
        prompt += `
- Reaktion på börskrasch: ${marketCrashText}`;
      }

      if (conversationData.volatilityComfort) {
        prompt += `
- Komfort med volatilitet: ${conversationData.volatilityComfort}/10`;
      }

      if (portfolioHelpText) {
        prompt += `
- Önskad hjälp från rådgivaren: ${portfolioHelpText}`;
      }

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `
- Nuvarande innehav: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`;
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
      prompt += `

ERFAREN INVESTERARE - AVANCERAD PROFIL:`;

      if (marketExperienceText) {
        prompt += `
- Investeringserfarenhet: ${marketExperienceText}`;
      }

      if (previousPerformanceText) {
        prompt += `
- Historisk prestanda vs marknad: ${previousPerformanceText}`;
      }

      if (conversationData.currentAllocation) {
        prompt += `
- Nuvarande allokering: ${conversationData.currentAllocation}`;
      }

      if (conversationData.sectorExposure && conversationData.sectorExposure.length > 0) {
        prompt += `
- Befintlig sektorexponering: ${conversationData.sectorExposure.join(', ')}`;
      }

      if (investmentStyleText) {
        prompt += `
- Investeringsstil: ${investmentStyleText}`;
      }

      if (dividendRequirementText) {
        prompt += `
- Direktavkastningskrav: ${dividendRequirementText}`;
      }

      if (conversationData.maxDrawdownTolerance) {
        prompt += `
- Maximal drawdown-tolerans: ${conversationData.maxDrawdownTolerance}/10`;
      }

      if (conversationData.taxConsideration) {
        prompt += `
- Skatteoptimering: ${conversationData.taxConsideration}`;
      }

      if (portfolioSizeText) {
        prompt += `
- Portföljstorlek: ${portfolioSizeText}`;
      }

      if (tradingFrequencyText) {
        prompt += `
- Handelsfrekvens: ${tradingFrequencyText}`;
      }

      if (rebalancingText) {
        prompt += `
- Rebalanseringsfrekvens: ${rebalancingText}`;
      }

      if (marketCrashText) {
        prompt += `
- Reaktion på börskrasch: ${marketCrashText}`;
      }

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `
- Nuvarande innehav: ${conversationData.currentHoldings.map(h =>
          `${h.name} (${h.quantity} st à ${h.purchasePrice} ${h.currency?.trim()?.toUpperCase() || 'SEK'})`
        ).join(', ')}`;
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

    if (
      investmentPurposes ||
      combinedGoalAmount ||
      conversationData.targetDate ||
      typeof conversationData.preferredStockCount === 'number' ||
      typeof conversationData.controlImportance === 'number' ||
      typeof conversationData.panicSellingHistory === 'boolean' ||
      conversationData.activityPreference ||
      conversationData.portfolioChangeFrequency ||
      conversationData.overexposureAwareness ||
      conversationData.communicationStyle ||
      conversationData.preferredResponseLength ||
      conversationData.additionalNotes
    ) {
      prompt += `

FÖRDJUPADE PREFERENSER:`;

      if (investmentPurposes) {
        prompt += `
- Investeringssyften: ${investmentPurposes.join(', ')}`;
      }

      if (combinedGoalAmount) {
        prompt += `
- Specifikt målbelopp: ${combinedGoalAmount}`;
      }

      if (conversationData.targetDate) {
        prompt += `
- Måldatum för uppnått mål: ${conversationData.targetDate}`;
      }

      if (typeof conversationData.preferredStockCount === 'number') {
        prompt += `
- Önskat antal innehav i portföljen: ${conversationData.preferredStockCount}`;
      }

      if (typeof conversationData.controlImportance === 'number') {
        prompt += `
- Kontrollbehov (1-5): ${conversationData.controlImportance}`;
      }

      if (typeof conversationData.panicSellingHistory === 'boolean') {
        prompt += `
- Har paniksålt tidigare: ${conversationData.panicSellingHistory ? 'Ja' : 'Nej'}`;
      }

      if (conversationData.activityPreference) {
        prompt += `
- Aktivitetspreferens: ${conversationData.activityPreference}`;
      }

      if (conversationData.portfolioChangeFrequency || conversationData.rebalancingFrequency) {
        prompt += `
- Föredragen ombalanseringsfrekvens: ${conversationData.portfolioChangeFrequency || rebalancingText || conversationData.rebalancingFrequency}`;
      }

      if (conversationData.overexposureAwareness) {
        prompt += `
- Medvetenhet kring överexponering: ${conversationData.overexposureAwareness}`;
      }

      if (conversationData.communicationStyle) {
        prompt += `
- Önskad kommunikationsstil: ${conversationData.communicationStyle}`;
      }

      if (conversationData.preferredResponseLength) {
        prompt += `
- Önskad svarslängd: ${conversationData.preferredResponseLength}`;
      }

      if (conversationData.additionalNotes) {
        prompt += `
- Ytterligare anteckningar: ${conversationData.additionalNotes}`;
      }
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
    const mode: PortfolioGenerationMode = requestedMode ?? (conversationData.hasCurrentPortfolio ? 'optimize' : 'new');

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

      const aggregatedSectorSources = [
        ...(Array.isArray(mergedConversationData.sectors) ? mergedConversationData.sectors : []),
        ...(Array.isArray(mergedConversationData.interests) ? mergedConversationData.interests : []),
        ...(Array.isArray(mergedConversationData.sectorExposure) ? mergedConversationData.sectorExposure : []),
        ...(Array.isArray(existingProfileData.sectors) ? existingProfileData.sectors : []),
      ];

      const sanitizedInterestSources = aggregatedSectorSources
        .map(normalizeSectorLabel)
        .filter((label): label is string => Boolean(label));

      const interestSignalText = sanitizedInterestSources.join(' ').toLowerCase();

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

      if (resolvedPreferredAsset === 'crypto') {
        derivedSectorSignals.push('Kryptovalutor');
      } else if (resolvedPreferredAsset === 'investment_companies') {
        derivedSectorSignals.push('Investmentbolag');
      } else if (resolvedPreferredAsset === 'commodities') {
        derivedSectorSignals.push('Råvaror');
      } else if (resolvedPreferredAsset === 'stocks') {
        derivedSectorSignals.push('Aktier & Tillväxt');
      }

      if (mergedConversationData.sustainabilityPreference && mergedConversationData.sustainabilityPreference !== 'not_priority') {
        derivedSectorSignals.push('Hållbarhet & Miljö');
      }

      switch (mergedConversationData.geographicPreference) {
        case 'sweden_only':
          derivedSectorSignals.push('Svenska marknaden');
          break;
        case 'europe':
          derivedSectorSignals.push('Europa & Industri');
          break;
        case 'usa':
          derivedSectorSignals.push('USA & Tech');
          break;
        case 'global':
          derivedSectorSignals.push('Global diversifiering');
          break;
        default:
          break;
      }

      if (interestSignalText.includes('energi')) {
        derivedSectorSignals.push('Energi');
      }
      if (interestSignalText.includes('bank') || interestSignalText.includes('finans')) {
        derivedSectorSignals.push('Bank & Finans');
      }
      if (interestSignalText.includes('fastighet')) {
        derivedSectorSignals.push('Fastigheter');
      }
      if (interestSignalText.includes('industri')) {
        derivedSectorSignals.push('Industri & Verkstad');
      }
      if (interestSignalText.includes('hälsa') || interestSignalText.includes('life science')) {
        derivedSectorSignals.push('Hälsa & Life Science');
      }
      if (interestSignalText.includes('konsument') || interestSignalText.includes('handel')) {
        derivedSectorSignals.push('Konsument & Handel');
      }

      const sectorInterestsForProfile = Array.from(new Set([
        ...sanitizedInterestSources,
        ...derivedSectorSignals
      ].map(label => label.trim()).filter(Boolean)));

      if (sectorInterestsForProfile.length === 0) {
        sectorInterestsForProfile.push('Bred diversifiering');
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


      const structuredPlan = aiResponse.plan;

      // Extract AI response from multiple possible fields for compatibility
      const aiRecommendationText = structuredPlan
        ? JSON.stringify(structuredPlan)
        : aiResponse.aiRecommendations || aiResponse.aiResponse || aiResponse.response || '';


      // Extract stock recommendations from AI response or structured plan
      let stockRecommendations = extractStockRecommendations(aiRecommendationText);

      if (structuredPlan?.recommended_assets?.length) {
        const mapped = structuredPlan.recommended_assets
          .map((asset: any) => {
            if (!asset?.name) return null;
            const allocation = typeof asset.allocation_percent === 'number'
              ? asset.allocation_percent
              : typeof asset.allocation_percent === 'string'
              ? parseInt(asset.allocation_percent.replace(/[^\d]/g, ''))
              : typeof asset.allocation === 'number'
              ? asset.allocation
              : typeof asset.allocation === 'string'
              ? parseInt(asset.allocation.replace(/[^\d]/g, ''))
              : 0;
            return {
              name: asset.name,
              symbol: asset.ticker || asset.symbol || undefined,
              sector: asset.sector,
              reasoning: asset.rationale || asset.reasoning,
              allocation,
              isin: asset.isin
            };
          })
          .filter(Boolean);

        if (mapped.length > 0) {
          stockRecommendations = mapped as typeof stockRecommendations;
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

      // Create enhanced asset allocation with all conversation data and AI analysis
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(mergedConversationData)),
        original_conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: structuredPlan || aiRecommendationText,
        ai_strategy_raw: aiRecommendationText,
        ai_prompt_used: enhancedPrompt,
        structured_plan: structuredPlan,
        stock_recommendations: stockRecommendations,
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
          analysis_type: 'comprehensive_portfolio_strategy'
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
