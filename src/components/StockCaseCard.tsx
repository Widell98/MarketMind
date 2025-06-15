
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Clock, Eye, Heart, Trash2, UserPlus, UserCheck } from 'lucide-react';
import { StockCase } from '@/hooks/useStockCases';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface StockCaseCardProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
}

const StockCaseCard: React.FC<StockCaseCardProps> = ({ stockCase, onViewDetails, onDelete }) => {
  const { likeCount, isLiked, loading: likesLoading, toggleLike } = useStockCaseLikes(stockCase.id);
  const { followCount, isFollowing, loading: followLoading, toggleFollow } = useStockCaseFollows(stockCase.id);
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const getStatusIcon = () => {
    switch (stockCase.status) {
      case 'winner':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'loser':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (stockCase.status) {
      case 'winner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'loser':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  const formatPerformance = () => {
    if (!stockCase.performance_percentage) return null;
    const sign = stockCase.performance_percentage > 0 ? '+' : '';
    return `${sign}${stockCase.performance_percentage.toFixed(1)}%`;
  };

  const getUserDisplayName = () => {
    return stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonymous';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwner = user?.id === stockCase.user_id;
  const canDelete = isOwner || isAdmin;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this stock case?')) {
      onDelete(stockCase.id);
    }
  };

  return (
    <Card className="group cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-2 w-full max-w-sm mx-auto">
      {stockCase.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={stockCase.image_url}
            alt={stockCase.company_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              {stockCase.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium truncate">
              {stockCase.company_name}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getStatusIcon()}
            <Badge className={`text-xs ${getStatusColor()}`}>
              {stockCase.status === 'active' ? 'Active' : stockCase.status === 'winner' ? 'Winner' : 'Loser'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {getUserDisplayName()}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              disabled={likesLoading}
              className="flex items-center gap-1 p-1.5 h-auto min-w-0"
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-colors flex-shrink-0",
                  isLiked 
                    ? "fill-red-500 text-red-500" 
                    : "text-gray-400 hover:text-red-500"
                )}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {likeCount}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow();
              }}
              disabled={followLoading}
              className="flex items-center gap-1 p-1.5 h-auto min-w-0"
            >
              {isFollowing ? (
                <UserCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <UserPlus className="w-4 h-4 text-gray-400 hover:text-blue-500 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {followCount}
              </span>
            </Button>

            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="flex items-center p-1.5 h-auto text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-w-0"
                title={isAdmin && !isOwner ? "Delete as admin" : "Delete your case"}
              >
                <Trash2 className="w-4 h-4 flex-shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {stockCase.case_categories && (
              <Badge 
                className="text-xs"
                style={{ 
                  backgroundColor: `${stockCase.case_categories.color}20`,
                  color: stockCase.case_categories.color,
                  border: `1px solid ${stockCase.case_categories.color}40`
                }}
              >
                {stockCase.case_categories.name}
              </Badge>
            )}
            {stockCase.performance_percentage !== null && (
              <span className={`text-sm font-semibold ${stockCase.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPerformance()}
              </span>
            )}
          </div>

          {stockCase.entry_price && stockCase.target_price && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Entry:</span>
                <span className="font-medium">{stockCase.entry_price} kr</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-medium">{stockCase.target_price} kr</span>
              </div>
            </div>
          )}

          {stockCase.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {stockCase.description}
            </p>
          )}
          
          <Button 
            onClick={() => onViewDetails(stockCase.id)}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white border-0 transition-all duration-200 transform group-hover:scale-105"
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCaseCard;
