import React, { useState, useEffect, useMemo } from 'react';
import { usePolymarketMarkets } from '@/hooks/usePolymarket';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Filter, ArrowUpDown, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AllMarketsSearchProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

type SortBy = 'volume' | 'liquidity' | 'endDate';
type SortOrder = 'asc' | 'desc';

export const AllMarketsSearch: React.FC<AllMarketsSearchProps> = ({
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
  // Note: search endpoints might ignore 'order' params on server side, so we might sort client side below too
  const { data: markets = [], isLoading } = usePolymarketMarkets({
    limit: 50,
    order: sortBy,
    ascending: sortOrder === 'asc',
    search: debouncedSearch || undefined,
    active: true,
    closed: false
  });

  // Client-side sorting/filtering to ensure consistent experience even if API search ignores sort params
  const sortedMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    // We create a copy to sort
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

  const handleSearchChange = (value: string) => {
    if (externalSearchQuery === undefined) {
      setInternalSearchQuery(value);
    } else if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const clearFilters = () => {
    setSortBy('volume');
    setSortOrder('desc');
    if (externalSearchQuery === undefined) {
        setInternalSearchQuery('');
    } else if (onSearchChange) {
        onSearchChange('');
    }
  };

  const hasActiveFilters = sortBy !== 'volume' || sortOrder !== 'desc';

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Sök alla marknader på Polymarket (t.ex. 'Trump', 'Bitcoin')..." 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters || hasActiveFilters ? "bg-muted" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <Card className="p-4 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium whitespace-nowrap">Sortera efter:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Volym</SelectItem>
                    <SelectItem value="liquidity">Likviditet</SelectItem>
                    <SelectItem value="endDate">Slutdatum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Högst först</SelectItem>
                    <SelectItem value="asc">Lägst först</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Återställ
              </Button>
            )}
          </div>
        </Card>
      )}

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
