import React, { useState, useEffect, useMemo } from 'react';
import { usePolymarketMarkets } from '@/hooks/usePolymarket';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

type SortBy = 'volume' | 'liquidity' | 'endDate' | 'question' | 'odds';
type SortOrder = 'asc' | 'desc';

interface AllMarketsSearchProps {
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export const AllMarketsSearch: React.FC<AllMarketsSearchProps> = ({
  searchQuery,
  sortBy,
  sortOrder
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search input för att inte spamma API:et
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch markets from Polymarket API
  // Notera: API:et kanske ignorerar sortering vid fritextsökning, så vi sorterar även på klienten nedan
  const { data: markets = [], isLoading } = usePolymarketMarkets({
    limit: 50,
    order: sortBy,
    ascending: sortOrder === 'asc',
    search: debouncedSearch || undefined,
    active: true,
    closed: false
  });

  // Klient-sortering för att garantera att sorteringen slår igenom även vid sökning
  const sortedMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    return [...markets].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortBy) {
        case 'volume':
          aValue = a.volume || a.volumeNum || 0;
          bValue = b.volume || b.volumeNum || 0;
          break;
        case 'liquidity':
          aValue = a.liquidity || 0;
          bValue = b.liquidity || 0;
          break;
        case 'endDate':
          aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
          bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        default:
          aValue = a.volume || 0;
          bValue = b.volume || 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [markets, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Results */}
      {isLoading && !debouncedSearch ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : sortedMarkets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {sortedMarkets.map((market) => (
            <PredictionMarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch 
              ? `Inga marknader hittades för "${debouncedSearch}"`
              : "Börja söka för att hitta marknader"}
          </p>
          {debouncedSearch && (
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
              Prova att söka på engelska termer som "Bitcoin", "Fed", "Election".
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
