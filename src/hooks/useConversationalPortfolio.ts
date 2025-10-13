import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Array<{
    id: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    symbol?: string;
  }>;
  age?: number;
  experience?: string;
  sectors?: string[];
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
}

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

    console.log('Extracting recommendations from AI response:', aiResponse);

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

    console.log('Final extracted recommendations:', recommendations);
    return recommendations.slice(0, 10); // Limit to 10 recommendations
  };

  const buildEnhancedAIPrompt = (conversationData: ConversationData) => {
    let prompt = `Skapa en detaljerad och personlig portföljstrategi baserat på följande omfattande konsultation:

GRUNDLÄGGANDE PROFIL:
- Erfarenhetsnivå: ${conversationData.isBeginnerInvestor ? 'Nybörjare (första gången investera)' : 'Erfaren investerare (flera års erfarenhet)'}
- Ålder: ${conversationData.age || 'Ej angiven'}
- Månatligt investeringsbelopp: ${conversationData.monthlyAmount || 'Ej angiven'} SEK`;

    if (conversationData.annualIncome) {
      prompt += `
- Årsinkomst: ${conversationData.annualIncome} SEK`;
    }

    if (conversationData.monthlyIncome) {
      prompt += `
- Månadsinkomst: ${conversationData.monthlyIncome} SEK`;
    }

    if (conversationData.availableCapital) {
      prompt += `
- Tillgängligt kapital för investeringar: ${conversationData.availableCapital}`;
    }

    if (conversationData.liquidCapital) {
      prompt += `
- Likvida medel: ${conversationData.liquidCapital}`;
    }

    if (typeof conversationData.emergencyBufferMonths === 'number') {
      prompt += `
- Buffert (antal månader): ${conversationData.emergencyBufferMonths}`;
    }

    if (conversationData.emergencyFund) {
      prompt += `
- Buffertstatus: ${conversationData.emergencyFund}`;
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

    if (conversationData.currentPortfolioValue) {
      prompt += `
- Nuvarande portföljvärde: ${conversationData.currentPortfolioValue}`;
    }

    if (conversationData.isBeginnerInvestor === true) {
      prompt += `

NYBÖRJARE - UTFÖRLIG EKONOMISK PROFIL:`;
      
      prompt += `

PERSONLIGA INTRESSEN OCH PREFERENSER:`;
      
      if (conversationData.interests && conversationData.interests.length > 0) {
        prompt += `
- Personliga intressen: ${conversationData.interests.join(', ')}`;
      }
      
      if (conversationData.companies && conversationData.companies.length > 0) {
        prompt += `
- Företag de gillar: ${conversationData.companies.join(', ')}`;
      }
      
      if (conversationData.sustainabilityPreference) {
        prompt += `
- Hållbarhetspreferens: ${conversationData.sustainabilityPreference}`;
      }
      
      if (conversationData.geographicPreference) {
        prompt += `
- Geografisk preferens: ${conversationData.geographicPreference}`;
      }
      
      prompt += `

RISKBETEENDE OCH PSYKOLOGI:`;
      
      if (conversationData.marketCrashReaction) {
        prompt += `
- Reaktion på börskrasch: ${conversationData.marketCrashReaction}`;
      }
      
      if (conversationData.volatilityComfort) {
        prompt += `
- Komfort med volatilitet: ${conversationData.volatilityComfort}/10`;
      }
      
      prompt += `
- Investeringsmål: ${conversationData.investmentGoal || 'Ej angivet'}
- Tidshorisont: ${conversationData.timeHorizon || 'Ej angiven'}
- Risktolerans: ${conversationData.riskTolerance || 'Ej angiven'}
- Befintlig portfölj: ${conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}`;

      if (conversationData.portfolioHelp) {
        prompt += `
- Hjälp med portfölj: ${conversationData.portfolioHelp}`;
      }

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `
- Nuvarande innehav: ${conversationData.currentHoldings.map(h => 
          `${h.name} (${h.quantity} st à ${h.purchasePrice} SEK)`
        ).join(', ')}`;
      }

      prompt += `

UPPDRAG FÖR NYBÖRJARE:
1. Skapa en nybörjarvänlig portfölj som STARKT kopplar till användarens ekonomiska situation och intressen
2. Föreslå konkreta svenska och nordiska företag/fonder som matchar deras intressen och geografi
3. Ta STOR hänsyn till deras ekonomiska buffert och förpliktelser
4. Anpassa riskexponering baserat på deras psykologiska profil och reaktionsmönster
5. Förklara VARFÖR varje innehav passar deras specifika profil
6. Inkludera utbildande element om diversifiering
7. Ge enkla, actionable steg för att komma igång
8. Föreslå specifika svenska fonder och ETF:er som är lätta att köpa på Avanza/Nordnet
9. Förklara risker på ett förståeligt sätt kopplat till deras komfortnivå
10. Föreslå en detaljerad månadsplan baserad på deras inkomst och tillgängliga kapital

VIKTIGT: Använd EXAKT detta format för varje rekommendation och INKLUDERA ALLTID SYMBOLER:
1. **Företagsnamn (BÖRSSYMBOL)**: Beskrivning av varför denna investering passar din profil. Allokering: XX%
2. **Fondnamn (FONDKOD)**: Beskrivning av fonden och varför den passar. Allokering: XX%

EXEMPEL (ANPASSA MED ANVÄNDARSPECIFIKA DATA):
1. **Företag A (TICKER-A)**: Kort beskrivning kopplad till användarens profil. Allokering: 15%
2. **Fond B (FOND-B)**: Kort beskrivning kopplad till användarens mål. Allokering: 20%`;

    } else {
      prompt += `

ERFAREN INVESTERARE - AVANCERAD PROFIL:`;
      
      if (conversationData.marketExperience) {
        prompt += `
- Investeringserfarenhet: ${conversationData.marketExperience}`;
      }
      
      if (conversationData.currentAllocation) {
        prompt += `
- Nuvarande allokering: ${conversationData.currentAllocation}`;
      }
      
      if (conversationData.previousPerformance) {
        prompt += `
- Historisk prestanda vs marknad: ${conversationData.previousPerformance}`;
      }
      
      if (conversationData.sectorExposure && conversationData.sectorExposure.length > 0) {
        prompt += `
- Befintlig sektorexponering: ${conversationData.sectorExposure.join(', ')}`;
      }
      
      if (conversationData.investmentStyle) {
        prompt += `
- Investeringsstil: ${conversationData.investmentStyle}`;
      }
      
      if (conversationData.dividendYieldRequirement) {
        prompt += `
- Direktavkastningskrav: ${conversationData.dividendYieldRequirement}`;
      }
      
      if (conversationData.maxDrawdownTolerance) {
        prompt += `
- Max drawdown tolerans: ${conversationData.maxDrawdownTolerance}/10`;
      }
      
      if (conversationData.taxConsideration) {
        prompt += `
- Skatteoptimering: ${conversationData.taxConsideration}`;
      }
      
      if (conversationData.portfolioSize) {
        prompt += `
- Portföljstorlek: ${conversationData.portfolioSize}`;
      }
      
      if (conversationData.rebalancingFrequency) {
        prompt += `
- Rebalanseringsfrekvens: ${conversationData.rebalancingFrequency}`;
      }
      
      prompt += `
- Befintlig portfölj: ${conversationData.hasCurrentPortfolio ? 'Ja' : 'Nej'}`;

      if (conversationData.currentHoldings && conversationData.currentHoldings.length > 0) {
        prompt += `
- Nuvarande innehav: ${conversationData.currentHoldings.map(h => 
          `${h.name} (${h.quantity} st à ${h.purchasePrice} SEK)`
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
8. Föreslå rebalanceringsstrategier som matchar deras frekvens och stil
9. Ge konkreta exit-strategier och optimeringsregler
10. Inkludera avancerade metriker och uppföljning

VIKTIGT: Använd EXAKT detta format för varje rekommendation och INKLUDERA ALLTID SYMBOLER:
1. **Företagsnamn (BÖRSSYMBOL)**: Beskrivning av varför denna investering passar din profil. Allokering: XX%
2. **Fondnamn (FONDKOD)**: Beskrivning av fonden och varför den passar. Allokering: XX%

EXEMPEL (ANPASSA MED ANVÄNDARSPECIFIKA DATA):
1. **Företag A (TICKER-A)**: Kort beskrivning kopplad till användarens profil. Allokering: 15%
2. **Fond B (FOND-B)**: Kort beskrivning kopplad till användarens mål. Allokering: 20%`;
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
- Föredragen ombalanseringsfrekvens: ${conversationData.portfolioChangeFrequency || conversationData.rebalancingFrequency}`;
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
- Önskad svarslängd från rådgivaren: ${conversationData.preferredResponseLength}`;
      }

      if (conversationData.additionalNotes) {
        prompt += `
- Extra anteckningar: ${conversationData.additionalNotes}`;
      }
    }

    // Add common goals and specifications
    if (combinedGoalAmount) {
      prompt += `

SPECIFIKT MÅL:
- Målbeskrivning: ${combinedGoalAmount}`;
    }

    prompt += `

GEMENSAMMA KRAV FÖR BÅDA PROFILER:
- Alla rekommendationer ska vara tillgängliga på svenska marknaden (Avanza, Nordnet etc.)
- INKLUDERA ALLTID specifika symboler/ticker codes för alla aktier och fonder
- Ange konkreta procentsatser för allokering som summerar till 100%
- Förklara avgiftsstrukturer och kostnader
- Inkludera både kortsiktiga och långsiktiga strategier
- Ge detaljerad månadsvis action plan
- Diskutera när portföljen bör ses över nästa gång
- Ta hänsyn till användarens SPECIFIKA ekonomiska situation och psykologiska profil
- Anpassa komplexiteten till användarens erfarenhetsnivå
- Basera rekommendationerna HELT på användarens profil och intressen - INGA förutbestämda listor

KRITISKT VIKTIGT: 
- VARJE aktie och fond MÅSTE ha en symbol/ticker i parenteser
- Rekommendationerna ska vara unika för varje användare baserat på deras svar
- Använd din kunskap om svenska marknaden för att hitta de BÄSTA matcherna
- Föreslå ALDRIG samma portfölj till olika användare

**ANVÄND NUMRERADE LISTA FÖR INVESTERINGSREKOMMENDATIONER:**

**Investeringsrekommendationer:**

1. **Företagsnamn (SYMBOL)**: Detaljerad beskrivning. Allokering: XX%
2. **Fondnamn (FONDKOD)**: Detaljerad beskrivning. Allokering: XX%

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

  const generatePortfolioFromConversation = async (conversationData: ConversationData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Du måste vara inloggad för att generera en portfölj",
        variant: "destructive",
      });
      return null;
    }

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

      const enhancedPrompt = buildEnhancedAIPrompt(mergedConversationData);
      console.log('Generated enhanced AI prompt:', enhancedPrompt);

      // Create enhanced risk profile data with all new fields
      const combinedSectorInterests = Array.from(new Set([
        ...(mergedConversationData.sectors || []),
        ...(mergedConversationData.interests || []),
        ...(mergedConversationData.sectorExposure || []),
        ...(existingProfileData.sectors || []),
        mergedConversationData.sustainabilityPreference ? `Hållbarhetsfokus: ${mergedConversationData.sustainabilityPreference}` : null,
        mergedConversationData.geographicPreference ? `Geografisk inriktning: ${mergedConversationData.geographicPreference}` : null,
        mergedConversationData.dividendYieldRequirement ? `Utdelningskrav: ${mergedConversationData.dividendYieldRequirement}` : null,
      ].filter(Boolean)));

      const resolvedMonthlyInvestment = extractNumericValue(mergedConversationData.monthlyAmount);
      const resolvedLiquidCapital = extractNumericValue(mergedConversationData.liquidCapital || mergedConversationData.availableCapital);
      const resolvedTargetAmount = extractNumericValue(mergedConversationData.targetAmount || mergedConversationData.specificGoalAmount);
      const resolvedAnnualIncome = extractNumericValue(mergedConversationData.annualIncome);
      const resolvedMonthlyIncome = extractNumericValue(mergedConversationData.monthlyIncome);
      const resolvedCurrentPortfolioValue = extractNumericValue(mergedConversationData.currentPortfolioValue);

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

      const currentPortfolioValue = resolvedCurrentPortfolioValue !== null
        ? resolvedCurrentPortfolioValue
        : mergedConversationData.portfolioSize === 'small'
          ? 50000
          : mergedConversationData.portfolioSize === 'medium'
            ? 300000
            : mergedConversationData.portfolioSize === 'large'
              ? 750000
              : mergedConversationData.portfolioSize === 'very_large'
                ? 1500000
                : null;

      const currentAllocationValue = typeof mergedConversationData.currentAllocation === 'string'
        ? { self_reported: mergedConversationData.currentAllocation }
        : mergedConversationData.currentAllocation || {};

      const monthlyInvestmentAmount = resolvedMonthlyInvestment !== null ? resolvedMonthlyInvestment : 5000;
      const liquidCapitalValue = resolvedLiquidCapital !== null ? resolvedLiquidCapital : null;
      const targetAmountValue = resolvedTargetAmount !== null ? resolvedTargetAmount : null;

      const riskProfileData = {
        age: mergedConversationData.age ?? existingProfileData.age ?? 25,
        monthly_investment_amount: monthlyInvestmentAmount,
        investment_horizon: mergedConversationData.timeHorizon || null,
        investment_goal: mergedConversationData.investmentGoal || 'growth',
        risk_tolerance: mergedConversationData.riskTolerance || null,
        investment_experience: investmentExperienceLevel,
        sector_interests: combinedSectorInterests,
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

      // Generate AI response with enhanced risk profile using proper endpoint
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-portfolio', {
        body: {
          riskProfileId: riskProfile.id,
          userId: user.id,
          conversationPrompt: enhancedPrompt,
          conversationData: mergedConversationData
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

      console.log('Response from generate-portfolio:', aiResponse);
      console.log('AI Response received:', aiResponse.aiRecommendations || aiResponse.aiResponse || aiResponse.response);

      const structuredPlan = aiResponse.plan;

      // Extract AI response from multiple possible fields for compatibility
      const aiRecommendationText = structuredPlan
        ? JSON.stringify(structuredPlan)
        : aiResponse.aiRecommendations || aiResponse.aiResponse || aiResponse.response || '';

      console.log('Extracting recommendations from AI response:', aiRecommendationText?.substring(0, 100));

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
      console.log('Final extracted recommendations:', stockRecommendations);

      if (stockRecommendations.length === 0) {
        console.warn('No stock recommendations extracted, but continuing with portfolio creation');
        // Don't throw error, just show the AI response to user
      }

      // Save stock recommendations to user_holdings table
      if (stockRecommendations.length > 0) {
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
          console.log('Successfully saved stock recommendations to user_holdings');
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

      toast({
        title: "Framgång!",
        description: "Din personliga portföljstrategi har skapats med förbättrad riskanalys",
      });

      return {
        aiResponse: aiRecommendationText,
        plan: structuredPlan || null,
        portfolio: aiResponse.portfolio || portfolio,
        riskProfile,
        enhancedPrompt,
        stockRecommendations
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
