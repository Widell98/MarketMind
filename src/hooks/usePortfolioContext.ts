
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';

export interface PortfolioContext {
  totalValue: number;
  totalCash: number;
  totalPortfolioValue: number;
  cashPercentage: number;
  investedPercentage: number;
  sectorExposure: Array<{
    sector: string;
    value: number;
    percentage: number;
    holdingsCount: number;
  }>;
  liquidityAnalysis: {
    cashRatio: number;
    liquidityLevel: 'low' | 'moderate' | 'high';
    recommendedCashLevel: number;
  };
  holdings: Array<{
    name: string;
    symbol?: string;
    sector?: string;
    value: number;
    percentage: number;
    type: 'security' | 'cash';
  }>;
  healthMetrics: {
    diversificationScore: number;
    riskScore: number;
    performanceScore: number;
  };
}

export const usePortfolioContext = () => {
  const { user } = useAuth();
  const { actualHoldings } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
  const { cashHoldings, totalCash } = useCashHoldings();
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && actualHoldings && cashHoldings) {
      calculatePortfolioContext();
    }
  }, [user, actualHoldings, cashHoldings, performance]);

  const calculatePortfolioContext = () => {
    try {
      setLoading(true);

      // Filter out AI recommendations for calculations
      const currentHoldings = actualHoldings.filter(holding => 
        holding.holding_type !== 'recommendation'
      );

      // Calculate sector exposure
      const sectorMap = new Map<string, { value: number; count: number }>();
      
      currentHoldings.forEach(holding => {
        const sector = holding.sector || 'Övriga';
        const value = holding.current_value || 0;
        
        if (sectorMap.has(sector)) {
          const existing = sectorMap.get(sector)!;
          sectorMap.set(sector, {
            value: existing.value + value,
            count: existing.count + 1
          });
        } else {
          sectorMap.set(sector, { value, count: 1 });
        }
      });

      const sectorExposure = Array.from(sectorMap.entries()).map(([sector, data]) => ({
        sector,
        value: data.value,
        percentage: performance.totalValue > 0 ? (data.value / performance.totalValue) * 100 : 0,
        holdingsCount: data.count
      })).sort((a, b) => b.value - a.value);

      // Calculate liquidity analysis
      const cashRatio = performance.totalPortfolioValue > 0 ? (totalCash / performance.totalPortfolioValue) * 100 : 0;
      let liquidityLevel: 'low' | 'moderate' | 'high' = 'moderate';
      
      if (cashRatio < 5) {
        liquidityLevel = 'low';
      } else if (cashRatio > 20) {
        liquidityLevel = 'high';
      }

      // Recommended cash level (typically 5-15% depending on risk profile)
      const recommendedCashLevel = Math.max(5, Math.min(15, performance.totalPortfolioValue * 0.1));

      // Calculate health metrics
      const totalHoldings = currentHoldings.length;
      const uniqueSectors = new Set(currentHoldings.filter(h => h.sector).map(h => h.sector)).size;
      
      const diversificationScore = Math.min(100, (uniqueSectors / Math.max(1, totalHoldings)) * 100 + 20);
      const riskScore = Math.max(20, 100 - (totalCash / Math.max(1, performance.totalPortfolioValue)) * 200);
      const performanceScore = 75; // Could be calculated based on actual performance

      // Prepare holdings data for AI context
      const securityHoldings = currentHoldings.map(holding => ({
        name: holding.name,
        symbol: holding.symbol,
        sector: holding.sector,
        value: holding.current_value || 0,
        percentage: performance.totalPortfolioValue > 0 ? ((holding.current_value || 0) / performance.totalPortfolioValue) * 100 : 0,
        type: 'security' as const
      }));

      const cashHoldingsData = cashHoldings.map(holding => ({
        name: holding.name,
        symbol: undefined,
        sector: 'Kassa',
        value: holding.current_value,
        percentage: performance.totalPortfolioValue > 0 ? (holding.current_value / performance.totalPortfolioValue) * 100 : 0,
        type: 'cash' as const
      }));

      const allHoldings = [...securityHoldings, ...cashHoldingsData]
        .sort((a, b) => b.value - a.value);

      setPortfolioContext({
        totalValue: performance.totalValue,
        totalCash,
        totalPortfolioValue: performance.totalPortfolioValue,
        cashPercentage: performance.cashPercentage,
        investedPercentage: performance.investedPercentage,
        sectorExposure,
        liquidityAnalysis: {
          cashRatio,
          liquidityLevel,
          recommendedCashLevel
        },
        holdings: allHoldings,
        healthMetrics: {
          diversificationScore: Math.round(diversificationScore),
          riskScore: Math.round(riskScore * 10) / 10,
          performanceScore: Math.round(performanceScore)
        }
      });

    } catch (error) {
      console.error('Error calculating portfolio context:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    portfolioContext,
    loading,
    refetch: calculatePortfolioContext
  };
};
