
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Clock, UserPlus, UserCheck, Trash2 } from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface StockCaseListItemProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
}

const StockCaseListItem: React.FC<StockCaseListItemProps> = ({ stockCase, onViewDetails, onDelete }) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { isFollowing, loading: followLoading, toggleFollow } = useStockCaseFollows(stockCase.id);

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

  const displayImageSrc = stockCase.image_url ?? null;

  return (
    <div className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800 cursor-pointer" onClick={() => onViewDetails(stockCase.id)}>
      <div className="flex items-center gap-4">
        {/* Image */}
        {displayImageSrc && (
          <div className="flex-shrink-0">
            <img
              src={displayImageSrc}
              alt={stockCase.company_name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {stockCase.title}
                </h3>
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <Badge className={`text-xs ${getStatusColor()}`}>
                    {stockCase.status === 'active' ? 'Active' : stockCase.status === 'winner' ? 'Winner' : 'Loser'}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                {stockCase.company_name}
              </p>

              {stockCase.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 mb-2">
                  {stockCase.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getUserDisplayName()}</span>
                </div>

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

                {stockCase.entry_price && stockCase.target_price && !stockCase.ai_generated && (
                  <span>Entry: {stockCase.entry_price} kr | Target: {stockCase.target_price} kr</span>
                )}
              </div>
            </div>

            {/* Performance */}
            {stockCase.performance_percentage !== null && (
              <div className="flex-shrink-0 text-right">
                <span className={`text-lg font-semibold ${stockCase.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPerformance()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Follow Button - Only show for logged in users */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow();
              }}
              disabled={followLoading}
              className="flex items-center gap-1 p-2"
              title={isFollowing ? "Sluta följa" : "Följ case"}
            >
              {isFollowing ? (
                <UserCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <UserPlus className="w-4 h-4 text-gray-400 hover:text-blue-500" />
              )}
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              title={isAdmin && !isOwner ? "Delete as admin" : "Delete your case"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockCaseListItem;
