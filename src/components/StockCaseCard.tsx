
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Bookmark, TrendingUp, TrendingDown, Calendar, User, MoreHorizontal, Trash2 } from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import ShareStockCase from './ShareStockCase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StockCaseCardProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
}

const StockCaseCard: React.FC<StockCaseCardProps> = ({ 
  stockCase, 
  onViewDetails, 
  onDelete 
}) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-green-600 dark:text-green-400';
    if (performance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate performance based on entry_price and current_price
  const calculatePerformance = () => {
    if (stockCase.entry_price && stockCase.current_price) {
      return ((stockCase.current_price - stockCase.entry_price) / stockCase.entry_price) * 100;
    }
    return stockCase.performance_percentage || 0;
  };

  const performance = calculatePerformance();

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 group cursor-pointer" onClick={() => onViewDetails(stockCase.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className={`${getStatusColor(stockCase.status || 'active')} text-white text-xs`}>
                {stockCase.status || 'active'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stockCase.case_categories?.name || stockCase.sector || 'General'}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {stockCase.title}
            </CardTitle>
          </div>
          
          {(isAdmin || (user && onDelete)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(stockCase.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Stock Image - Responsive */}
        {stockCase.image_url && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group/image">
            <img
              src={stockCase.image_url}
              alt={`${stockCase.company_name} stock chart`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300" />
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 flex-1">
          {stockCase.description}
        </p>
        
        <div className="space-y-3 mt-auto">
          {/* Performance and Target */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {performance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className={`font-semibold text-sm ${getPerformanceColor(performance)}`}>
                {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate ml-2">
              Target: {stockCase.target_price ? `$${stockCase.target_price}` : 'N/A'}
            </div>
          </div>

          {/* Meta information */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{formatDate(stockCase.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 ml-2">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{stockCase.profiles?.display_name || stockCase.profiles?.username || 'Expert'}</span>
            </div>
          </div>

          {/* Action buttons - Responsive layout */}
          <div className="pt-2 border-t">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Follow Button - Only show for logged in users */}
              {user && (
                <Button
                  size="sm"
                  variant={isFollowing ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow();
                  }}
                  className="flex-1 flex items-center gap-1 min-w-0"
                  title={isFollowing ? "Sluta följa" : "Följ case"}
                >
                  <Bookmark className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  <span className="hidden lg:inline">{isFollowing ? 'Följer' : 'Följ'}</span>
                </Button>
              )}

              {/* Like Button - For appreciation with counter */}
              <Button
                size="sm"
                variant={isLiked ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className="flex-1 flex items-center gap-1 min-w-0"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="hidden lg:inline">{likeCount}</span>
                <span className="lg:hidden">{likeCount > 99 ? '99+' : likeCount}</span>
              </Button>

              <div className="flex-1">
                <ShareStockCase stockCaseId={stockCase.id} title={stockCase.title} />
              </div>
            </div>

            {/* Mobile layout - compact buttons */}
            <div className="flex items-center gap-1 sm:hidden">
              {/* Follow Button - Mobile - Only show for logged in users */}
              {user && (
                <Button
                  size="sm"
                  variant={isFollowing ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2"
                  title={isFollowing ? "Sluta följa" : "Följ case"}
                >
                  <Bookmark className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  <span className="text-xs">{isFollowing ? 'Följer' : 'Följ'}</span>
                </Button>
              )}

              {/* Like Button - Mobile */}
              <Button
                size="sm"
                variant={isLiked ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className="flex-1 flex items-center justify-center gap-1 px-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likeCount}</span>
              </Button>

              <div className="flex-1">
                <ShareStockCase stockCaseId={stockCase.id} title={stockCase.title} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCaseCard;
