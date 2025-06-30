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
  age?: string;
  experience?: string;
  sectors?: string[];
  interests?: string[];
  companies?: string[];
  portfolioHelp?: string;
  portfolioSize?: string;
  rebalancingFrequency?: string;
}

export const useConversationalPortfolio = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const buildEnhancedAIPrompt = (conversationData: ConversationData) => {
    let prompt = `Skapa en detaljerad och personlig portföljstrategi baserat på följande omfattande konsultation:

GRUNDLÄGGANDE PROFIL:
- Erfarenhetsnivå: ${conversationData.isBeginnerInvestor ? 'Nybörjare (första gången investera)' : 'Erfaren investerare (flera års erfarenhet)'}
- Ålder: ${conversationData.age || 'Ej angiven'}
- Månatligt investeringsbelopp: ${conversationData.monthlyAmount || 'Ej angiven'} SEK`;

    if (conversationData.isBeginnerInvestor === true) {
      prompt += `

NYBÖRJARE - PERSONLIGA INTRESSEN OCH MÅL:`;
      
      if (conversationData.interests && conversationData.interests.length > 0) {
        prompt += `
- Personliga intressen: ${conversationData.interests.join(', ')}`;
      }
      
      if (conversationData.companies && conversationData.companies.length > 0) {
        prompt += `
- Intressanta företag: ${conversationData.companies.join(', ')}`;
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
      } else {
        prompt += `

- Nuvarande innehav: `;
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
8. Föreslå en enkel månadsplan för investering`;

    } else {
      prompt += `

ERFAREN INVESTERARE - AVANCERAD PROFIL:`;
      
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
      } else {
        prompt += `

- Nuvarande innehav: `;
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
8. Ge konkreta exit-strategier och rebalanseringsregler`;
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

  const generatePortfolioFromConversation = async (conversationData: ConversationData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Du måste vara inloggad för att generera en portfölj",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      console.log('Generated enhanced AI prompt:', buildEnhancedAIPrompt(conversationData));
      
      // First, save the risk profile to the database
      const riskProfileData = {
        age: conversationData.age === '18-25' ? 22 : 
             conversationData.age === '26-35' ? 30 :
             conversationData.age === '36-45' ? 40 :
             conversationData.age === '46-55' ? 50 : 60,
        monthly_investment_amount: conversationData.monthlyAmount ? 
          parseInt(conversationData.monthlyAmount.replace(/[^\d]/g, '')) || 5000 : 5000,
        investment_horizon: conversationData.timeHorizon || null,
        investment_goal: 'growth',
        risk_tolerance: conversationData.riskTolerance || null,
        investment_experience: conversationData.isBeginnerInvestor ? 'beginner' : 'advanced',
        sector_interests: conversationData.interests || [],
        current_holdings: conversationData.currentHoldings || [],
        current_allocation: {},
        housing_situation: null,
        has_loans: false,
        loan_details: null,
        has_children: false,
        liquid_capital: null,
        emergency_buffer_months: null,
        investment_purpose: [conversationData.investmentGoal || 'wealth_building'],
        target_amount: null,
        target_date: null,
        risk_comfort_level: conversationData.isBeginnerInvestor ? 2 : 4,
        panic_selling_history: false,
        control_importance: 3,
        market_crash_reaction: null,
        portfolio_change_frequency: conversationData.rebalancingFrequency || null,
        activity_preference: conversationData.isBeginnerInvestor ? 'passive' : 'active',
        investment_style_preference: conversationData.isBeginnerInvestor ? 'long_term' : 'balanced',
        overexposure_awareness: conversationData.isBeginnerInvestor ? 'low' : 'high',
        preferred_stock_count: conversationData.isBeginnerInvestor ? 5 : 12,
        annual_income: null,
        current_portfolio_value: null,
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

      // Generate AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: buildEnhancedAIPrompt(conversationData),
          userId: user.id,
          analysisType: 'portfolio_generation',
          conversationData
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

      // Create asset allocation compatible with Json type
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: aiResponse.response
      };

      // Create a portfolio in the database with the AI response
      const portfolioData = {
        user_id: user.id,
        risk_profile_id: riskProfile.id,
        portfolio_name: 'AI-Genererad Portfölj',
        asset_allocation: assetAllocation,
        recommended_stocks: [],
        total_value: 0,
        expected_return: 0.08,
        risk_score: conversationData.isBeginnerInvestor ? 3 : 5,
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
        description: "Din personliga portföljstrategi har skapats",
      });

      return {
        aiResponse: aiResponse.response,
        portfolio,
        riskProfile
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
