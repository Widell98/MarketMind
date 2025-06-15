
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, ThumbsUp, TrendingUp, TrendingDown, Calendar, User, MoreHorizontal, Trash2 } from 'lucide-react';
import { StockCase } from '@/hooks/useStockCases';
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
  const { followCount, isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);

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
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={`${getStatusColor(stockCase.status || 'active')} text-white`}>
                {stockCase.status || 'active'}
              </Badge>
              <Badge variant="outline">
                {stockCase.case_categories?.name || stockCase.sector || 'General'}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => onViewDetails(stockCase.id)}>
              {stockCase.title}
            </CardTitle>
          </div>
          
          {(isAdmin || (user && onDelete)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(stockCase.id)}
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
      
      <CardContent className="flex-1 flex flex-col">
        {/* Stock Image - Responsive */}
        {stockCase.image_url && (
          <div 
            className="mb-4 cursor-pointer"
            onClick={() => onViewDetails(stockCase.id)}
          >
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group/image">
              <img
                src={stockCase.image_url}
                alt={`${stockCase.company_name} stock chart`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300" />
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
          {stockCase.description}
        </p>
        
        <div className="space-y-3">
          {/* Performance and Target */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {performance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-semibold ${getPerformanceColor(performance)}`}>
                {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Target: {stockCase.target_price ? `$${stockCase.target_price}` : 'N/A'}
            </div>
          </div>

          {/* Meta information */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(stockCase.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Expert'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(stockCase.id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            
            <Button
              size="sm"
              variant={isLiked ? "default" : "outline"}
              onClick={toggleLike}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              {likeCount}
            </Button>
            
            <Button
              size="sm"
              variant={isFollowing ? "default" : "outline"}
              onClick={toggleFollow}
              className="flex items-center gap-1"
            >
              <Heart className="w-4 h-4" />
              {followCount}
            </Button>

            <ShareStockCase stockCaseId={stockCase.id} title={stockCase.title} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCaseCard;
