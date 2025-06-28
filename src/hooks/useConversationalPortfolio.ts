import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationData {
  isBeginnerInvestor?: boolean;
  investmentGoal?: string;
  timeHorizon?: string;
  riskTolerance?: string;
  monthlyAmount?: string;
  hasCurrentPortfolio?: boolean;
  currentHoldings?: Array<{ name: string; percentage: number }>;
  age?: string;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioSize?: string;
  rebalancingFrequency?: string;
  marketTiming?: string;
  complexStrategies?: string[];
  riskManagement?: string;
  globalExposure?: string;
  alternativeInvestments?: string[];
  portfolioHelp?: string;
}

export const useConversationalPortfolio = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generatePortfolioFromConversation = async (conversationData: ConversationData) => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa en portfölj",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      // Build AI prompt from conversation data
      const prompt = buildEnhancedAIPrompt(conversationData);
      
      console.log('Generated enhanced AI prompt:', prompt);

      // Call AI portfolio generation
      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: prompt,
          userId: user.id,
          analysisType: 'portfolio_generation',
          conversationData: conversationData
        }
      });

      if (error) {
        console.error('Portfolio generation error:', error);
        throw new Error(error.message || 'Kunde inte generera portfölj');
      }

      // Save enhanced risk profile to database
      await saveEnhancedRiskProfile(conversationData);

      toast({
        title: "Portfölj skapad!",
        description: conversationData.isBeginnerInvestor 
          ? "Din personliga portföljstrategi har skapats baserat på dina intressen och mål!"
          : "Din avancerade portföljstrategi har optimerats baserat på din erfarenhet!",
      });

      return {
        aiResponse: data.response,
        conversationData
      };

    } catch (error: any) {
      console.error('Error generating portfolio:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte generera portfölj. Försök igen senare.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buildEnhancedAIPrompt = (data: ConversationData): string => {
    let prompt = `Skapa en detaljerad och personlig portföljstrategi baserat på följande omfattande konsultation:

GRUNDLÄGGANDE PROFIL:
- Erfarenhetsnivå: ${data.isBeginnerInvestor ? 'Nybörjare (första gången investera)' : 'Erfaren investerare (flera års erfarenhet)'}
- Ålder: ${data.age || 'Ej specificerad'}
- Månatligt investeringsbelopp: ${data.monthlyAmount || 'Ej specificerat'} SEK

`;

    if (data.isBeginnerInvestor) {
      prompt += `NYBÖRJARE - PERSONLIGA INTRESSEN OCH MÅL:
- Personliga intressen: ${data.interests?.join(', ') || 'Ej specificerade'}
- Intressanta företag: ${data.companies?.join(', ') || 'Ej specificerade'}
- Investeringsmål: ${data.investmentGoal}
- Tidshorisont: ${data.timeHorizon}
- Risktolerans: ${data.riskTolerance}
- Befintlig portfölj: ${data.hasCurrentPortfolio ? 'Ja' : 'Nej'}

`;

      if (data.hasCurrentPortfolio && data.currentHoldings) {
        prompt += `- Nuvarande innehav: ${data.currentHoldings.map(h => `${h.name} (${h.percentage}%)`).join(', ')}
`;
      }

      if (!data.hasCurrentPortfolio && data.portfolioHelp) {
        prompt += `- Önskad approach för ny portfölj: ${data.portfolioHelp}
`;
      }

      prompt += `
UPPDRAG FÖR NYBÖRJARE:
1. Skapa en nybörjarvänlig portfölj som kopplar till användarens intressen
2. Föreslå konkreta och kända företag/fonder som matchar deras intressen
3. Förklara VARFÖR varje innehav passar deras profil
4. Inkludera utbildande element om varför diversifiering är viktigt
5. Ge enkla, actionable steg för att komma igång
6. Rekommendera specifika svenska/nordiska fonder och ETF:er som är lätta att köpa
7. Förklara risker på ett förståeligt sätt
8. Föreslå en enkel månadsplan för investering

`;
    } else {
      prompt += `ERFAREN INVESTERARE - AVANCERAD PROFIL:
- Portföljstorlek: ${data.portfolioSize || 'Ej specificerad'}
- Rebalanseringsfrekvens: ${data.rebalancingFrequency || 'Ej specificerad'}
- Market timing approach: ${data.marketTiming || 'Ej specificerad'}
- Erfarenhet av komplexa strategier: ${data.complexStrategies?.join(', ') || 'Inga'}
- Riskhantering: ${data.riskManagement || 'Ej specificerad'}
- Geografisk exponering: ${data.globalExposure || 'Ej specificerad'}
- Alternativa investeringar: ${data.alternativeInvestments?.join(', ') || 'Inga'}
- Befintlig portfölj: ${data.hasCurrentPortfolio ? 'Ja' : 'Nej'}

`;

      if (data.hasCurrentPortfolio && data.currentHoldings) {
        prompt += `- Nuvarande innehav: ${data.currentHoldings.map(h => `${h.name} (${h.percentage}%)`).join(', ')}
`;
      }

      prompt += `
UPPDRAG FÖR ERFAREN INVESTERARE:
1. Analysera den nuvarande strategin och identifiera optimeringsmöjligheter
2. Föreslå avancerade portföljtekniker baserat på deras erfarenhet
3. Inkludera sofistikerade allokeringsstrategier
4. Föreslå specifika instrument som passar deras riskprofil
5. Diskutera tax-loss harvesting och andra skatteoptimerings strategier
6. Analysera korrelationer och riskjusterad avkastning
7. Föreslå hedge-strategier om relevant
8. Inkludera alternativa tillgångsklasser om intresse finns
9. Ge konkreta exit-strategier och rebalanseringsregler

`;
    }

    prompt += `
KRAV FÖR BÅDA PROFILER:
- Alla rekommendationer ska vara tillgängliga på svenska marknaden (Avanza, Nordnet etc.)
- Inkludera specifika ISIN-koder eller fondnamn när möjligt
- Ange konkreta procentsatser för allokering
- Förklara avgiftsstrukturer och kostnader
- Inkludera både kortsiktiga och långsiktiga strategier
- Ge månadsvis action plan
- Diskutera när portföljen bör ses över nästa gång

Ge en välstrukturerad, personlig och actionable portföljstrategi på svenska som är perfekt anpassad för användarens specifika situation och erfarenhetsnivå.`;

    return prompt;
  };

  const saveEnhancedRiskProfile = async (data: ConversationData) => {
    if (!user) return;

    // Convert enhanced conversation data to risk profile format
    // Only include fields that exist in the user_risk_profiles table
    const riskProfile = {
      age: data.age ? parseInt(data.age) : null,
      monthly_investment_amount: data.monthlyAmount ? parseFloat(data.monthlyAmount.replace(/[^\d]/g, '')) : null,
      investment_horizon: mapTimeHorizon(data.timeHorizon),
      investment_goal: mapInvestmentGoal(data.investmentGoal),
      risk_tolerance: mapRiskTolerance(data.riskTolerance),
      investment_experience: data.isBeginnerInvestor ? 'beginner' : 'advanced',
      sector_interests: data.sectors || [],
      current_holdings: data.currentHoldings || [],
      current_allocation: {},
      
      // Required fields with defaults
      housing_situation: null,
      has_loans: false,
      loan_details: null,
      has_children: false,
      liquid_capital: null,
      emergency_buffer_months: null,
      investment_purpose: [data.investmentGoal || 'growth'],
      target_amount: null,
      target_date: null,
      risk_comfort_level: data.isBeginnerInvestor ? 2 : 4,
      panic_selling_history: false,
      control_importance: 3,
      market_crash_reaction: null,
      portfolio_change_frequency: data.rebalancingFrequency || null,
      activity_preference: data.isBeginnerInvestor ? 'passive' : 'active',
      investment_style_preference: data.isBeginnerInvestor ? 'long_term' : 'balanced',
      overexposure_awareness: data.isBeginnerInvestor ? 'low' : 'high',
      preferred_stock_count: data.isBeginnerInvestor ? 5 : 12,
      annual_income: null,
      current_portfolio_value: data.portfolioSize ? extractPortfolioValue(data.portfolioSize) : null
    };

    const { error } = await supabase
      .from('user_risk_profiles')
      .insert([{ ...riskProfile, user_id: user.id }]);

    if (error) {
      console.error('Error saving enhanced risk profile:', error);
    }
  };

  // Helper functions
  const mapTimeHorizon = (horizon?: string) => {
    if (!horizon) return null;
    if (horizon.includes('1-3')) return 'short';
    if (horizon.includes('3-7')) return 'medium';
    if (horizon.includes('7+')) return 'long';
    return null;
  };

  const mapInvestmentGoal = (goal?: string) => {
    if (!goal) return null;
    if (goal.includes('tillväxt')) return 'growth';
    if (goal.includes('inkomst')) return 'income';
    if (goal.includes('pension')) return 'growth';
    if (goal.includes('Bevara')) return 'preservation';
    return 'growth';
  };

  const mapRiskTolerance = (tolerance?: string) => {
    if (!tolerance) return null;
    if (tolerance.includes('Låg')) return 'conservative';
    if (tolerance.includes('Måttlig')) return 'moderate';
    if (tolerance.includes('Hög')) return 'aggressive';
    return null;
  };

  const extractPortfolioValue = (size?: string) => {
    if (!size) return null;
    if (size.includes('Under 100')) return 50000;
    if (size.includes('100 000 - 500')) return 300000;
    if (size.includes('500 000 - 1 miljon')) return 750000;
    if (size.includes('Över 1 miljon')) return 1500000;
    return null;
  };

  return {
    generatePortfolioFromConversation,
    loading
  };
};
