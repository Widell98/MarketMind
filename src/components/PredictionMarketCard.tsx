import React, { useState, useMemo, useEffect } from "react";
import { PredictionMarketCard } from "@/components/PredictionMarketCard";
import { PredictionMarketsTable } from "@/components/PredictionMarketsTable";
import { AllMarketsSearch } from "@/components/AllMarketsSearch";
import { SavedMarketsList } from "@/components/SavedMarketsList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, AlertCircle, LayoutGrid, Table as TableIcon, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client"; 
import { fetchPolymarketMarketDetail } from "@/hooks/usePolymarket";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { PolymarketMarketDetail } from "@/types/polymarket";

type ViewMode = 'cards' | 'table';
type SortBy = 'volume' | 'endDate' | 'question' | 'odds' | 'liquidity';
type SortOrder = 'asc' | 'desc';

const PredictionMarketsDemo = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'curated' | 'all' | 'saved'>('curated');
  
  // --- STATE FÖR UTVALDA MARKNADER ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('predictions-view-mode', 'cards');
  const [sortBy, setSortBy] = useState<SortBy>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // --- STATE FÖR "ALLA MARKNADER" (SÖK) ---
  const [allSearchQuery, setAllSearchQuery] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [allSortBy, setAllSortBy] = useState<SortBy>('volume');
  const [allSortOrder, setAllSortOrder] = useState<SortOrder>('desc');

  const ITEMS_PER_PAGE = 9;

  // 1. Hämta "Curated Markets" (godkända IDs) från Supabase
  const { data: curatedIds = [], isLoading: curatedLoading, error: curatedError } = useQuery({
    queryKey: ["curated-markets-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curated_markets")
        .select("market_id")
        .eq("is_active", true);

      if (error) throw error;
      return data.map((d) => d.market_id);
    },
  });

  // 2. Hämta detaljer för dessa specifika marknader från Polymarket
  const { data: markets = [], isLoading: marketsDetailsLoading } = useQuery({
    queryKey: ["polymarket-curated-details", curatedIds],
    enabled: curatedIds.length > 0,
    queryFn: async () => {
      const promises = curatedIds.map((id) => fetchPolymarketMarketDetail(id));
      const results = await Promise.all(promises);
      return results.filter((m): m is PolymarketMarketDetail => m !== null);
    },
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = curatedLoading || marketsDetailsLoading;
  const error = curatedError;

  const debouncedSearch = useMemo(() => searchQuery, [searchQuery]);

  const getTagsArray = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return [tags];
    return [];
  };

  // Filtrera och sortera de hämtade (redan utvalda) marknaderna
  const filteredMarkets = useMemo(() => {
    if (!markets.length) return [];
    
    const filtered = markets.filter((market) => {
      const matchesSearch = !debouncedSearch || 
        (market.question || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const tagsArray = getTagsArray(market.tags);
      const matchesTags = selectedTags.length === 0 ||
        tagsArray.some(tag => selectedTags.includes(String(tag)));

      return matchesSearch && matchesTags;
    });

    return filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortBy) {
        case 'volume':
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
          const aYesOutcome = a.outcomes.find(o => o.title.toLowerCase() === 'yes');
          const bYesOutcome = b.outcomes.find(o => o.title.toLowerCase() === 'yes');
          aValue = aYesOutcome ? (aYesOutcome.price || 0) : (a.outcomes[0]?.price || 0);
          bValue = bYesOutcome ? (bYesOutcome.price || 0) : (b.outcomes[0]?.price || 0);
          break;
        default:
          aValue = a.volume || a.volumeNum || 0;
          bValue = b.volume || b.volumeNum || 0;
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
  }, [markets, debouncedSearch, selectedTags, sortBy, sortOrder]);

  const clearAllFilters = () => {
    if (activeTab === 'curated') {
      setSearchQuery("");
      setSelectedTags([]);
    } else if (activeTab === 'all') {
      setAllSearchQuery("");
      setAllSortBy("volume");
      setAllSortOrder("desc");
    }
  };

  const activeFiltersCount = activeTab === 'curated' 
    ? (searchQuery.trim() !== "" ? 1 : 0) + selectedTags.length
    : (allSearchQuery.trim() !== "" ? 1 : 0) + (allSortBy !== 'volume' || allSortOrder !== 'desc' ? 1 : 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMarkets = viewMode === 'cards' 
    ? filteredMarkets.slice(startIndex, endIndex)
    : filteredMarkets;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, sortBy, sortOrder, viewMode]);

  const handlePageChange = (direction: 'prev' | 'next' | number) => {
    if (typeof direction === 'number') {
      setCurrentPage(direction);
    } else {
      setCurrentPage((prev) => {
        if (direction === 'prev') return Math.max(1, prev - 1);
        return Math.min(totalPages, prev + 1);
      });
    }
  };

  const handleTableSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marknadsprognoser</h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'all' 
                ? "Sök och utforska alla tillgängliga marknader." 
                : "Utvalda odds från världens största prediktionsmarknad."}
            </p>
          </div>
          
          {/* Search / Filter Bar - Show for both Curated and All tabs */}
          {(activeTab === 'curated' || activeTab === 'all') && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={activeTab === 'all' ? "Sök globalt..." : "Sök marknad..."}
                  className="pl-9" 
                  value={activeTab === 'all' ? allSearchQuery : searchQuery}
                  onChange={(e) => activeTab === 'all' ? setAllSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => activeTab === 'all' ? setShowAllFilters(!showAllFilters) : setShowFilters(!showFilters)}
                className={`relative ${((activeTab === 'all' && showAllFilters) || (activeTab === 'curated' && showFilters)) ? "bg-muted" : ""}`}
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              
              {/* View Mode Toggle - Only for Curated for now */}
              {activeTab === 'curated' && (
                <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 shadow-sm">
                  <Button
                    type="button"
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    aria-pressed={viewMode === 'cards'}
                    onClick={() => setViewMode('cards')}
                    className="px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    aria-pressed={viewMode === 'table'}
                    onClick={() => setViewMode('table')}
                    className="px-3"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'curated' | 'all' | 'saved')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curated">Utvalda marknader</TabsTrigger>
            <TabsTrigger value="all">Sök alla marknader</TabsTrigger>
            <TabsTrigger value="saved" disabled={!user}>
              Mina sparade
            </TabsTrigger>
          </TabsList>

          {/* Curated Markets Tab */}
          <TabsContent value="curated" className="mt-6 space-y-6">

            {/* Curated Filter Card */}
            {showFilters && (
              <Card className="p-4 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {activeFiltersCount} aktiv{activeFiltersCount !== 1 ? 'a' : ''} filter
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Rensa alla
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium whitespace-nowrap">Sortera efter:</span>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volym</SelectItem>
                        <SelectItem value="endDate">Slutdatum</SelectItem>
                        <SelectItem value="question">Fråga (A-Ö)</SelectItem>
                        <SelectItem value="odds">Odds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{sortBy === 'question' ? 'Ö-A' : 'Högst först'}</SelectItem>
                        <SelectItem value="asc">{sortBy === 'question' ? 'A-Ö' : 'Lägst först'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Markets Display */}
            {!isLoading && !error && (
              <>
                {filteredMarkets.length > 0 ? (
                  <>
                    {viewMode === 'cards' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
                        {paginatedMarkets.map((market) => (
                          <PredictionMarketCard key={market.id} market={market} />
                        ))}
                      </div>
                    ) : (
                      <PredictionMarketsTable 
                        markets={paginatedMarkets}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleTableSort}
                      />
                    )}
                    {/* Pagination for cards view */}
                    {totalPages > 1 && viewMode === 'cards' && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Visar {startIndex + 1}-{Math.min(endIndex, filteredMarkets.length)} av {filteredMarkets.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Föregående
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>
                            Nästa <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Inga marknader hittades.</p>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* All Markets Search Tab */}
          <TabsContent value="all" className="mt-6 space-y-6">
            
            {/* All Markets Filter Card - Precis samma design som Curated */}
            {showAllFilters && (
              <Card className="p-4 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 border-b">
                   <span className="text-sm text-muted-foreground">
                      {activeFiltersCount} aktiv{activeFiltersCount !== 1 ? 'a' : ''} filter
                   </span>
                   <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" /> Rensa alla
                   </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium whitespace-nowrap">Sortera efter:</span>
                    <Select value={allSortBy} onValueChange={(value) => setAllSortBy(value as SortBy)}>
                      <SelectTrigger className="w-[180px]">
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
                    <Select value={allSortOrder} onValueChange={(value) => setAllSortOrder(value as SortOrder)}>
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
              </Card>
            )}

            {/* Skicka ner state som props */}
            <AllMarketsSearch 
              searchQuery={allSearchQuery} 
              sortBy={allSortBy}
              sortOrder={allSortOrder}
            />
          </TabsContent>

          {/* Saved Markets Tab */}
          <TabsContent value="saved" className="mt-6">
            <SavedMarketsList />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PredictionMarketsDemo;
