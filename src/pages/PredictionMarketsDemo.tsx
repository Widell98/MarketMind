import React, { useState, useMemo } from "react";
import { PredictionMarketCard } from "@/components/PredictionMarketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { usePolymarketMarkets, usePolymarketTags } from "@/hooks/usePolymarket";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";

const PredictionMarketsDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch markets with search and filter
  const { data: markets = [], isLoading: marketsLoading, error: marketsError } = usePolymarketMarkets({
    limit: 50,
    active: true,
    search: searchQuery || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  // Debug logging
  React.useEffect(() => {
    if (marketsError) {
      console.error('Markets error:', marketsError);
    }
    if (markets.length > 0) {
      console.log('Markets loaded:', markets.length, markets[0]);
    }
  }, [markets, marketsError]);

  // Fetch available tags
  const { data: tags = [] } = usePolymarketTags();

  // Debounced search (simple implementation)
  const debouncedSearch = useMemo(() => {
    return searchQuery;
  }, [searchQuery]);

  // Filter markets client-side if needed (API should handle it, but backup)
  const filteredMarkets = useMemo(() => {
    if (!debouncedSearch && selectedTags.length === 0) {
      return markets;
    }

    return markets.filter((market) => {
      const matchesSearch = !debouncedSearch || 
        market.question.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 ||
        (market.tags && market.tags.some(tag => selectedTags.includes(tag)));

      return matchesSearch && matchesTags;
    });
  }, [markets, debouncedSearch, selectedTags]);

  const toggleTag = (tagSlug: string) => {
    setSelectedTags(prev => 
      prev.includes(tagSlug) 
        ? prev.filter(t => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marknadsprognoser</h1>
            <p className="text-muted-foreground mt-1">
              Realtidsodds från världens största prediktionsmarknad.
            </p>
          </div>
          
          {/* Search / Filter Bar */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Sök marknad..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tags */}
        {showFilters && tags.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedTags.includes(tag.slug) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.slug)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Error State */}
        {marketsError && (
          <Card className="p-4 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p>Kunde inte ladda marknader. Försök igen senare.</p>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {marketsLoading && (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-48">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Markets Grid */}
        {!marketsLoading && !marketsError && (
          <>
            {filteredMarkets.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredMarkets.map((market) => (
                  <PredictionMarketCard
                    key={market.id}
                    market={market}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || selectedTags.length > 0
                    ? "Inga marknader matchade dina filter."
                    : "Inga marknader tillgängliga just nu."}
                </p>
                {(!searchQuery && selectedTags.length === 0) && (
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                    variant="outline"
                  >
                    Uppdatera
                  </Button>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default PredictionMarketsDemo;
