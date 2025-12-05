import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import HoldingsHighlightCard from './HoldingsHighlightCard';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';

const BestWorstHoldings: React.FC = () => {
  const { holdingsPerformance, isMarketOpen } = usePortfolioPerformance();

  const topHoldings = React.useMemo(() => {
    if (!isMarketOpen || !holdingsPerformance || holdingsPerformance.length === 0) {
      return { best: [], worst: [] };
    }
    const getChange = (holding: (typeof holdingsPerformance)[number]) =>
      holding.hasPurchasePrice ? holding.profitPercentage : holding.dayChangePercentage;

    const positiveHoldings = holdingsPerformance
      .filter((holding) => (getChange(holding) ?? 0) > 0)
      .sort((a, b) => (getChange(b) ?? 0) - (getChange(a) ?? 0));

    const negativeHoldings = holdingsPerformance
      .filter((holding) => (getChange(holding) ?? 0) < 0)
      .sort((a, b) => (getChange(a) ?? 0) - (getChange(b) ?? 0));

    return {
      best: positiveHoldings.slice(0, 3),
      worst: negativeHoldings.slice(0, 3),
    };
  }, [holdingsPerformance, isMarketOpen]);

  const formatChangeLabel = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${(value).toFixed(2)}%`;
  };

  const formatChangeValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toLocaleString('sv-SE')} kr`;
  };

  const bestHoldingsItems = topHoldings.best.map((holding) => {
    const change = holding.hasPurchasePrice ? holding.profitPercentage : holding.dayChangePercentage;
    const changeValue = holding.hasPurchasePrice ? holding.profit : holding.dayChange;

    return {
      id: holding.id,
      name: holding.name || holding.symbol || 'Innehav',
      symbol: holding.symbol,
      percentLabel: formatChangeLabel(change),
      valueLabel: formatChangeValue(changeValue),
      isPositive: (change ?? 0) >= 0,
    };
  });

  const worstHoldingsItems = topHoldings.worst.map((holding) => {
    const change = holding.hasPurchasePrice ? holding.profitPercentage : holding.dayChangePercentage;
    const changeValue = holding.hasPurchasePrice ? holding.profit : holding.dayChange;

    return {
      id: holding.id,
      name: holding.name || holding.symbol || 'Innehav',
      symbol: holding.symbol,
      percentLabel: formatChangeLabel(change),
      valueLabel: formatChangeValue(changeValue),
      isPositive: (change ?? 0) > 0,
    };
  });

  const emptyText = isMarketOpen ? 'Ingen data' : 'Marknaden är stängd';

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
      <HoldingsHighlightCard
        title="Bästa innehav i portföljen"
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-emerald-600"
        items={bestHoldingsItems}
        emptyText={emptyText}
      />

      <HoldingsHighlightCard
        title="Sämsta innehav i portföljen"
        icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-red-600"
        items={worstHoldingsItems}
        emptyText={emptyText}
      />
    </div>
  );
};

export default BestWorstHoldings;


