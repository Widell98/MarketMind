
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, TrendingUp, Heart, UserCheck, UserPlus, Eye, MessageCircle, Filter, Bookmark } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const CompactLatestCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const navigate = useNavigate();

  // Fetch data based on view mode
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(6);
  const { latestCases: latestStockCases, loading: latestLoading } = useLatestStockCases(6);

  const getDisplayData = () => {
    switch (viewMode) {
      case 'all':
        return { cases: latestStockCases, loading: latestLoading };
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followedStockCases.slice(0, 6), loading: followedLoading };
      default:
        return { cases: latestStockCases, loading: latestLoading };
    }
  };

  const { cases: displayCases, loading } = getDisplayData();

  if (loading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            Senaste Aktiefall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayCases.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              Senaste Aktiefall
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/stock-cases')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Visa alla
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mt-3">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              Alla
            </Button>
            <Button
              variant={viewMode === 'trending' ? 'default' : 'outline'}
              onClick={() => setViewMode('trending')}
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              Trending
            </Button>
            <Button
              variant={viewMode === 'followed' ? 'default' : 'outline'}
              onClick={() => setViewMode('followed')}
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              Följda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-4 text-sm">
            {viewMode === 'trending' 
              ? 'Inga trending cases ännu.'
              : viewMode === 'followed'
              ? 'Du följer inga cases ännu.'
              : 'Inga cases tillgängliga ännu.'
            }
          </p>
          <div className="text-center">
            <Button 
              onClick={() => navigate('/stock-cases')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Skapa ditt första case
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            Senaste Aktiefall
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/stock-cases')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Visa alla
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            size="sm"
            className="text-xs px-2 py-1 h-7"
          >
            Alla
          </Button>
          <Button
            variant={viewMode === 'trending' ? 'default' : 'outline'}
            onClick={() => setViewMode('trending')}
            size="sm"
            className="text-xs px-2 py-1 h-7"
          >
            Trending
          </Button>
          <Button
            variant={viewMode === 'followed' ? 'default' : 'outline'}
            onClick={() => setViewMode('followed')}
            size="sm"
            className="text-xs px-2 py-1 h-7"
          >
            Följda
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayCases.map((stockCase) => (
            <CompactStockCaseItem key={stockCase.id} stockCase={stockCase} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CompactStockCaseItem = ({ stockCase }: { stockCase: any }) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Tech': 'bg-purple-500',
      'Biotech': 'bg-green-500',
      'Theme': 'bg-orange-500',
      'Gaming': 'bg-red-500',
      'Industrial': 'bg-blue-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string, performance: number | null) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs">
          Winner {performance ? `+${performance}%` : ''}
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs">
          Loser {performance ? `${performance}%` : ''}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs">
        Active
      </Badge>
    );
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      {/* Category indicator and image placeholder */}
      <div className="relative w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${getCategoryColor(stockCase.case_categories?.name || 'Tech')}`}></div>
        {stockCase.image_url && (
          <img 
            src={stockCase.image_url} 
            alt={stockCase.title}
            className="absolute inset-0 w-full h-full object-cover rounded"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
              {stockCase.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
              {stockCase.company_name}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>av {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
              </span>
            </div>
          </div>
          
          {/* Status and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <span className="text-xs text-gray-500">{likeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactLatestCases;
