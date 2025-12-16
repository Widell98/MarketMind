import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Moon } from 'lucide-react';
import HoldingsHighlightCard from './HoldingsHighlightCard';
import { usePortfolioPerformance, type HoldingPerformance } from '@/hooks/usePortfolioPerformance';

// Robust hjälpfunktion för att kontrollera marknadens öppettider (Samma logik som i HoldingsTable)
const isMarketOpen = (holding: HoldingPerformance): boolean => {
  // Krypto och certifikat visas dygnet runt
  const type = holding.holdingType?.toLowerCase();
  if (type === 'crypto' || type === 'cryptocurrency' || type === 'certificate') {
    return true;
  }

  // Hämta valuta, fallback till SEK om det saknas
  const currency = holding.currency?.toUpperCase() || 'SEK';

  // Hämta aktuell tid i Stockholm
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find(p => p.type === 'hour')?.value;
  const minutePart = parts.find(p => p.type === 'minute')?.value;
  
  const hour = parseInt(hourPart || '0', 10);
  const minute = parseInt(minutePart || '0', 10);
  const currentMinutes = hour * 60 + minute;

  // Tider i minuter från midnatt
  const swedenOpen = 9 * 60;        // 09:00
  const usOpen = 15 * 60 + 30;      // 15:30
  const endOfDay = 23 * 60 + 59;    // 23:59

  // Logik baserat på valuta
  if (currency === 'USD') {
    // Amerikanska aktier: Visa mellan 15:30 och midnatt
    return currentMinutes >= usOpen && currentMinutes <= endOfDay;
  } else if (['SEK', 'EUR', 'DKK', 'NOK'].includes(currency)) {
    // Svenska/Europeiska aktier: Visa mellan 09:00 och midnatt
    return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
  }

  // För övriga valutor, anta svenska tider som standard
  return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
};

const BestWorstHoldings: React.FC = () => {
  const { holdingsPerformance } = usePortfolioPerformance();

  const topHoldings = useMemo(() => {
    if (!holdingsPerformance || holdingsPerformance.length === 0) return { best: [], worst: [] };

    // 1. Filtrera bort innehav där marknaden är stängd
    const openMarketHoldings = holdingsPerformance.filter(holding => isMarketOpen(holding));

    // 2. Använd dagens utveckling för sortering
    const getChange = (holding: HoldingPerformance) => holding.dayChangePercentage;

    const positiveHoldings = openMarketHoldings
      .filter((holding) => (getChange(holding) ?? 0) > 0)
      .sort((a, b) => (getChange(b) ?? 0) - (getChange(a) ?? 0));

    const negativeHoldings = openMarketHoldings
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
    return `${prefix}${Math.round(value).toLocaleString('sv-SE')} kr`;
  };

  const mapToItem = (holding: HoldingPerformance, isPositive: boolean) => ({
    id: holding.id,
    name: holding.name || holding.symbol || 'Innehav',
    symbol: holding.symbol,
    percentLabel: formatChangeLabel(holding.dayChangePercentage),
    valueLabel: formatChangeValue(holding.dayChange),
    isPositive
  });

  const bestHoldingsItems = topHoldings.best.map(h => mapToItem(h, true));
  const worstHoldingsItems = topHoldings.worst.map(h => mapToItem(h, false));

  // Om inga innehav matchar kriterierna (t.ex. marknaden stängd), visa placeholders
  if (topHoldings.best.length === 0 && topHoldings.worst.length === 0) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
        <HoldingsHighlightCard
          title="Dagens vinnare"
          icon={<Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconColorClass="text-muted-foreground"
          items={[]}
          emptyText="Marknaden är stängd"
        />
        <HoldingsHighlightCard
          title="Dagens förlorare"
          icon={<Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
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
        title="Dagens vinnare"
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-emerald-600"
        items={bestHoldingsItems}
        emptyText="Ingen data"
      />

      <HoldingsHighlightCard
        title="Dagens förlorare"
        icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconColorClass="text-red-600"
        items={worstHoldingsItems}
        emptyText="Ingen data"
      />
    </div>
  );
};

export default BestWorstHoldings;
