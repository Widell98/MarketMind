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

    // Add common goals and specifications
    if (conversationData.specificGoalAmount) {
      prompt += `

SPECIFIKT MÅL:
- Målbeskrivning: ${conversationData.specificGoalAmount}`;
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

      const riskTolerance = conversationData.riskTolerance?.toLowerCase();
      const expectedReturn = riskTolerance === 'aggressive' ? 0.12 : riskTolerance === 'conservative' ? 0.05 : 0.08;
      const comfortScore = conversationData.volatilityComfort ?? (conversationData.isBeginnerInvestor ? 3 : 5);
      const baseRiskScore = riskTolerance === 'aggressive' ? 7 : riskTolerance === 'conservative' ? 3 : 5;
      const combinedRiskScore = Math.round((baseRiskScore + comfortScore) / 2);

      // Create enhanced asset allocation with all conversation data and AI analysis
      const assetAllocation = {
        conversation_data: JSON.parse(JSON.stringify(conversationData)),
        ai_strategy: structuredPlan || aiRecommendationText,
        ai_strategy_raw: aiRecommendationText,
        ai_prompt_used: enhancedPrompt,
        structured_plan: structuredPlan,
        stock_recommendations: stockRecommendations,
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
