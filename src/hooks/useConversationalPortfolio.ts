
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
      const prompt = buildAIPrompt(conversationData);
      
      console.log('Generated AI prompt:', prompt);

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

      // Save risk profile to database
      await saveRiskProfile(conversationData);

      toast({
        title: "Portfölj skapad!",
        description: "Din personliga portföljstrategi har genererats baserat på vårt samtal.",
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

  const buildAIPrompt = (data: ConversationData): string => {
    let prompt = `Skapa en detaljerad portföljstrategi baserat på följande information från en personlig konsultation:

ANVÄNDARINFO:
- Erfarenhetsnivå: ${data.isBeginnerInvestor ? 'Nybörjare' : 'Erfaren investerare'}
- Ålder: ${data.age || 'Ej specificerad'}
- Månatligt investeringsbelopp: ${data.monthlyAmount || 'Ej specificerat'} SEK

`;

    if (data.isBeginnerInvestor) {
      prompt += `NYBÖRJARE PROFIL:
- Investeringsmål: ${data.investmentGoal}
- Tidshorisont: ${data.timeHorizon}
- Risktolerans: ${data.riskTolerance}

`;
    } else {
      prompt += `ERFAREN INVESTERARE PROFIL:
- Befintlig portfölj: ${data.hasCurrentPortfolio ? 'Ja' : 'Nej'}
`;

      if (data.currentHoldings && data.currentHoldings.length > 0) {
        prompt += `- Nuvarande innehav: ${data.currentHoldings.map(h => `${h.name} (${h.percentage}%)`).join(', ')}
`;
      }

      if (data.sectors && data.sectors.length > 0) {
        prompt += `- Önskade sektorer: ${data.sectors.join(', ')}
`;
      }
    }

    prompt += `
UPPDRAG:
1. Analysera användarens profil och behov
2. Rekommendera en konkret portföljfördelning med specifika procentsatser
3. Förklara varför denna fördelning passar användarens situation
4. Ge konkreta tips för implementation
5. Inkludera riskanalys och förväntad avkastning
6. Föreslå specifika ETF:er eller fonder som passar strategin

Ge en välstrukturerad och actionable portföljstrategi på svenska som är lätt att förstå och implementera.`;

    return prompt;
  };

  const saveRiskProfile = async (data: ConversationData) => {
    if (!user) return;

    // Convert conversation data to risk profile format
    const riskProfile = {
      age: data.age ? parseInt(data.age) : null,
      monthly_investment_amount: data.monthlyAmount ? parseFloat(data.monthlyAmount.replace(/[^\d]/g, '')) : null,
      investment_horizon: mapTimeHorizon(data.timeHorizon),
      investment_goal: mapInvestmentGoal(data.investmentGoal),
      risk_tolerance: mapRiskTolerance(data.riskTolerance),
      investment_experience: data.isBeginnerInvestor ? 'beginner' : 'intermediate',
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
      portfolio_change_frequency: null,
      activity_preference: null,
      investment_style_preference: null,
      overexposure_awareness: null,
      preferred_stock_count: null,
      annual_income: null,
      current_portfolio_value: null
    };

    const { error } = await supabase
      .from('user_risk_profiles')
      .insert([{ ...riskProfile, user_id: user.id }]);

    if (error) {
      console.error('Error saving risk profile:', error);
    }
  };

  // Helper functions to map conversation answers to database values
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

  return {
    generatePortfolioFromConversation,
    loading
  };
};
