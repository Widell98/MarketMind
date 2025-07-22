
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Calendar, User, Bookmark, Share, Filter, Search, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { useNavigate } from 'react-router-dom';

interface StockCasesFeedProps {
  showFilters?: boolean;
}

const StockCasesFeed = ({ showFilters = false }: StockCasesFeedProps) => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const navigate = useNavigate();

  // Get stock cases based on view mode
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(12);

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

  const { cases: displayCases, loading } = getDisplayData();

  // Add search functionality
  const {
    searchTerm,
    setSearchTerm,
    filteredAndSortedCases,
  } = useStockCasesFilters({ stockCases: displayCases });

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex flex-wrap gap-2 justify-start mb-4">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Input
              placeholder="Sök..."
              className="max-w-xs"
              disabled
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök bland cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {showFilters && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              size="sm"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Alla
            </Button>
            <Button
              variant={viewMode === 'trending' ? 'default' : 'outline'}
              onClick={() => setViewMode('trending')}
              size="sm"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Trending
            </Button>
            <Button
              variant={viewMode === 'followed' ? 'default' : 'outline'}
              onClick={() => setViewMode('followed')}
              size="sm"
              className="flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              Följda
            </Button>
          </div>
        )}
      </div>

      {/* Stock Cases Feed */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedCases.map((stockCase) => (
          <StockCaseCard
            key={stockCase.id}
            stockCase={stockCase}
            onViewDetails={() => handleViewDetails(stockCase.id)}
            onDiscussWithAI={() => handleDiscussWithAI(stockCase)}
          />
        ))}
      </div>

      {filteredAndSortedCases.length === 0 && (
        <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? `Inga resultat för "${searchTerm}"` : 'Inga cases tillgängliga'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Försök med andra sökord' : 'Håll utkik efter nya cases som kommer snart'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Separate card component for better organization
const StockCaseCard = ({ stockCase, onViewDetails, onDiscussWithAI }: any) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={onViewDetails}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {stockCase.status || 'Active'}
                </Badge>
                {stockCase.sector && (
                  <Badge variant="secondary">
                    {stockCase.sector}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                {stockCase.title || stockCase.company_name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {stockCase.description}
              </p>
            </div>
          </div>

          {/* Metadata and Actions */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonymous'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow();
                }}
                className="flex items-center gap-1"
              >
                <Bookmark className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                <span>{isFollowing ? 'Följer' : 'Följ'}</span>
              </Button>
              
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className="flex items-center gap-1"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscussWithAI();
                }}
                className="flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Diskutera</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Share functionality
                }}
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCasesFeed;
