
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Activity, Clock, Filter, Bookmark, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import StockCaseListItem from '@/components/StockCaseListItem';
import StockCasesFilters from '@/components/StockCasesFilters';
import StockCaseSkeletonCard from '@/components/StockCaseSkeletonCard';
import CommunityStats from '@/components/CommunityStats';

const StockCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(20);
  const { deleteStockCase } = useStockCaseOperations();
  
  const navigate = useNavigate();

  // Fetch real data for mobile stats
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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>

          {/* Header Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Stock Cases
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                Utforska handplockade aktiefall och investeringsmöjligheter
              </p>
            </div>
          </div>

          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <StockCaseSkeletonCard key={index} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Button>

        {/* Header Section */}
        <div className="space-y-2 sm:space-y-3">
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Stock Cases
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Utforska handplockade aktiefall och investeringsmöjligheter
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-0">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Alla Cases</span>
            <span className="sm:hidden">Alla</span>
          </Button>
          <Button
            variant={viewMode === 'trending' ? 'default' : 'outline'}
            onClick={() => setViewMode('trending')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Trending</span>
            <span className="sm:hidden">Trending</span>
          </Button>
          <Button
            variant={viewMode === 'followed' ? 'default' : 'outline'}
            onClick={() => setViewMode('followed')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Följda</span>
            <span className="sm:hidden">Följda</span>
          </Button>
        </div>

        {/* Stats Section */}
        <div className="hidden sm:block">
          <CommunityStats />
        </div>
        
        {/* Mobile stats */}
        <div className="sm:hidden px-2">
          <div className="flex justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {activeCases || 0} Aktiva
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount ? `${memberCount > 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount}` : '0'} Medlemmar
            </span>
          </div>
        </div>

        {/* Filters */}
        <StockCasesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory=""
          onCategoryChange={() => {}}
          performanceFilter=""
          onPerformanceFilterChange={() => {}}
          sortBy=""
          onSortChange={() => {}}
          sortOrder="desc"
          onSortOrderChange={() => {}}
          viewMode="grid"
          onViewModeChange={() => {}}
          categories={[]}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between px-2 sm:px-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span className="hidden sm:inline">Visar </span>
            {filteredAndSortedCases.length} av {displayCases.length} cases
            {searchTerm && (
              <span className="hidden sm:inline"> för "{searchTerm}"</span>
            )}
          </p>
        </div>

        {/* Stock Cases Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 px-2 sm:px-0">
            {viewMode === 'trending' ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            ) : viewMode === 'followed' ? (
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            ) : (
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {viewMode === 'trending' ? (
                <>
                  <span className="hidden sm:inline">Trending Stock Cases</span>
                  <span className="sm:hidden">Trending</span>
                </>
              ) : viewMode === 'followed' ? (
                <>
                  <span className="hidden sm:inline">Följda Stock Cases</span>
                  <span className="sm:hidden">Följda</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Alla Stock Cases</span>
                  <span className="sm:hidden">Alla Cases</span>
                </>
              )}
            </h2>
          </div>

          {filteredAndSortedCases.length === 0 ? (
            <Card className="text-center py-6 sm:py-8 bg-gray-50 dark:bg-gray-800 mx-2 sm:mx-0">
              <CardContent className="pt-4">
                {viewMode === 'followed' ? (
                  <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                ) : (
                  <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                )}
                <CardTitle className="text-base sm:text-lg mb-2 text-gray-900 dark:text-gray-100">
                  {searchTerm
                    ? 'Inga cases matchar din sökning'
                    : viewMode === 'trending' 
                    ? 'Inga trending cases ännu'
                    : viewMode === 'followed'
                    ? 'Inga följda cases ännu'
                    : 'Inga stock cases ännu'
                  }
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 px-4">
                  {searchTerm
                    ? 'Prova att justera dina sökkriterier.'
                    : viewMode === 'trending' 
                    ? 'Cases kommer att visas här när de börjar få likes från communityn.'
                    : viewMode === 'followed'
                    ? 'Börja följa några cases för att se dem här. Du behöver vara inloggad för att följa cases.'
                    : 'Stock cases kommer att visas här när de läggs till av våra experter.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Rensa sökning
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="px-2 sm:px-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedCases.map((stockCase) => (
                  <StockCaseCard
                    key={stockCase.id}
                    stockCase={stockCase}
                    onViewDetails={handleViewStockCaseDetails}
                    onDelete={handleDeleteStockCase}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockCases;
