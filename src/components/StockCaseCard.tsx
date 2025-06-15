
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
    return stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwner = user?.id === stockCase.user_id;
  const canDelete = isOwner || isAdmin; // Admin can delete any case, owner can delete their own

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Är du säker på att du vill ta bort detta aktiecase?')) {
      onDelete(stockCase.id);
    }
  };

  return (
    <Card className="group cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-2">
      {stockCase.image_url && (
        <div className="aspect-[4/3] lg:aspect-[3/2] xl:aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={stockCase.image_url}
            alt={stockCase.company_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}
      
      <CardHeader className="pb-3 lg:pb-4 xl:pb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              {stockCase.title}
            </h3>
            <p className="text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-400 font-medium">
              {stockCase.company_name}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <Badge className={`text-xs lg:text-sm ${getStatusColor()}`}>
              {stockCase.status === 'active' ? 'Aktiv' : stockCase.status === 'winner' ? 'Vinnare' : 'Förlorare'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 lg:mt-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8">
              <AvatarFallback className="text-xs lg:text-sm bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              {getUserDisplayName()}
            </span>
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              disabled={likesLoading}
              className="flex items-center gap-1 p-1 h-auto lg:p-2"
            >
              <Heart 
                className={cn(
                  "w-4 h-4 lg:w-5 lg:h-5 transition-colors",
                  isLiked 
                    ? "fill-red-500 text-red-500" 
                    : "text-gray-400 hover:text-red-500"
                )}
              />
              <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
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
              className="flex items-center gap-1 p-1 h-auto lg:p-2"
            >
              {isFollowing ? (
                <UserCheck className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
              ) : (
                <UserPlus className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 hover:text-blue-500" />
              )}
              <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                {followCount}
              </span>
            </Button>

            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-1 p-1 h-auto lg:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title={isAdmin && !isOwner ? "Ta bort som admin" : "Ta bort ditt case"}
              >
                <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 lg:pt-2">
        <div className="space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            {stockCase.case_categories && (
              <Badge 
                className="text-xs lg:text-sm"
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
              <span className={`text-sm lg:text-base xl:text-lg font-semibold ${stockCase.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPerformance()}
              </span>
            )}
          </div>

          {stockCase.entry_price && stockCase.target_price && (
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 space-y-1 lg:space-y-2">
              <div className="flex justify-between">
                <span>Inköp:</span>
                <span className="font-medium">{stockCase.entry_price} kr</span>
              </div>
              <div className="flex justify-between">
                <span>Mål:</span>
                <span className="font-medium">{stockCase.target_price} kr</span>
              </div>
            </div>
          )}

          {stockCase.description && (
            <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {stockCase.description}
            </p>
          )}
          
          <Button 
            onClick={() => onViewDetails(stockCase.id)}
            className="w-full mt-4 lg:mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white border-0 transition-all duration-200 transform group-hover:scale-105 lg:py-3 xl:py-4 lg:text-base xl:text-lg"
            variant="outline"
          >
            <Eye className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            Visa detaljer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCaseCard;
