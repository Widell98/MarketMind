import React from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import HoldingsHighlightCard from './HoldingsHighlightCard';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';

const BestWorstHoldings: React.FC = () => {
  const { holdingsPerformance } = usePortfolioPerformance();

  // Hjälpfunktion för att avgöra om marknaden är öppen
  const isMarketOpen = (currency: string) => {
    const now = new Date();
    const day = now.getDay(); // 0 = Söndag, 6 = Lördag
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Helg = stängt
    if (day === 0 || day === 6) return false;

    // Normalisera valuta
    const curr = currency?.toUpperCase();

    // SEK (Sverige) öppnar 09:00
    if (curr === 'SEK' || curr === 'SE') {
      return hours >= 9;
    }

    // USD (USA) öppnar 15:30 svensk tid
    if (curr === 'USD' || curr === 'US') {
      return hours > 15 || (hours === 15 && minutes >= 30);
    }

    // För andra valutor, anta öppet för säkerhets skull (eller sätt striktare regler)
    return true;
  };

  const topHoldings = React.useMemo(() => {
    if (!holdingsPerformance || holdingsPerformance.length === 0) return { best: [], worst: [], marketsClosed: false };

    // Filtrera fram endast innehav vars marknad är öppen
    const openHoldings = holdingsPerformance.filter(holding => isMarketOpen(holding.currency));
    
    // Om vi har innehav totalt, men inga är öppna -> Visa "Marknaden stängd"
    const marketsClosed = holdingsPerformance.length > 0 && openHoldings.length === 0;

    // VIKTIGT: Använd ALLTID dayChangePercentage för dagens vinnare/förlorare.
    // Vi ska INTE använda profitPercentage (total avkastning) här.
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

  // Om marknaderna är stängda, visa specialkort
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

  // Om inga förändringar finns (även om öppet), visa inget
  if (topHoldings.best.length === 0 && topHoldings.worst.length === 0) {
    return null;
  }

  const bestHoldingsItems = topHoldings.best.map((holding) => {
    // Här använder vi strikt dayChange
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
      isPositive: (change ?? 0) > 0, // För att styra färgen i kortet
    };
  });

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
