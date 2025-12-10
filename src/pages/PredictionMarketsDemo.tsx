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

  // Swedish keywords for filtering
  const swedishKeywords = useMemo(() => [
    'sverige', 'sweden', 'svensk', 'swedish', 
    'riksbank', 'riksbanken', 'stockholm', 
    'omx', 'nasdaq omx', 'omxs30', 'omx stockholm',
    'svenska', 'svensk ekonomi', 'svensk politik',
    'svenska kronan', 'sek', 'svensk valuta',
    'svenska aktier', 'svenska börsen', 'stockholmsbörsen'
  ], []);

  // Fetch markets with sorting parameters to get TRENDING items
  const { data: markets = [], isLoading: marketsLoading, error: marketsError } = usePolymarketMarkets({
    limit: 200, // Öka för att få fler marknader att filtrera från
    active: true,
    closed: false,       // VIKTIGT: Visa inte gamla/stängda marknader
    order: "volume24hr", // VIKTIGT: Sortera på volym (trending)
    ascending: false,    // VIKTIGT: Högst volym först
    search: searchQuery || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  // Debug logging
  React.useEffect(() => {
    if (marketsError) {
      console.error('Markets error:', marketsError);
    }
    if (markets.length > 0) {
      console.log('Top trending market loaded:', markets[0].question, 'Volume:', markets[0].volume);
    }
  }, [markets, marketsError]);

  // Fetch available tags
  const { data: tags = [] } = usePolymarketTags();

  // Debounced search (simple implementation)
  const debouncedSearch = useMemo(() => {
    return searchQuery;
  }, [searchQuery]);

  // Helper function to ensure tags is always an array
  const getTagsArray = (tags: any): string[] => {
    if (Array.isArray(tags)) {
      return tags;
    }
    if (typeof tags === 'string') {
      return [tags];
    }
    return [];
  };

  // Filter markets - prioritize new Swedish markets when no search/filter is active
  const filteredMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    const now = new Date();
    
    // Filtrera bort gamla marknader (som slutade för mer än 7 dagar sedan)
    const recentMarkets = markets.filter(market => {
      // Om marknaden är stängd eller arkiverad, exkludera den
      if (market.closed || market.archived) return false;
      
      // Om marknaden har endDate, kolla att den inte är för gammal
      if (market.endDate) {
        const endDate = new Date(market.endDate);
        const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        // Visa marknader som slutar om minst 1 dag, eller som slutade inom senaste 7 dagarna
        if (daysUntilEnd < -7) return false; // För gamla marknader
      }
      
      return true;
    });
    
    // Om ingen sökning eller filter, prioritera nya svenska marknader
    if (!debouncedSearch && selectedTags.length === 0) {
      const swedishMarkets = recentMarkets.filter(market => {
        const questionLower = (market.question || '').toLowerCase();
        const tagsArray = getTagsArray(market.tags);
        const tagsLower = tagsArray.map(t => String(t).toLowerCase()).join(' ');
        const searchText = `${questionLower} ${tagsLower}`;
        return swedishKeywords.some(keyword => searchText.includes(keyword));
      });
      
      const otherMarkets = recentMarkets.filter(market => {
        const questionLower = (market.question || '').toLowerCase();
        const tagsArray = getTagsArray(market.tags);
        const tagsLower = tagsArray.map(t => String(t).toLowerCase()).join(' ');
        const searchText = `${questionLower} ${tagsLower}`;
        return !swedishKeywords.some(keyword => searchText.includes(keyword));
      });
      
      // Sortera svenska marknader efter volym (trending/aktiva) först
      swedishMarkets.sort((a, b) => {
        const volumeA = a.volumeNum || a.volume || 0;
        const volumeB = b.volumeNum || b.volume || 0;
        // Prioritera högre volym (mer aktiva marknader)
        return volumeB - volumeA;
      });
      
      // Sortera övriga marknader också efter volym
      otherMarkets.sort((a, b) => {
        const volumeA = a.volumeNum || a.volume || 0;
        const volumeB = b.volumeNum || b.volume || 0;
        return volumeB - volumeA;
      });
      
      return [...swedishMarkets, ...otherMarkets];
    } else {
      // Om användaren söker eller filtrerar, använd normal filtrering med recentMarkets
      return recentMarkets.filter((market) => {
        const matchesSearch = !debouncedSearch || 
          (market.question || '').toLowerCase().includes(debouncedSearch.toLowerCase());
        
        const tagsArray = getTagsArray(market.tags);
        const matchesTags = selectedTags.length === 0 ||
          tagsArray.some(tag => selectedTags.includes(String(tag)));

        return matchesSearch && matchesTags;
      }).sort((a, b) => {
        // Sortera även sökresultat efter volym
        const volumeA = a.volumeNum || a.volume || 0;
        const volumeB = b.volumeNum || b.volume || 0;
        return volumeB - volumeA;
      });
    }
  }, [markets, debouncedSearch, selectedTags, swedishKeywords]);

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
                    market={market} // Ändrat tillbaka här!
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