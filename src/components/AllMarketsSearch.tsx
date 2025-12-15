import React, { useState, useEffect, useMemo } from 'react';
import { usePolymarketMarkets } from '@/hooks/usePolymarket';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AllMarketsSearchProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const AllMarketsSearch: React.FC<AllMarketsSearchProps> = ({
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (onSearchChange) {
        onSearchChange(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  // Fetch markets from Polymarket API
  const { data: markets = [], isLoading } = usePolymarketMarkets({
    limit: 50,
    order: debouncedSearch ? undefined : 'volume24hr',
    ascending: false,
    search: debouncedSearch || undefined,
    active: true,
    closed: false
  });

  const handleSearchChange = (value: string) => {
    if (externalSearchQuery === undefined) {
      setInternalSearchQuery(value);
    } else if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Sök alla marknader på Polymarket (t.ex. 'Trump', 'Bitcoin', 'Election')..." 
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {isLoading && !debouncedSearch ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : markets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {markets.map((market) => (
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
              Prova att söka på engelska termer som "Bitcoin", "Fed", "Election", "Trump".
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

