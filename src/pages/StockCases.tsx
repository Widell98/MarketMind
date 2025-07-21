
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Activity, Bookmark, BarChart3, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import StockCasesFilters from '@/components/StockCasesFilters';
import StockCaseSkeletonCard from '@/components/StockCaseSkeletonCard';
import CommunityStats from '@/components/CommunityStats';
import AnalysisSection from '@/components/AnalysisSection';
import { Input } from '@/components/ui/input';

const StockCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const [contentType, setContentType] = useState<'stock-cases' | 'analyses' | 'both'>('both');
  
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(20);
  const { deleteStockCase } = useStockCaseOperations();
  
  const navigate = useNavigate();

  // Fetch real data for stats
  const { data: memberCount } = useQuery({
    queryKey: ['community-members-mobile'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: activeCases } = useQuery({
    queryKey: ['active-cases-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });

  const getDisplayData = () => {
    switch (viewMode) {
      case 'all':
        return { cases: allStockCases, loading: allLoading };
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followedStockCases, loading: followedLoading };
      default:
        return { cases: allStockCases, loading: allLoading };
    }
  };

  const { cases: displayCases, loading: isLoading } = getDisplayData();

  const {
    searchTerm,
    setSearchTerm,
    filteredAndSortedCases,
  } = useStockCasesFilters({ stockCases: displayCases });

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDeleteStockCase = async (id: string) => {
    try {
      await deleteStockCase(id);
    } catch (error) {
      // Error is already handled in the deleteStockCase function
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-muted/20">
          <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Aktier & Analyser
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Utforska aktiecases och investeringsanalyser från communityn
              </p>
            </div>

            {/* Loading Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <StockCaseSkeletonCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Aktier & Analyser
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Utforska aktiecases och investeringsanalyser från communityn
            </p>
          </div>

          {/* Content Type Filter */}
          <div className="flex justify-center">
            <div className="bg-card rounded-lg p-1 border shadow-sm">
              <div className="flex gap-1">
                <Button
                  variant={contentType === 'both' ? 'default' : 'ghost'}
                  onClick={() => setContentType('both')}
                  className="rounded-md px-6 py-2"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Allt innehåll
                </Button>
                <Button
                  variant={contentType === 'stock-cases' ? 'default' : 'ghost'}
                  onClick={() => setContentType('stock-cases')}
                  className="rounded-md px-6 py-2"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Aktiecases
                </Button>
                <Button
                  variant={contentType === 'analyses' ? 'default' : 'ghost'}
                  onClick={() => setContentType('analyses')}
                  className="rounded-md px-6 py-2"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyser
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="hidden lg:block">
            <CommunityStats />
          </div>
          
          {/* Mobile stats */}
          <div className="lg:hidden">
            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-center gap-8 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-medium">{activeCases || 0}</span>
                    <span>Aktiva cases</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {memberCount ? `${memberCount > 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount}` : '0'}
                    </span>
                    <span>Medlemmar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          {(contentType === 'stock-cases' || contentType === 'both') && (
            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Sök bland aktiecases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/80 border-muted-foreground/20"
                    />
                  </div>

                  {/* View Mode Filter */}
                  <div className="flex justify-center">
                    <div className="bg-muted/30 rounded-lg p-1">
                      <div className="flex gap-1">
                        <Button
                          variant={viewMode === 'all' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('all')}
                          size="sm"
                          className="rounded-md"
                        >
                          <Filter className="w-3 h-3 mr-2" />
                          Alla
                        </Button>
                        <Button
                          variant={viewMode === 'trending' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('trending')}
                          size="sm"
                          className="rounded-md"
                        >
                          <TrendingUp className="w-3 h-3 mr-2" />
                          Trending
                        </Button>
                        <Button
                          variant={viewMode === 'followed' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('followed')}
                          size="sm"
                          className="rounded-md"
                        >
                          <Bookmark className="w-3 h-3 mr-2" />
                          Följda
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {contentType === 'both' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Stock Cases Section */}
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">
                        Aktiecases ({filteredAndSortedCases.length})
                      </CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setContentType('stock-cases')}
                    >
                      Se alla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredAndSortedCases.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Inga cases hittades</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'Försök med andra sökord.' : 'Aktiecases kommer att visas här.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAndSortedCases.slice(0, 6).map((stockCase) => (
                        <StockCaseCard
                          key={stockCase.id}
                          stockCase={stockCase}
                          onViewDetails={handleViewStockCaseDetails}
                          onDelete={handleDeleteStockCase}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analyses Section */}
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Senaste Analyser</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setContentType('analyses')}
                    >
                      Se alla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnalysisSection limit={6} showHeader={false} />
                </CardContent>
              </Card>
            </div>
          ) : contentType === 'stock-cases' ? (
            <div className="space-y-6">
              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Visar {filteredAndSortedCases.length} av {displayCases.length} cases
                  {searchTerm && ` för "${searchTerm}"`}
                </p>
              </div>

              {filteredAndSortedCases.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="text-lg mb-2">
                      {searchTerm ? 'Inga cases hittades' : 'Inga aktiecases än'}
                    </CardTitle>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Försök med andra sökord eller rensa sökningen.'
                        : 'Aktiecases kommer att visas här när de läggs till.'
                      }
                    </p>
                    {searchTerm && (
                      <Button 
                        onClick={() => setSearchTerm('')}
                        variant="outline"
                      >
                        Rensa sökning
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedCases.map((stockCase) => (
                    <StockCaseCard
                      key={stockCase.id}
                      stockCase={stockCase}
                      onViewDetails={handleViewStockCaseDetails}
                      onDelete={handleDeleteStockCase}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Alla Analyser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnalysisSection limit={20} showHeader={false} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockCases;
