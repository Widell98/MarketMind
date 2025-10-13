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
  industryInterests?: string;
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
      const [, jsonPart] = aiResponse.split('---JSON---');
      if (jsonPart) {
        const parsed = JSON.parse(jsonPart.trim());
        const recs = Array.isArray(parsed) ? parsed : parsed.recommendations;
        if (Array.isArray(recs)) {
          recs.forEach((rec: any) => {
            if (rec && rec.name) {
              recommendations.push({
                name: rec.name,
                symbol: rec.ticker || rec.symbol,
                reasoning: rec.reason || rec.reasoning,
                allocation: rec.allocation,
                sector: rec.sector,
                isin: rec.isin
              });
            }
          });
          return recommendations.slice(0, 10);
        }
      }
    } catch (error) {
      console.warn('Failed to parse advisor JSON section:', error);
    }

    try {
      const parsed = JSON.parse(aiResponse);
      const recs = Array.isArray(parsed) ? parsed : parsed.recommendations;
      if (Array.isArray(recs)) {
        recs.forEach((rec: any) => {
          if (rec && rec.name) {
            recommendations.push({
              name: rec.name,
              symbol: rec.ticker || rec.symbol,
              reasoning: rec.reason || rec.reasoning,
              allocation: rec.allocation,
              sector: rec.sector,
              isin: rec.isin
            });
          }
        });
        return recommendations.slice(0, 10);
      }
    } catch (error) {
      console.warn('AI response not valid JSON, returning empty list');
    }

    return recommendations;
  };


  const buildEnhancedAIPrompt = (conversationData: ConversationData) => {
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
      const normalizedRiskTolerance = conversationData.riskTolerance === 'balanced'
        ? 'moderate'
        : conversationData.riskTolerance || null;

      const industryInterestList = conversationData.industryInterests
        ? conversationData.industryInterests
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        : [];

      const combinedSectorInterests = Array.from(
        new Set(
          [
            ...(Array.isArray(conversationData.interests) ? conversationData.interests : []),
            ...(Array.isArray(conversationData.sectorExposure) ? conversationData.sectorExposure : []),
            ...industryInterestList,
          ]
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0)
        )
      );

      const riskProfileData = {
        age: conversationData.age || 25,
        monthly_investment_amount: conversationData.monthlyAmount ?
          parseInt(conversationData.monthlyAmount.replace(/[^\d]/g, '')) || 5000 : 5000,
        investment_horizon: conversationData.timeHorizon || null,
        investment_goal: conversationData.investmentGoal || 'growth',
        risk_tolerance: normalizedRiskTolerance,
        investment_experience: conversationData.isBeginnerInvestor ? 'beginner' : 'advanced',
        sector_interests: combinedSectorInterests,
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

      // Generate AI response with enhanced risk profile using proper endpoint
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-portfolio', {
        body: {
          riskProfileId: riskProfile.id,
          userId: user.id
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

      // Extract AI response from multiple possible fields for compatibility
      const aiRecommendationText = aiResponse.aiRecommendations || aiResponse.aiResponse || aiResponse.response || '';
      
      console.log('Extracting recommendations from AI response:', aiRecommendationText?.substring(0, 100));

      // Extract stock recommendations from AI response
      const stockRecommendations = extractStockRecommendations(aiRecommendationText);
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

      // Create enhanced asset allocation with all conversation data and AI analysis
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: aiRecommendationText,
        ai_prompt_used: enhancedPrompt,
        stock_recommendations: stockRecommendations,
        risk_profile_summary: {
          experience_level: conversationData.isBeginnerInvestor ? 'beginner' : 'advanced',
          risk_comfort: conversationData.volatilityComfort || 5,
          risk_tolerance: normalizedRiskTolerance,
          geographic_preference: conversationData.geographicPreference,
          sustainability_focus: conversationData.sustainabilityPreference,
          investment_style: conversationData.investmentStyle,
          market_crash_behavior: conversationData.marketCrashReaction,
          industry_interests: combinedSectorInterests,
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
        aiResponse: aiRecommendationText,
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
