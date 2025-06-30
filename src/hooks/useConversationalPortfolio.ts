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
  // Enhanced fields
  monthlyIncome?: string;
  availableCapital?: string;
  emergencyFund?: string;
  financialObligations?: string[];
  sustainabilityPreference?: string;
  geographicPreference?: string;
  marketCrashReaction?: string;
  volatilityComfort?: number;
  marketExperience?: string;
  currentAllocation?: string;
  previousPerformance?: string;
  sectorExposure?: string[];
  investmentStyle?: string;
  dividendYieldRequirement?: string;
  maxDrawdownTolerance?: number;
  specificGoalAmount?: string;
  taxConsideration?: string;
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

NYBÖRJARE - UTFÖRLIG EKONOMISK PROFIL:`;
      
      if (conversationData.monthlyIncome) {
        prompt += `
- Månadsinkomst: ${conversationData.monthlyIncome}`;
      }
      
      if (conversationData.availableCapital) {
        prompt += `
- Tillgängligt kapital: ${conversationData.availableCapital}`;
      }
      
      if (conversationData.emergencyFund) {
        prompt += `
- Ekonomisk buffert: ${conversationData.emergencyFund}`;
      }
      
      if (conversationData.financialObligations && conversationData.financialObligations.length > 0) {
        prompt += `
- Ekonomiska förpliktelser: ${conversationData.financialObligations.join(', ')}`;
      }
      
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
10. Föreslå en detaljerad månadsplan baserad på deras inkomst och tillgängliga kapital`;

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
10. Inkludera avancerade metriker och uppföljning`;
    }

    // Add common goals and specifications
    if (conversationData.specificGoalAmount) {
      prompt += `

SPECIFIKT MÅL:
- Målbeskrivning: ${conversationData.specificGoalAmount}`;
    }

    prompt += `

GEMENSAMMA KRAV FÖR BÅDA PROFILER:
- Alla rekommendationer ska vara tillgängliga på svenska marknaden (Avanza, Nordnet etc.)
- Inkludera specifika ISIN-koder eller fondnamn när möjligt
- Ange konkreta procentsatser för allokering
- Förklara avgiftsstrukturer och kostnader
- Inkludera både kortsiktiga och långsiktiga strategier
- Ge detaljerad månadsvis action plan
- Diskutera när portföljen bör ses över nästa gång
- Ta hänsyn till användarens SPECIFIKA ekonomiska situation och psykologiska profil
- Anpassa komplexiteten till användarens erfarenhetsnivå

VIKTIGT: Skapa en MYCKET personlig och specifik strategi som verkligen skiljer sig åt baserat på användarens unika profil. Undvik generiska råd.

Ge en välstrukturerad, personlig och actionable portföljstrategi på svenska som är perfekt anpassad för användarens specifika situation, erfarenhetsnivå och psykologiska profil.`;

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
      const enhancedPrompt = buildEnhancedAIPrompt(conversationData);
      console.log('Generated enhanced AI prompt:', enhancedPrompt);
      
      // Create enhanced risk profile data with all new fields
      const riskProfileData = {
        age: conversationData.age || 25,
        monthly_investment_amount: conversationData.monthlyAmount ? 
          parseInt(conversationData.monthlyAmount.replace(/[^\d]/g, '')) || 5000 : 5000,
        investment_horizon: conversationData.timeHorizon || null,
        investment_goal: conversationData.investmentGoal || 'growth',
        risk_tolerance: conversationData.riskTolerance || null,
        investment_experience: conversationData.isBeginnerInvestor ? 'beginner' : 'advanced',
        sector_interests: conversationData.interests || [],
        current_holdings: conversationData.currentHoldings || [],
        current_allocation: {},
        housing_situation: null,
        has_loans: conversationData.financialObligations?.includes('mortgage') || conversationData.financialObligations?.includes('car_loan') || conversationData.financialObligations?.includes('student_loan') || false,
        loan_details: conversationData.financialObligations ? conversationData.financialObligations.join(', ') : null,
        has_children: conversationData.financialObligations?.includes('child_support') || false,
        liquid_capital: conversationData.availableCapital ? parseInt(conversationData.availableCapital.replace(/[^\d]/g, '')) || null : null,
        emergency_buffer_months: conversationData.emergencyFund === 'yes_full' ? 6 : conversationData.emergencyFund === 'yes_partial' ? 2 : 0,
        investment_purpose: [conversationData.investmentGoal || 'wealth_building'],
        target_amount: conversationData.specificGoalAmount ? parseInt(conversationData.specificGoalAmount.replace(/[^\d]/g, '')) || null : null,
        target_date: null,
        risk_comfort_level: conversationData.volatilityComfort || (conversationData.isBeginnerInvestor ? 3 : 5),
        panic_selling_history: conversationData.marketCrashReaction === 'sell_all' || conversationData.marketCrashReaction === 'sell_some',
        control_importance: 3,
        market_crash_reaction: conversationData.marketCrashReaction || null,
        portfolio_change_frequency: conversationData.rebalancingFrequency || null,
        activity_preference: conversationData.isBeginnerInvestor ? 'passive' : 'active',
        investment_style_preference: conversationData.investmentStyle || (conversationData.isBeginnerInvestor ? 'long_term' : 'balanced'),
        overexposure_awareness: conversationData.isBeginnerInvestor ? 'low' : 'high',
        preferred_stock_count: conversationData.isBeginnerInvestor ? 5 : 12,
        annual_income: conversationData.monthlyIncome ? parseInt(conversationData.monthlyIncome.replace(/[^\d]/g, '')) * 12 || null : null,
        current_portfolio_value: conversationData.portfolioSize === 'small' ? 50000 : 
                                conversationData.portfolioSize === 'medium' ? 300000 : 
                                conversationData.portfolioSize === 'large' ? 750000 : 
                                conversationData.portfolioSize === 'very_large' ? 1500000 : null,
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

      // Generate AI response with enhanced prompt
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: enhancedPrompt,
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

      // Create enhanced asset allocation with all conversation data and AI analysis
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: aiResponse.response,
        ai_prompt_used: enhancedPrompt,
        risk_profile_summary: {
          experience_level: conversationData.isBeginnerInvestor ? 'beginner' : 'advanced',
          risk_comfort: conversationData.volatilityComfort || 5,
          geographic_preference: conversationData.geographicPreference,
          sustainability_focus: conversationData.sustainabilityPreference,
          investment_style: conversationData.investmentStyle,
          market_crash_behavior: conversationData.marketCrashReaction
        },
        analysis_metadata: {
          created_at: new Date().toISOString(),
          prompt_length: enhancedPrompt.length,
          response_length: aiResponse.response?.length || 0,
          ai_model: 'gpt-4o',
          analysis_type: 'comprehensive_portfolio_strategy'
        }
      };

      // Create a portfolio in the database with the AI response
      const portfolioData = {
        user_id: user.id,
        risk_profile_id: riskProfile.id,
        portfolio_name: 'AI-Genererad Personlig Portfölj',
        asset_allocation: assetAllocation,
        recommended_stocks: [],
        total_value: 0,
        expected_return: conversationData.isBeginnerInvestor ? 0.08 : 0.10,
        risk_score: conversationData.volatilityComfort || (conversationData.isBeginnerInvestor ? 3 : 5),
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
        aiResponse: aiResponse.response,
        portfolio,
        riskProfile,
        enhancedPrompt
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
