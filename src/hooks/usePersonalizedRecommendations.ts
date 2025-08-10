
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useRiskProfile } from '@/hooks/useRiskProfile';

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
  const { activePortfolio } = usePortfolio(); // Fixed: changed from portfolioData to activePortfolio
  const { stockCases } = useStockCases();
  const { data: analyses } = useAnalyses(20);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { riskProfile } = useRiskProfile();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    generateRecommendations();
  }, [user, activePortfolio, riskProfile, stockCases, analyses]);

  const generateRecommendations = () => {
    const recs: PersonalizedRecommendation[] = [];

    const portfolioSectors: string[] = activePortfolio?.asset_allocation
      ? Object.keys(activePortfolio.asset_allocation || {})
      : [];

    const prefSectors = (riskProfile?.sector_interests || []).map((s) => String(s).toLowerCase());
    const stylePref = riskProfile?.investment_style_preference
      ? String(riskProfile.investment_style_preference).toLowerCase()
      : null;
    const riskLevel = typeof riskProfile?.risk_comfort_level === 'number'
      ? (riskProfile!.risk_comfort_level as number)
      : null;

    const inferStyle = (sc: any): string => {
      const dy = parseFloat(sc?.dividend_yield ?? '');
      const pe = parseFloat(sc?.pe_ratio ?? '');
      if (!Number.isNaN(dy) && dy >= 3) return 'income';
      if (!Number.isNaN(pe) && pe <= 15) return 'value';
      return 'quality';
    };

    const riskScoreForCase = (sc: any): number => {
      let r = 4; // baseline 1-7
      const pe = parseFloat(sc?.pe_ratio ?? '');
      const dy = parseFloat(sc?.dividend_yield ?? '');
      if (!Number.isNaN(pe)) {
        if (pe > 30) r += 2;
        else if (pe < 15) r -= 1;
      }
      if (!Number.isNaN(dy) && dy >= 4) r -= 1;
      return Math.max(1, Math.min(7, r));
    };

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    (stockCases || []).forEach((sc: any) => {
      if (sc?.status !== 'active' || sc?.is_public === false) return;

      const sector = String(sc?.sector || '').toLowerCase();
      const sectorMatch = prefSectors.length ? (prefSectors.includes(sector) ? 1 : 0) : 0.5;

      const inferredStyle = inferStyle(sc);
      const styleMatch = stylePref ? (inferredStyle === stylePref ? 1 : 0) : 0.5;

      let riskFit = 0.5;
      if (riskLevel !== null) {
        const caseRisk = riskScoreForCase(sc);
        riskFit = 1 - Math.min(Math.abs((riskLevel as number) - caseRisk) / 6, 1);
      }

      const diversification = portfolioSectors.length
        ? (portfolioSectors.includes(sc?.sector || '') ? 0.2 : 1)
        : 0.7;

      const score = clamp01(0.35 * sectorMatch + 0.2 * styleMatch + 0.25 * riskFit + 0.2 * diversification);

      const reasons: string[] = [];
      if (sectorMatch >= 0.9 && sc?.sector) reasons.push(`Matchar din sektorpreferens (${sc.sector})`);
      if (diversification >= 0.9 && sc?.sector) reasons.push(`Ökar diversifiering (saknas ${sc.sector})`);
      if (stylePref && inferredStyle === stylePref) reasons.push(`Passar din stil (${stylePref})`);
      if (riskLevel !== null) reasons.push(`Passar din risknivå (${Math.round(riskFit * 100)}% träff)`);

      recs.push({
        id: `sc_${sc.id}`,
        type: 'stock_case',
        item: sc,
        reason: reasons.slice(0, 2).join(' · ') || 'Relevant möjlighet',
        category: sectorMatch >= 0.9
          ? 'sector_match'
          : diversification >= 0.9
          ? 'portfolio_complement'
          : 'risk_match',
        confidence: Number(score.toFixed(2)),
      });
    });

    // Trending fallback to ensure some recommendations
    if (recs.length < 6) {
      const trending = (stockCases || [])
        .filter((c: any) => c.status === 'active')
        .slice(0, Math.max(0, 6 - recs.length));
      trending.forEach((sc: any) => {
        recs.push({
          id: `trending_${sc.id}`,
          type: 'stock_case',
          item: sc,
          reason: 'Populärt bland andra investerare',
          category: 'trending',
          confidence: 0.6,
        });
      });
    }

    // Analysrekommendationer (behåll som tidigare)
    if (analyses) {
      analyses.slice(0, 3).forEach((analysis: any) => {
        recs.push({
          id: `analysis_${analysis.id}`,
          type: 'analysis',
          item: analysis,
          reason: 'Relevant marknadsanalys',
          category: 'trending',
          confidence: 0.7,
        });
      });
    }

    const sortedRecs = recs.sort((a, b) => b.confidence - a.confidence).slice(0, 12);
    setRecommendations(sortedRecs);
    setLoading(false);
  };
  return {
    recommendations,
    loading,
    refetch: generateRecommendations
  };
};
