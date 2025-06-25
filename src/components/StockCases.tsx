
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Activity, Filter, Bookmark, Heart, Share, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import StockCasesFilters from '@/components/StockCasesFilters';
import CommunityStats from '@/components/CommunityStats';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const StockCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  
  const { stockCases: allStockCases, loading: allLoading, deleteStockCase } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(20);
  
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

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Stock Cases
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                Explore hand-picked stock cases and investment opportunities
              </p>
            </div>
          </div>

          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header Section */}
        <div className="space-y-2 sm:space-y-3">
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              All Stock Cases
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Explore hand-picked stock cases and investment opportunities
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
            <span className="hidden sm:inline">All Cases</span>
            <span className="sm:hidden">All</span>
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
            <span className="hidden sm:inline">Followed</span>
            <span className="sm:hidden">Followed</span>
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
              {activeCases || 0} Active
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount ? `${memberCount > 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount}` : '0'} Members
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
            <span className="hidden sm:inline">Showing </span>
            {filteredAndSortedCases.length} of {displayCases.length} cases
            {searchTerm && (
              <span className="hidden sm:inline"> for "{searchTerm}"</span>
            )}
          </p>
        </div>

        {/* Stock Cases Grid */}
        <div className="space-y-3 sm:space-y-4">
          {filteredAndSortedCases.length === 0 ? (
            <Card className="text-center py-6 sm:py-8 bg-gray-50 dark:bg-gray-800 mx-2 sm:mx-0">
              <CardContent className="pt-4">
                {viewMode === 'followed' ? (
                  <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                ) : (
                  <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                )}
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {searchTerm
                    ? 'No cases match your search'
                    : viewMode === 'trending' 
                    ? 'No trending cases yet'
                    : viewMode === 'followed'
                    ? 'No followed cases yet'
                    : 'No stock cases yet'
                  }
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 px-4">
                  {searchTerm
                    ? 'Try adjusting your search criteria.'
                    : viewMode === 'trending' 
                    ? 'Cases will appear here when they start getting likes from the community.'
                    : viewMode === 'followed'
                    ? 'Start following some cases to see them here. You need to be logged in to follow cases.'
                    : 'Stock cases will be displayed here when they are added by our experts.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="px-2 sm:px-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedCases.map((stockCase) => (
                  <StockCaseCompactCard
                    key={stockCase.id}
                    stockCase={stockCase}
                    onViewDetails={handleViewStockCaseDetails}
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

const StockCaseCompactCard = ({ stockCase, onViewDetails }: { stockCase: any; onViewDetails: (id: string) => void }) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);

  const getCategoryColor = (category: string) => {
    const colors = {
      'Tech': 'bg-blue-500',
      'Biotech': 'bg-green-500',
      'Theme': 'bg-orange-500',
      'Gaming': 'bg-red-500',
      'Industrial': 'bg-purple-500',
      'Fastighet': 'bg-green-500',
      'Index': 'bg-blue-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getImageUrl = (stockCase: any) => {
    if (stockCase.image_url) {
      return stockCase.image_url;
    }
    // Fallback images - stock chart style
    const fallbackImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop&crop=center',
    ];
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  };

  const calculatePerformance = () => {
    if (stockCase.entry_price && stockCase.current_price) {
      return ((stockCase.current_price - stockCase.entry_price) / stockCase.entry_price) * 100;
    }
    return stockCase.performance_percentage || 0;
  };

  const performance = calculatePerformance();

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={() => onViewDetails(stockCase.id)}
    >
      {/* Header with badges */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white text-xs px-2 py-1">
              {stockCase.status === 'active' ? 'active' : stockCase.status}
            </Badge>
            <Badge 
              className={`text-white text-xs px-2 py-1 ${getCategoryColor(stockCase.case_categories?.name || stockCase.sector || 'Tech')}`}
            >
              {stockCase.case_categories?.name || stockCase.sector || 'Tech'}
            </Badge>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {stockCase.company_name || stockCase.title}
        </h3>
      </div>

      {/* Chart/Image */}
      <div className="relative h-48 mx-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <img 
          src={getImageUrl(stockCase)} 
          alt={`${stockCase.company_name} chart`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Performance and Target */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {performance >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-semibold ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Target: {stockCase.target_price ? `${stockCase.target_price} kr` : 'N/A'}
          </span>
        </div>

        {/* Date and Author */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{stockCase.profiles?.display_name || stockCase.profiles?.username || 'Widell98'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={isFollowing ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFollow();
            }}
            className="flex-1 flex items-center justify-center gap-1 text-xs"
          >
            <Bookmark className={`w-3 h-3 ${isFollowing ? 'fill-current' : ''}`} />
            {isFollowing ? 'Följer' : 'Följ'}
          </Button>
          
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex items-center gap-1 px-3 text-xs"
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Share functionality can be added here
            }}
            className="flex items-center gap-1 px-3 text-xs"
          >
            <Share className="w-3 h-3" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StockCases;
