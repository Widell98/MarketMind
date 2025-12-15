import React from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import HoldingsHighlightCard from './HoldingsHighlightCard';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';

const BestWorstHoldings: React.FC = () => {
  const { holdingsPerformance } = usePortfolioPerformance();

  // Helper function to determine if the market is open for a given currency
  const isMarketOpen = (currency: string) => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // On weekends, we might want to show Friday's close, but the user asked for "market closed" text.
    // However, specifically "before 09:00" on a weekday is the main issue.
    // Let's hide if it's weekday pre-market.
    const isWeekday = day >= 1 && day <= 5;

    if (!isWeekday) return false;

    // SEK (Sweden) opens at 09:00
    if (currency === 'SEK' || currency === 'SE') {
      return hours >= 9;
    }

    // USD (US) opens at 15:30 CET (Assuming user is in CET/CEST)
    if (currency === 'USD') {
      return hours > 15 || (hours === 15 && minutes >= 30);
    }

    // Default to open for other currencies to be safe
    return true;
  };

  const topHoldings = React.useMemo(() => {
    if (!holdingsPerformance || holdingsPerformance.length === 0) return { best: [], worst: [], marketsClosed: false };

    // Filter holdings based on market hours
    const openHoldings = holdingsPerformance.filter(holding => isMarketOpen(holding.currency));
    
    // If we have holdings but none are open, flag it
    const marketsClosed = holdingsPerformance.length > 0 && openHoldings.length === 0;

    // Use dayChangePercentage primarily for "Today's" winners/losers
    const getChange = (holding: (typeof holdingsPerformance)[number]) => holding.dayChangePercentage;

    const positiveHoldings = openHoldings
      .filter((holding) => (getChange(holding) ?? 0) > 0)
      .sort((a, b) => (getChange(b) ?? 0) - (getChange(a) ?? 0));

    const negativeHoldings = openHoldings
      .filter((holding) => (getChange(holding) ?? 0) < 0)
      .sort((a, b) => (getChange(a) ?? 0) - (getChange(b) ?? 0));

    return {
      best: positiveHoldings.slice(0, 3),
      worst: negativeHoldings.slice(0, 3),
      marketsClosed
    };
  }, [holdingsPerformance]);

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
    // Always show daily change for "Today's Winners"
    const change = holding.dayChangePercentage;
    const changeValue = holding.dayChange;

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
    const change = holding.dayChangePercentage;
    const changeValue = holding.dayChange;

    return {
      id: holding.id,
      name: holding.name || holding.symbol || 'Innehav',
      symbol: holding.symbol,
      percentLabel: formatChangeLabel(change),
      valueLabel: formatChangeValue(changeValue),
      isPositive: (change ?? 0) > 0,
    };
  });

  if (topHoldings.marketsClosed) {
     return (
      <div className="grid grid-cols-1 gap-4">
        <HoldingsHighlightCard
          title="Marknaden är stängd"
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconColorClass="text-muted-foreground"
          items={[]}
          emptyText="Marknaderna har inte öppnat ännu (SE: 09:00, US: 15:30)."
        />
      </div>
    );
  }

  if (topHoldings.best.length === 0 && topHoldings.worst.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
      {topHoldings.best.length > 0 && (
        <HoldingsHighlightCard
          title="Dagens vinnare"
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconColorClass="text-emerald-600"
          items={bestHoldingsItems}
          emptyText="Ingen data"
        />
      )}

      {topHoldings.worst.length > 0 && (
        <HoldingsHighlightCard
          title="Dagens förlorare"
          icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconColorClass="text-red-600"
          items={worstHoldingsItems}
          emptyText="Ingen data"
        />
      )}
    </div>
  );
};

export default BestWorstHoldings;
