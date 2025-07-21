import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Activity, Clock, Filter, Bookmark, BarChart3, Plus, Bot, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import StockCaseListItem from '@/components/StockCaseListItem';
import StockCasesFilters from '@/components/StockCasesFilters';
import StockCaseSkeletonCard from '@/components/StockCaseSkeletonCard';
import CommunityStats from '@/components/CommunityStats';
import AnalysisSection from '@/components/AnalysisSection';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';

const StockCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const [contentType, setContentType] = useState<'stock-cases' | 'analyses' | 'both'>('both');
  const [contentSource, setContentSource] = useState<'all' | 'ai' | 'community'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(20);
  const { deleteStockCase } = useStockCaseOperations();
  const { user } = useAuth();
  
  const navigate = useNavigate();

  // Fetch real data for mobile stats (same as on Index page)
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
    let baseCases;
    let loading;
    
    switch (viewMode) {
      case 'all':
        baseCases = allStockCases;
        loading = allLoading;
        break;
      case 'trending':
        baseCases = trendingCases;
        loading = trendingLoading;
        break;
      case 'followed':
        baseCases = followedStockCases;
        loading = followedLoading;
        break;
      default:
        baseCases = allStockCases;
        loading = allLoading;
    }

    // Filter by content source (AI vs Community)
    let filteredCases = baseCases;
    if (contentSource === 'ai') {
      filteredCases = baseCases.filter(stockCase => stockCase.ai_generated === true);
    } else if (contentSource === 'community') {
      filteredCases = baseCases.filter(stockCase => stockCase.ai_generated !== true);
    }

    return { cases: filteredCases, loading };
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

  const handleCreateCase = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header Section - More compact */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Aktier & Analyser
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                Utforska aktiecases och investeringsanalyser från communityn
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
        {/* Header Section with Create Button */}
        <div className="space-y-2 sm:space-y-3">
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Aktier & Analyser
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Utforska aktiecases och investeringsanalyser från communityn
            </p>
          </div>
          
          {/* Create Case Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCreateCase}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Skapa nytt aktiecase</span>
              <span className="sm:hidden">Skapa case</span>
            </Button>
          </div>
        </div>

        {/* Content Type Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-0">
          <Button
            variant={contentType === 'both' ? 'default' : 'outline'}
            onClick={() => setContentType('both')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Allt innehåll</span>
            <span className="sm:hidden">Allt</span>
          </Button>
          <Button
            variant={contentType === 'stock-cases' ? 'default' : 'outline'}
            onClick={() => setContentType('stock-cases')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Aktiecases</span>
            <span className="sm:hidden">Aktier</span>
          </Button>
          <Button
            variant={contentType === 'analyses' ? 'default' : 'outline'}
            onClick={() => setContentType('analyses')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Analyser</span>
            <span className="sm:hidden">Analyser</span>
          </Button>
        </div>

        {/* Content Source Filter */}
        {(contentType === 'stock-cases' || contentType === 'both') && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-0">
            <Button
              variant={contentSource === 'all' ? 'default' : 'outline'}
              onClick={() => setContentSource('all')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Alla källor</span>
              <span className="sm:hidden">Alla</span>
            </Button>
            <Button
              variant={contentSource === 'ai' ? 'default' : 'outline'}
              onClick={() => setContentSource('ai')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">AI-genererat</span>
              <span className="sm:hidden">AI</span>
            </Button>
            <Button
              variant={contentSource === 'community' ? 'default' : 'outline'}
              onClick={() => setContentSource('community')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Community</span>
              <span className="sm:hidden">Community</span>
            </Button>
          </div>
        )}

        {/* Stats Section - Compact version */}
        <div className="hidden sm:block">
          <CommunityStats />
        </div>
        
        {/* Mobile stats - Using real data instead of hardcoded */}
        <div className="sm:hidden px-2">
          <div className="flex justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {activeCases || 0} Active
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount ? `${memberCount > 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount}` : '0'} Members
            </span>
          </div>
        </div>

        {/* Filters - Only show for stock cases */}
        {(contentType === 'stock-cases' || contentType === 'both') && (
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
            stockCasesViewMode={viewMode}
            onStockCasesViewModeChange={setViewMode}
          />
        )}

        {/* Main Content */}
        {contentType === 'both' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Stock Cases Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between px-2 sm:px-0">
                <div className="flex items-center gap-2">
                  {viewMode === 'trending' ? (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  ) : viewMode === 'followed' ? (
                    <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  ) : (
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    Aktiecases ({filteredAndSortedCases.length})
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setContentType('stock-cases')}
                  className="text-xs sm:text-sm"
                >
                  Se alla
                </Button>
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
                        : contentSource === 'ai'
                        ? 'Inga AI-genererade cases ännu'
                        : contentSource === 'community'
                        ? 'Inga community-skapade cases ännu'
                        : viewMode === 'trending' 
                        ? 'Inga trending cases ännu'
                        : viewMode === 'followed'
                        ? 'Inga följda cases ännu'
                        : 'Inga aktiecases ännu'
                      }
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 px-4">
                      {searchTerm
                        ? 'Prova att justera dina sökkriterier.'
                        : contentSource === 'community'
                        ? 'Bli den första att skapa ett community case!'
                        : viewMode === 'trending' 
                        ? 'Cases kommer visas här när de börjar få likes från communityn.'
                        : viewMode === 'followed'
                        ? 'Börja följa några cases för att se dem här. Du behöver vara inloggad för att följa cases.'
                        : 'Aktiecases kommer visas här när de läggs till.'
                      }
                    </p>
                    {contentSource === 'community' && (
                      <Button 
                        onClick={handleCreateCase}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Skapa första case
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="px-2 sm:px-0">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {filteredAndSortedCases.slice(0, 6).map((stockCase) => (
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

            {/* Analyses Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between px-2 sm:px-0">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    Senaste Analyser
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setContentType('analyses')}
                  className="text-xs sm:text-sm"
                >
                  Se alla
                </Button>
              </div>
              <AnalysisSection limit={6} showHeader={false} />
            </div>
          </div>
        ) : contentType === 'stock-cases' ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Results Count */}
            <div className="flex items-center justify-between px-2 sm:px-0">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">Visar </span>
                {filteredAndSortedCases.length} av {displayCases.length} cases
                {searchTerm && (
                  <span className="hidden sm:inline"> för "{searchTerm}"</span>
                )}
                {contentSource === 'ai' && (
                  <span> (AI-genererade)</span>
                )}
                {contentSource === 'community' && (
                  <span> (Community-skapade)</span>
                )}
              </p>
            </div>

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
                    <span className="hidden sm:inline">Trending Aktiecases</span>
                    <span className="sm:hidden">Trending</span>
                  </>
                ) : viewMode === 'followed' ? (
                  <>
                    <span className="hidden sm:inline">Följda Aktiecases</span>
                    <span className="sm:hidden">Följda</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Alla Aktiecases</span>
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
                      : contentSource === 'ai'
                      ? 'Inga AI-genererade cases ännu'
                      : contentSource === 'community'
                      ? 'Inga community-skapade cases ännu'
                      : viewMode === 'trending' 
                      ? 'Inga trending cases ännu'
                      : viewMode === 'followed'
                      ? 'Inga följda cases ännu'
                      : 'Inga aktiecases ännu'
                    }
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 px-4">
                    {searchTerm
                      ? 'Prova att justera dina sökkriterier.'
                      : contentSource === 'community'
                      ? 'Bli den första att skapa ett community case!'
                      : viewMode === 'trending' 
                      ? 'Cases kommer visas här när de börjar få likes från communityn.'
                      : viewMode === 'followed'
                      ? 'Börja följa några cases för att se dem här. Du behöver vara inloggad för att följa cases.'
                      : 'Aktiecases kommer visas här när de läggs till.'
                    }
                  </p>
                  {searchTerm && (
                    <Button 
                      onClick={() => setSearchTerm('')}
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm mr-2"
                    >
                      Rensa sökning
                    </Button>
                  )}
                  {contentSource === 'community' && (
                    <Button 
                      onClick={handleCreateCase}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Skapa första case
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="px-2 sm:px-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 px-2 sm:px-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                Alla Analyser
              </h2>
            </div>
            <AnalysisSection limit={20} showHeader={false} />
          </div>
        )}
      </div>

      {/* Create Stock Case Dialog */}
      <CreateStockCaseDialog 
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </Layout>
  );
};

export default StockCases;
