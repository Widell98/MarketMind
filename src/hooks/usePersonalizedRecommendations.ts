
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';

export type PersonalizedRecommendation = {
  id: string;
  type: 'stock_case' | 'analysis';
  item: any;
  reason: string;
  category: 'portfolio_complement' | 'sector_match' | 'risk_match' | 'trending';
  confidence: number;
};

export const usePersonalizedRecommendations = () => {
  const { user } = useAuth();
  const { portfolioData } = usePortfolio();
  const { stockCases } = useStockCases();
  const { data: analyses } = useAnalyses(20);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !portfolioData) {
      setLoading(false);
      return;
    }

    generateRecommendations();
  }, [user, portfolioData, stockCases, analyses]);

  const generateRecommendations = () => {
    const recs: PersonalizedRecommendation[] = [];

    // Portföljkomplement baserat på sektorer
    if (portfolioData?.holdings) {
      const userSectors = portfolioData.holdings.map(h => h.sector).filter(Boolean);
      const underrepresentedSectors = ['Technology', 'Healthcare', 'Renewable Energy', 'Finance']
        .filter(sector => !userSectors.includes(sector));

      stockCases.forEach(stockCase => {
        if (stockCase.sector && underrepresentedSectors.includes(stockCase.sector)) {
          recs.push({
            id: `complement_${stockCase.id}`,
            type: 'stock_case',
            item: stockCase,
            reason: `Kompletterar din portfölj inom ${stockCase.sector}`,
            category: 'portfolio_complement',
            confidence: 0.8
          });
        }
      });
    }

    // Sektormatchning
    if (portfolioData?.holdings) {
      const userSectors = portfolioData.holdings.map(h => h.sector).filter(Boolean);
      
      stockCases.forEach(stockCase => {
        if (stockCase.sector && userSectors.includes(stockCase.sector)) {
          recs.push({
            id: `sector_${stockCase.id}`,
            type: 'stock_case',
            item: stockCase,
            reason: `Passar din befintliga ${stockCase.sector} exponering`,
            category: 'sector_match',
            confidence: 0.7
          });
        }
      });
    }

    // Trending cases
    const trendingCases = stockCases
      .filter(c => c.status === 'active')
      .slice(0, 3);

    trendingCases.forEach(stockCase => {
      recs.push({
        id: `trending_${stockCase.id}`,
        type: 'stock_case',
        item: stockCase,
        reason: 'Populärt bland andra investerare',
        category: 'trending',
        confidence: 0.6
      });
    });

    // Analysrekommendationer
    if (analyses) {
      analyses.slice(0, 3).forEach(analysis => {
        recs.push({
          id: `analysis_${analysis.id}`,
          type: 'analysis',
          item: analysis,
          reason: 'Relevant marknadsanalys',
          category: 'trending',
          confidence: 0.7
        });
      });
    }

    // Sortera efter confidence och begränsa
    const sortedRecs = recs
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12);

    setRecommendations(sortedRecs);
    setLoading(false);
  };

  return {
    recommendations,
    loading,
    refetch: generateRecommendations
  };
};
