
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Filter, Search, Clock, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useStockCasesFilters } from '@/hooks/useStockCasesFilters';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';

const StockCasesFeed = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const navigate = useNavigate();

  const { stockCases: allStockCases, loading: allLoading } = useStockCases();
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(6);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);

  const getDisplayData = () => {
    switch (viewMode) {
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followedStockCases, loading: followedLoading };
      default:
        return { cases: allStockCases, loading: allLoading };
    }
  };

  const { cases: displayCases, loading } = getDisplayData();

  const {
    searchTerm,
    setSearchTerm,
    filteredAndSortedCases,
  } = useStockCasesFilters({ stockCases: displayCases });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök bland cases..."
            className="pl-10 pr-3"
            disabled
          />
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="default" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Alla Cases
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Följda
          </Button>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Sök bland cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-3"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          onClick={() => setViewMode('all')}
          size="sm"
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Alla Cases
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

      {/* Stock Cases Feed */}
      <div className="space-y-4">
        {filteredAndSortedCases.map((stockCase) => (
          <StockCaseFeedCard key={stockCase.id} stockCase={stockCase} />
        ))}
      </div>
    </div>
  );
};

const StockCaseFeedCard = ({ stockCase }: { stockCase: any }) => {
  const navigate = useNavigate();
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);

  const handleClick = () => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-0 bg-card"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {stockCase.case_categories && (
                  <Badge variant="secondary" className="text-xs">
                    {stockCase.case_categories.name}
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                >
                  {stockCase.status}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold line-clamp-2">
                {stockCase.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stockCase.company_name}
              </p>
            </div>

            {stockCase.image_url && (
              <div className="flex-shrink-0 ml-4">
                <img 
                  src={stockCase.image_url} 
                  alt={stockCase.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Description */}
          {stockCase.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stockCase.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
              </span>
              <span>
                av {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow();
                }}
                className={isFollowing ? 'text-primary' : ''}
              >
                <Bookmark className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ai-chat`, { 
                    state: { 
                      contextData: {
                        type: 'stock_case',
                        id: stockCase.id,
                        title: stockCase.title
                      }
                    }
                  });
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCasesFeed;
