import React, { useState, useEffect, useMemo } from 'react';
import { usePolymarketMarkets } from '@/hooks/usePolymarket';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import { PredictionMarketsTable } from "@/components/PredictionMarketsTable";
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ViewMode, SortBy, SortOrder } from '@/pages/PredictionMarketsDemo';

interface AllMarketsSearchProps {
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange?: (column: SortBy) => void;
}

export const AllMarketsSearch: React.FC<AllMarketsSearchProps> = ({
  searchQuery,
  viewMode,
  sortBy,
  sortOrder,
  onSortChange
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search query from props
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine API sort parameters
  // Polymarket API supports 'volume' and 'liquidity' sorting directly.
  // Other sorts like 'question' or 'odds' must be done client-side after fetch.
  const apiSortOrder = useMemo(() => {
    if (sortBy === 'volume') return 'volume24hr'; // API typically uses volume24hr
    if (sortBy === 'endDate') return 'endDate';
    // Default to volume for other client-side sorts to get relevant results
    return 'volume24hr';
  }, [sortBy]);

  // Fetch markets from Polymarket API
  const { data: markets = [], isLoading } = usePolymarketMarkets({
    limit: 50,
    order: apiSortOrder,
    ascending: sortOrder === 'asc',
    search: debouncedSearch || undefined,
    active: true,
    closed: false
  });

  // Client-side sorting for features not supported by API or to refine order
  const sortedMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    // Create a copy to sort
    return [...markets].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortBy) {
        case 'volume':
          // Already sorted by API mostly, but good to ensure
          aValue = a.volume || a.volumeNum || 0;
          bValue = b.volume || b.volumeNum || 0;
          break;
        case 'endDate':
          aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
          bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        case 'question':
          aValue = (a.question || '').toLowerCase();
          bValue = (b.question || '').toLowerCase();
          break;
        case 'odds':
          // Sort by YES price
          const aYes = a.outcomes.find(o => o.title.toLowerCase() === 'yes')?.price || a.outcomes[0]?.price || 0;
          const bYes = b.outcomes.find(o => o.title.toLowerCase() === 'yes')?.price || b.outcomes[0]?.price || 0;
          aValue = aYes;
          bValue = bYes;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
        return (aValue as number) < (bValue as number) ? -1 : (aValue as number) > (bValue as number) ? 1 : 0;
      } else {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        return (aValue as number) > (bValue as number) ? -1 : (aValue as number) < (bValue as number) ? 1 : 0;
      }
    });
  }, [markets, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Results */}
      {isLoading && markets.length === 0 ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : sortedMarkets.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {sortedMarkets.map((market) => (
                <PredictionMarketCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <PredictionMarketsTable 
              markets={sortedMarkets}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange || (() => {})}
            />
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch 
              ? `Inga marknader hittades för "${debouncedSearch}"`
              : "Börja söka för att hitta marknader"}
          </p>
          {debouncedSearch && (
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
              Prova att söka på engelska termer som "Bitcoin", "Fed", "Election", "Trump".
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
