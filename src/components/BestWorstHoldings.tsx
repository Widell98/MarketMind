import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import HoldingsHighlightCard from './HoldingsHighlightCard';
import { usePortfolioPerformance, type HoldingPerformance } from '@/hooks/usePortfolioPerformance';

// Hjälpfunktion för att avgöra om ett innehav ska visas baserat på tid och valuta
const shouldShowHolding = (holding: HoldingPerformance): boolean => {
  // Krypto visas alltid (dygnet runt)
  if (holding.holdingType === 'crypto' || holding.holdingType === 'cryptocurrency' || holding.holdingType === 'certificate') {
    return true;
  }

  // Hämta aktuell tid i Stockholm
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  // Tider i minuter från midnatt
  const swedenOpen = 9 * 60;       // 09:00
  const usOpen = 15 * 60 + 30;     // 15:30
  const closeTime = 23 * 60 + 59;  // 23:59

  const currency = holding.currency?.toUpperCase() || 'SEK';

  if (currency === 'USD') {
    // Amerikanska marknaden (baserat på valuta)
    return currentMinutes >= usOpen && currentMinutes <= closeTime;
  } else if (['SEK', 'EUR', 'DKK', 'NOK'].includes(currency)) {
    // Svenska/Nordiska/Europeiska marknaden (baserat på valuta)
    return currentMinutes >= swedenOpen && currentMinutes <= closeTime;
  } else {
    // Fallback: Om valutan är okänd men vi har data, visa det.
    // Men för att vara säker, följ svensk tid som default
    return currentMinutes >= swedenOpen && currentMinutes <= closeTime;
  }
};

const BestWorstHoldings: React.FC = () => {
  const { holdingsPerformance } = usePortfolioPerformance();

  const topHoldings = useMemo(() => {
    if (!holdingsPerformance || holdingsPerformance.length === 0) return { best: [], worst: [] };

    // Filtrera först bort innehav där marknaden är stängd
    const activeHoldings = holdingsPerformance.filter(holding => shouldShowHolding(holding));

    // Använd dagens utveckling (dayChangePercentage)
    const getChange = (holding: (typeof holdingsPerformance)[number]) => holding.dayChangePercentage;

    const positiveHoldings = activeHoldings
      .filter((holding) => (getChange(holding) ?? 0) > 0)
      .sort((a, b) => (getChange(b) ?? 0) - (getChange(a) ?? 0));

    const negativeHoldings = activeHoldings
      .filter((holding) => (getChange(holding) ?? 0) < 0)
      .sort((a, b) => (getChange(a) ?? 0) - (getChange(b) ?? 0));

    return {
      best: positiveHoldings.slice(0, 3),
      worst: negativeHoldings.slice(0, 3),
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

  // Om inga innehav matchar kriterierna (t.ex. börsen stängd), visa placeholders
  if (topHoldings.best.length === 0 && topHoldings.worst.length === 0) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
        <HoldingsHighlightCard
            title="Dagens bästa"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconColorClass="text-muted-foreground"
            items={[]}
            emptyText="Marknaden är stängd"
        />
        <HoldingsHighlightCard
            title="Dagens sämsta"
            icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
            iconColorClass="text-muted-foreground"
            items={[]}
            emptyText="Marknaden är stängd"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
      <HoldingsHighlightCard
        title="Dagens bästa"
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-emerald-600"
        items={bestHoldingsItems}
        emptyText="Ingen data"
      />

      <HoldingsHighlightCard
        title="Dagens sämsta"
        icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-red-600"
        items={worstHoldingsItems}
        emptyText="Ingen data"
      />
    </div>
  );
};

export default BestWorstHoldings;
