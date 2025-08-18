import { useState, useEffect } from 'react';
import { usePortfolio } from './usePortfolio';
import { usePortfolioPerformance } from './usePortfolioPerformance';
import { useCashHoldings } from './useCashHoldings';
import { useUserHoldings } from './useUserHoldings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIInsight {
  title: string;
  message: string;
  type: 'performance' | 'allocation' | 'risk' | 'opportunity';
  confidence: number;
}

export const useAIInsights = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { activePortfolio } = usePortfolio();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();
  const { actualHoldings } = useUserHoldings();
  const { user } = useAuth();

  const generateInsights = async () => {
    if (!activePortfolio || !actualHoldings) return;
    
    setIsLoading(true);
    try {
      // Prepare portfolio context for AI analysis (robust against loading states)
      const holdingsTotal = (actualHoldings || []).reduce((sum: number, h: any) => sum + (h.current_value || 0), 0);
      const derivedTotal = performance.totalPortfolioValue > 0
        ? performance.totalPortfolioValue
        : holdingsTotal + (totalCash || 0);
      const safeTotal = derivedTotal > 0 ? derivedTotal : 0;
      const cashRatio = safeTotal > 0 ? Math.min(1, Math.max(0, (totalCash || 0) / safeTotal)) : 0;

      const portfolioContext = {
        totalValue: safeTotal,
        cashRatio,
        holdingsCount: (actualHoldings || []).length,
        performance: {
          totalReturn: performance.totalReturn,
          totalReturnPercentage: performance.totalReturnPercentage,
          dayChange: performance.dayChange,
          dayChangePercentage: performance.dayChangePercentage
        },
        diversification: calculateDiversification(actualHoldings || []),
        topHoldings: (actualHoldings || []).slice(0, 5).map((h: any) => ({
          symbol: h.symbol,
          percentage: safeTotal > 0 ? (h.current_value / safeTotal) * 100 : 0
        }))
      };

      const { data, error } = await supabase.functions.invoke('portfolio-ai-chat', {
        body: {
          message: `Analysera denna portfölj och ge 2-3 korta, actionable insikter på svenska. Fokusera på konkreta förbättringar och möjligheter. Portföljdata: ${JSON.stringify(portfolioContext)}`,
          analysisType: 'portfolio_insights',
          portfolioContext,
          userId: user?.id,
          portfolioId: activePortfolio?.id
        }
      });

      if (error) throw error;

      // Parse AI response into structured insights
      const aiResponse = data.response;
      const parsedInsights = parseAIResponse(aiResponse);
      
      setInsights(parsedInsights);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Fallback to static insights based on data
      setInsights(generateFallbackInsights());
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDiversification = (holdings: any[]) => {
    if (!holdings.length) return 0;
    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const weights = holdings.map(h => h.current_value / totalValue);
    const herfindahl = weights.reduce((sum, w) => sum + w * w, 0);
    return 1 - herfindahl; // Higher = more diversified
  };

  const parseAIResponse = (response: string): AIInsight[] => {
    const insights: AIInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentInsight: Partial<AIInsight> = {};
    
    for (const line of lines) {
      if (line.includes('Insikt:') || line.includes('Rekommendation:') || line.includes('•')) {
        if (currentInsight.message) {
          insights.push({
            title: currentInsight.title || 'AI-insikt',
            message: currentInsight.message,
            type: 'opportunity',
            confidence: 0.85
          });
        }
        currentInsight = {
          title: 'AI-insikt',
          message: line.replace(/^[•-]\s*/, '').replace(/Insikt:\s*/, '').replace(/Rekommendation:\s*/, '')
        };
      } else if (currentInsight.message && line.trim()) {
        currentInsight.message += ' ' + line.trim();
      }
    }
    
    if (currentInsight.message) {
      insights.push({
        title: currentInsight.title || 'AI-insikt',
        message: currentInsight.message,
        type: 'opportunity',
        confidence: 0.85
      });
    }

    return insights.slice(0, 3); // Max 3 insights
  };

  const generateFallbackInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    
    // Cash ratio insight
    const holdingsTotalFallback = (actualHoldings || []).reduce((sum: number, h: any) => sum + (h.current_value || 0), 0);
    const derivedTotalFallback = performance.totalPortfolioValue > 0
      ? performance.totalPortfolioValue
      : holdingsTotalFallback + (totalCash || 0);
    const cashRatio = derivedTotalFallback > 0 ? Math.min(1, Math.max(0, (totalCash || 0) / derivedTotalFallback)) : 0;
    if (cashRatio > 0.2) {
      insights.push({
        title: 'Kontantbalans',
        message: `Du har ${(cashRatio * 100).toFixed(0)}% kontanter. Överväg att investera en del för bättre avkastning.`,
        type: 'allocation',
        confidence: 0.9
      });
    }

    // Diversification insight
    if (actualHoldings && actualHoldings.length < 5) {
      insights.push({
        title: 'Diversifiering',
        message: 'Din portfölj skulle gynnas av fler innehav för bättre riskspridning.',
        type: 'risk',
        confidence: 0.85
      });
    }

    // Performance insight
    if (performance.totalReturnPercentage > 5) {
      insights.push({
        title: 'Stark utveckling',
        message: `Din portfölj har utvecklats bra med +${performance.totalReturnPercentage.toFixed(1)}% avkastning.`,
        type: 'performance',
        confidence: 0.8
      });
    }

    return insights.slice(0, 3);
  };

  // Auto-generate insights when portfolio data changes
  useEffect(() => {
    if (activePortfolio && actualHoldings && !lastUpdated) {
      generateInsights();
    }
  }, [activePortfolio, actualHoldings]);

  // Refresh insights every 30 minutes
  useEffect(() => {
    if (!lastUpdated) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
      if (diffMinutes > 30) {
        generateInsights();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return {
    insights,
    isLoading,
    lastUpdated,
    refreshInsights: generateInsights
  };
};