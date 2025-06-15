
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Activity, Clock, Filter, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import StockCaseListItem from '@/components/StockCaseListItem';
import StockCasesFilters from '@/components/StockCasesFilters';
import StockCaseSkeletonCard from '@/components/StockCaseSkeletonCard';

const StockCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  
  const { stockCases: allStockCases, loading: allLoading, deleteStockCase } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(20);
  
  const navigate = useNavigate();

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
    selectedCategory,
    setSelectedCategory,
    performanceFilter,
    setPerformanceFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode: displayViewMode,
    setViewMode: setDisplayViewMode,
    filteredAndSortedCases,
    categories,
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
        <div className="space-y-6 lg:space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Button>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                Stock Cases
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Explore our hand-picked stock cases and learn about interesting investment opportunities
              </p>
            </div>
          </div>

          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Stock Cases
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore our hand-picked stock cases and learn about interesting investment opportunities
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            All Cases
          </Button>
          <Button
            variant={viewMode === 'trending' ? 'default' : 'outline'}
            onClick={() => setViewMode('trending')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </Button>
          <Button
            variant={viewMode === 'followed' ? 'default' : 'outline'}
            onClick={() => setViewMode('followed')}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Followed
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Community</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                1,234
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Active Members</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg text-green-800 dark:text-green-200">Total Cases</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                {allStockCases.length}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">Stock Cases</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-800 dark:text-orange-200">Active Cases</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                {allStockCases.filter(c => c.status === 'active').length}
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">Currently Tracking</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <StockCasesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          performanceFilter={performanceFilter}
          onPerformanceFilterChange={setPerformanceFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={displayViewMode}
          onViewModeChange={setDisplayViewMode}
          categories={categories}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedCases.length} of {displayCases.length} cases
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Stock Cases Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {viewMode === 'trending' ? (
              <TrendingUp className="w-6 h-6 text-orange-500" />
            ) : viewMode === 'followed' ? (
              <Heart className="w-6 h-6 text-red-500" />
            ) : (
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {viewMode === 'trending' ? 'Trending Stock Cases' : 
               viewMode === 'followed' ? 'Followed Stock Cases' : 
               'All Stock Cases'}
            </h2>
          </div>

          {filteredAndSortedCases.length === 0 ? (
            <Card className="text-center py-12 bg-gray-50 dark:bg-gray-800">
              <CardContent className="pt-6">
                {viewMode === 'followed' ? (
                  <Heart className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                ) : (
                  <Activity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                )}
                <CardTitle className="text-xl mb-2 text-gray-900 dark:text-gray-100">
                  {searchTerm || selectedCategory !== 'all' || performanceFilter !== 'all'
                    ? 'No cases match your filters'
                    : viewMode === 'trending' 
                    ? 'No trending cases yet'
                    : viewMode === 'followed'
                    ? 'No followed cases yet'
                    : 'No stock cases yet'
                  }
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || selectedCategory !== 'all' || performanceFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : viewMode === 'trending' 
                    ? 'Cases will appear here when they start getting likes from the community.'
                    : viewMode === 'followed'
                    ? 'Start following some cases to see them here. You need to be logged in to follow cases.'
                    : 'Stock cases will be displayed here when they are added by our experts.'
                  }
                </p>
                {(searchTerm || selectedCategory !== 'all' || performanceFilter !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setPerformanceFilter('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {displayViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedCases.map((stockCase) => (
                    <StockCaseCard
                      key={stockCase.id}
                      stockCase={stockCase}
                      onViewDetails={handleViewStockCaseDetails}
                      onDelete={handleDeleteStockCase}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedCases.map((stockCase) => (
                    <StockCaseListItem
                      key={stockCase.id}
                      stockCase={stockCase}
                      onViewDetails={handleViewStockCaseDetails}
                      onDelete={handleDeleteStockCase}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockCases;
