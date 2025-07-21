
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, TrendingUp, Heart, Eye, Filter, Plus } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import LoginPromptModal from '@/components/LoginPromptModal';

const CompactLatestCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch data based on view mode - limit to 3 for compact display
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { stockCases: followedStockCases, loading: followedLoading } = useStockCases(true);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(3);
  const { latestCases: latestStockCases, loading: latestLoading } = useLatestStockCases(3);

  const getDisplayData = () => {
    switch (viewMode) {
      case 'all':
        return { cases: latestStockCases, loading: latestLoading };
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followedStockCases.slice(0, 3), loading: followedLoading };
      default:
        return { cases: latestStockCases, loading: latestLoading };
    }
  };

  const { cases: displayCases, loading } = getDisplayData();

  const handleCreateCase = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/stock-cases');
  };

  const handleViewAll = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/stock-cases');
  };

  if (loading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-6 h-6 text-blue-500" />
            Senaste Aktiefall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6 text-blue-500" />
              Senaste Aktiefall
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Visa alla
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Filter Tabs */}
          {user && (
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Alla
              </Button>
              <Button
                variant={viewMode === 'trending' ? 'default' : 'outline'}
                onClick={() => setViewMode('trending')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Trending
              </Button>
              <Button
                variant={viewMode === 'followed' ? 'default' : 'outline'}
                onClick={() => setViewMode('followed')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Följda
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {viewMode === 'trending' 
                ? 'Inga trending cases ännu'
                : viewMode === 'followed'
                ? 'Du följer inga cases ännu'
                : 'Bli först att skapa ett case!'
              }
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {!user 
                ? 'Skapa ett konto för att börja dela dina investeringsinsikter och följa andra.'
                : 'Dela dina investeringsanalyser och få feedback från communityn.'
              }
            </p>
            <Button onClick={handleCreateCase} className="gap-2">
              <Plus className="w-4 h-4" />
              {!user ? 'Kom igång' : 'Skapa ditt första case'}
            </Button>
          </div>
        </CardContent>
        <LoginPromptModal 
          isOpen={showLoginPrompt} 
          onClose={() => setShowLoginPrompt(false)} 
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6 text-blue-500" />
              Senaste Aktiefall
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Visa alla
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Filter Tabs - only show for logged in users */}
          {user && (
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Alla
              </Button>
              <Button
                variant={viewMode === 'trending' ? 'default' : 'outline'}
                onClick={() => setViewMode('trending')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Trending
              </Button>
              <Button
                variant={viewMode === 'followed' ? 'default' : 'outline'}
                onClick={() => setViewMode('followed')}
                size="sm"
                className="text-xs px-3 py-1 h-8"
              >
                Följda
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayCases.map((stockCase) => (
              <CompactStockCaseCard key={stockCase.id} stockCase={stockCase} />
            ))}
          </div>
          
          {/* Call to action for non-logged in users */}
          {!user && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Vill du skapa egna aktiefall och få tillgång till alla funktioner?
              </p>
              <Button onClick={handleCreateCase} variant="outline" size="sm">
                Skapa konto gratis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
      />
    </>
  );
};

const CompactStockCaseCard = ({ stockCase }: { stockCase: any }) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    toggleLike();
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
    <>
      <div 
        className="group cursor-pointer"
        onClick={handleClick}
      >
        {/* Image/Visual */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
          {stockCase.image_url ? (
            <img 
              src={stockCase.image_url} 
              alt={stockCase.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full ${getCategoryColor(stockCase.case_categories?.name || 'Tech')}`}></div>
            </div>
          )}
          
          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {stockCase.title}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-1">
            {stockCase.company_name}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>av {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
          </div>
        </div>
      </div>
      
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
      />
    </>
  );
};

export default CompactLatestCases;
