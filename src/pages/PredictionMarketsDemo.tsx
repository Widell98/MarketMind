import React, { useState, useMemo } from "react";
import { PredictionMarketCard } from "@/components/PredictionMarketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, AlertCircle } from "lucide-react";
// Importera supabase client och fetch-funktionen för enstaka marknad
import { supabase } from "@/integrations/supabase/client"; 
import { usePolymarketTags, fetchPolymarketMarketDetail } from "@/hooks/usePolymarket";
import { useQuery } from "@tanstack/react-query"; // Behövs för att hämta curations
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import type { PolymarketMarketDetail } from "@/types/polymarket";

const PredictionMarketsDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // 1. Hämta "Curated Markets" (godkända IDs) från Supabase
  const { data: curatedIds = [], isLoading: curatedLoading, error: curatedError } = useQuery({
    queryKey: ["curated-markets-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curated_markets")
        .select("market_id")
        .eq("is_active", true); // Hämta bara aktiva

      if (error) throw error;
      return data.map((d) => d.market_id); // Returnera en array av strängar ["id1", "id2"]
    },
  });

  // 2. Hämta detaljer för dessa specifika marknader från Polymarket
  const { data: markets = [], isLoading: marketsDetailsLoading } = useQuery({
    queryKey: ["polymarket-curated-details", curatedIds],
    // Kör bara om vi har ID:n att hämta
    enabled: curatedIds.length > 0,
    queryFn: async () => {
      // Hämta varje marknad parallellt
      const promises = curatedIds.map((id) => fetchPolymarketMarketDetail(id));
      const results = await Promise.all(promises);
      
      // Filtrera bort eventuella null-värden (om API:et failar på en specifik)
      return results.filter((m): m is PolymarketMarketDetail => m !== null);
    },
    // Spara i cachen lite längre så vi inte spammar API:et
    staleTime: 1000 * 60 * 5, // 5 minuter
  });

  const isLoading = curatedLoading || marketsDetailsLoading;
  const error = curatedError;

  // Fetch available tags (för filter-knappar)
  const { data: tags = [] } = usePolymarketTags();

  // Debounced search (enkel variant)
  const debouncedSearch = useMemo(() => {
    return searchQuery;
  }, [searchQuery]);

  // Helper function to ensure tags is always an array
  const getTagsArray = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return [tags];
    return [];
  };

  // 3. Filtrera de hämtade (redan utvalda) marknaderna baserat på sökning/taggar
  const filteredMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    return markets.filter((market) => {
      const matchesSearch = !debouncedSearch || 
        (market.question || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const tagsArray = getTagsArray(market.tags);
      const matchesTags = selectedTags.length === 0 ||
        tagsArray.some(tag => selectedTags.includes(String(tag)));

      return matchesSearch && matchesTags;
    }).sort((a, b) => {
        // Sortera efter volym som default för snyggare listning
        return (b.volume || 0) - (a.volume || 0);
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
              Utvalda odds från världens största prediktionsmarknad.
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
        {error && (
          <Card className="p-4 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p>Kunde inte ladda marknader. Försök igen senare.</p>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
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
        {!isLoading && !error && (
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
                    : curatedIds.length === 0 
                        ? "Inga utvalda marknader att visa än." 
                        : "Inga marknader tillgängliga just nu."}
                </p>
                {curatedIds.length === 0 && (
                   <p className="text-xs text-muted-foreground mt-2">
                       (Tips: Gå till /admin/markets för att välja marknader)
                   </p>
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
