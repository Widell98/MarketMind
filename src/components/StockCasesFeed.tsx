
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Heart, MessageCircle, Calendar, User, Bookmark, Share, Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { useNavigate } from 'react-router-dom';

const StockCasesFeed = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const navigate = useNavigate();

  // Fetch data based on view mode
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(6);

  const getDisplayData = () => {
    switch (viewMode) {
      case 'all':
        return { cases: allStockCases.slice(0, 6), loading: allLoading };
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followedStockCases.slice(0, 6), loading: followedLoading };
      default:
        return { cases: allStockCases.slice(0, 6), loading: allLoading };
    }
  };

  const { cases: displayCases, loading } = getDisplayData();

  // Add search functionality
  const {
    searchTerm,
    setSearchTerm,
    filteredAndSortedCases,
  } = useStockCasesFilters({ stockCases: displayCases });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative px-2 sm:px-0">
          <Search className="absolute left-4 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök bland cases..."
            className="pl-10 pr-3 py-2 text-sm rounded-md"
            disabled
          />
        </div>

        {/* Filter Tabs - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 px-2 sm:px-0">
          <Button variant="default" size="sm" className="flex items-center justify-center gap-2 text-xs px-3 py-2">
            <Filter className="w-3 h-3" />
            <span className="hidden xs:inline">All Cases</span>
            <span className="xs:hidden">All</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 text-xs px-3 py-2">
            <TrendingUp className="w-3 h-3" />
            <span className="hidden xs:inline">Trending</span>
            <span className="xs:hidden">Trend</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 text-xs px-3 py-2">
            <Bookmark className="w-3 h-3" />
            <span className="hidden xs:inline">Followed</span>
            <span className="xs:hidden">Follow</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 sm:px-0">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="border-0 shadow-sm animate-pulse">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (filteredAndSortedCases.length === 0 && searchTerm) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative px-2 sm:px-0">
          <Search className="absolute left-4 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök bland cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 text-sm rounded-md"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 px-2 sm:px-0">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <Filter className="w-3 h-3" />
            <span className="hidden xs:inline">All Cases</span>
            <span className="xs:hidden">All</span>
          </Button>
          <Button
            variant={viewMode === 'trending' ? 'default' : 'outline'}
            onClick={() => setViewMode('trending')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <TrendingUp className="w-3 h-3" />
            <span className="hidden xs:inline">Trending</span>
            <span className="xs:hidden">Trend</span>
          </Button>
          <Button
            variant={viewMode === 'followed' ? 'default' : 'outline'}
            onClick={() => setViewMode('followed')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <Bookmark className="w-3 h-3" />
            <span className="hidden xs:inline">Followed</span>
            <span className="xs:hidden">Follow</span>
          </Button>
        </div>

        <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800 mx-2 sm:mx-0">
          <CardContent className="pt-4">
            <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Inga cases hittades för "{searchTerm}"
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Försök med andra sökord eller rensa sökningen.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchTerm('')}
            >
              Rensa sökning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (filteredAndSortedCases.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative px-2 sm:px-0">
          <Search className="absolute left-4 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök bland cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 text-sm rounded-md"
          />
        </div>

        {/* Filter Tabs - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 px-2 sm:px-0">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <Filter className="w-3 h-3" />
            <span className="hidden xs:inline">All Cases</span>
            <span className="xs:hidden">All</span>
          </Button>
          <Button
            variant={viewMode === 'trending' ? 'default' : 'outline'}
            onClick={() => setViewMode('trending')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <TrendingUp className="w-3 h-3" />
            <span className="hidden xs:inline">Trending</span>
            <span className="xs:hidden">Trend</span>
          </Button>
          <Button
            variant={viewMode === 'followed' ? 'default' : 'outline'}
            onClick={() => setViewMode('followed')}
            size="sm"
            className="flex items-center justify-center gap-2 text-xs px-3 py-2"
          >
            <Bookmark className="w-3 h-3" />
            <span className="hidden xs:inline">Followed</span>
            <span className="xs:hidden">Follow</span>
          </Button>
        </div>

        <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800 mx-2 sm:mx-0">
          <CardContent className="pt-4">
            <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {viewMode === 'trending' 
                ? 'No trending cases yet'
                : viewMode === 'followed'
                ? 'No followed cases yet'
                : 'Inga cases än'
              }
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {viewMode === 'trending' 
                ? 'Cases will appear here when they start getting likes from the community.'
                : viewMode === 'followed'
                ? 'Start following some cases to see them here.'
                : 'Investment cases kommer att visas här när de läggs till av våra experter.'
              }
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/stock-cases')}>
              Utforska alla cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative px-2 sm:px-0">
        <Search className="absolute left-4 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Sök bland cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-3 py-2 text-sm rounded-md"
        />
      </div>

      {/* Results count when searching */}
      {searchTerm && (
        <div className="px-2 sm:px-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {filteredAndSortedCases.length} cases hittades för "{searchTerm}"
          </p>
        </div>
      )}

      {/* Filter Tabs - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 px-2 sm:px-0">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          onClick={() => setViewMode('all')}
          size="sm"
          className="flex items-center justify-center gap-2 text-xs px-3 py-2"
        >
          <Filter className="w-3 h-3" />
          <span className="hidden xs:inline">All Cases</span>
          <span className="xs:hidden">All</span>
        </Button>
        <Button
          variant={viewMode === 'trending' ? 'default' : 'outline'}
          onClick={() => setViewMode('trending')}
          size="sm"
          className="flex items-center justify-center gap-2 text-xs px-3 py-2"
        >
          <TrendingUp className="w-3 h-3" />
          <span className="hidden xs:inline">Trending</span>
          <span className="xs:hidden">Trend</span>
        </Button>
        <Button
          variant={viewMode === 'followed' ? 'default' : 'outline'}
          onClick={() => setViewMode('followed')}
          size="sm"
          className="flex items-center justify-center gap-2 text-xs px-3 py-2"
        >
          <Bookmark className="w-3 h-3" />
          <span className="hidden xs:inline">Followed</span>
          <span className="xs:hidden">Follow</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 sm:px-0">
        {filteredAndSortedCases.map((stockCase) => (
          <StockCaseCompactCard
            key={stockCase.id}
            stockCase={stockCase}
            onViewDetails={() => navigate(`/stock-cases/${stockCase.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

const StockCaseCompactCard = ({ stockCase, onViewDetails }: { stockCase: any; onViewDetails: () => void }) => {
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
  const shouldShowPerformance = stockCase.status !== 'active'; // Only show performance for non-active cases

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={onViewDetails}
    >
      {/* Header with badges */}
      <div className="p-3 sm:p-4 pb-3">
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

        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
          {stockCase.company_name || stockCase.title}
        </h3>
      </div>

      {/* Chart/Image */}
      <div className="relative h-36 sm:h-48 mx-3 sm:mx-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <img 
          src={getImageUrl(stockCase)} 
          alt={`${stockCase.company_name} chart`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Performance and Target - Only show for non-active cases */}
      {shouldShowPerformance && (
        <div className="px-3 sm:px-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {performance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-semibold text-sm ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">
              Target: {stockCase.target_price ? `${stockCase.target_price} kr` : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Date and Author */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-20 sm:max-w-none">{stockCase.profiles?.display_name || stockCase.profiles?.username || 'Widell98'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={isFollowing ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFollow();
            }}
            className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5"
          >
            <Bookmark className={`w-3 h-3 ${isFollowing ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{isFollowing ? 'Följer' : 'Följ'}</span>
          </Button>
          
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex items-center gap-1 px-2 sm:px-3 text-xs py-1.5"
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{likeCount}</span>
            <span className="xs:hidden">{likeCount}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Share functionality can be added here
            }}
            className="flex items-center gap-1 px-2 sm:px-3 text-xs py-1.5"
          >
            <Share className="w-3 h-3" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StockCasesFeed;
