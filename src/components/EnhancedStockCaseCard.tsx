import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, 
  Bookmark, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  MoreHorizontal, 
  Trash2, 
  Bot, 
  UserCircle, 
  MessageCircle, 
  Edit,
  Plus,
  PieChart
} from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';
import { useNavigate } from 'react-router-dom';
import SaveOpportunityButton from './SaveOpportunityButton';
import ShareStockCase from './ShareStockCase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EnhancedStockCaseCardProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (stockCase: any) => void;
  showProfileActions?: boolean;
}

const EnhancedStockCaseCard: React.FC<EnhancedStockCaseCardProps> = ({
  stockCase,
  onViewDetails,
  onDelete
}) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, toggleFollow } = useStockCaseFollows(stockCase.id);
  const navigate = useNavigate();
  
  const isOwner = user && stockCase.user_id === user.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'paused':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-emerald-600 dark:text-emerald-400';
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

  const calculatePerformance = () => {
    if (stockCase.entry_price && stockCase.current_price) {
      return (stockCase.current_price - stockCase.entry_price) / stockCase.entry_price * 100;
    }
    return stockCase.performance_percentage || 0;
  };

  const handleAddToPortfolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/portfolio-implementation', { 
      state: { 
        suggestedStock: {
          symbol: stockCase.company_name,
          name: stockCase.title,
          price: stockCase.current_price || stockCase.entry_price,
          sector: stockCase.sector
        }
      }
    });
  };

  const performance = calculatePerformance();
  const authorName = stockCase.profiles?.display_name || stockCase.profiles?.username || 'Expert';

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-cyan-950/30 hover:scale-[1.02] cursor-pointer">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-3 border-b border-blue-100 dark:border-blue-900/30">
        {/* Author Profile Section */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-blue-200 dark:ring-blue-800">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold text-sm">
              {stockCase.ai_generated ? <Bot className="w-5 h-5" /> : authorName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-blue-900 dark:text-blue-100 truncate">
              {stockCase.ai_generated ? 'AI Assistant' : authorName}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(stockCase.created_at)}
            </p>
          </div>
          
          {/* Actions Menu */}
          {(isAdmin || user && onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={e => {
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

        {/* Status and Category Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`text-xs px-2 py-1 ${getStatusColor(stockCase.status || 'active')}`}>
            {stockCase.status || 'active'}
          </Badge>
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
            {stockCase.case_categories?.name || stockCase.sector || 'General'}
          </Badge>
          
          {isOwner && (
            <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
              Ditt Case
            </Badge>
          )}
          
          {stockCase.ai_generated && (
            <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
              <Bot className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
        </div>

        <CardTitle 
          className="text-lg font-bold leading-tight text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-2 cursor-pointer"
          onClick={() => onViewDetails(stockCase.id)}
        >
          {stockCase.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative p-4 space-y-4" onClick={() => onViewDetails(stockCase.id)}>
        {/* Stock Chart/Image */}
        {stockCase.image_url && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 ring-1 ring-blue-200 dark:ring-blue-800">
            <img 
              src={stockCase.image_url} 
              alt={`${stockCase.company_name} analysis chart`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {stockCase.description}
        </p>

        {/* Performance Indicator */}
        {performance !== 0 && (
          <div className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r ${
            performance > 0 
              ? 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800' 
              : 'from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-200 dark:border-red-800'
          }`}>
            {performance > 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
            <span className={`font-semibold text-sm ${getPerformanceColor(performance)}`}>
              {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      <div className="relative p-4 pt-0 border-t border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <div className="grid grid-cols-3 gap-2">
          {/* Like Button */}
          <Button
            size="sm"
            variant={isLiked ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className={`flex items-center justify-center gap-2 transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25' 
                : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{likeCount}</span>
          </Button>

          {/* Add to Portfolio */}
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToPortfolio}
              className="flex items-center justify-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-all duration-200"
            >
              <PieChart className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Portfölj</span>
            </Button>
          )}

          {/* Save Case */}
          <div className="flex justify-center">
            <SaveOpportunityButton 
              opportunityId={stockCase.id} 
              className="flex items-center justify-center gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30" 
            />
          </div>
        </div>

        {/* Share Button - Full Width */}
        <div className="mt-3">
          <ShareStockCase 
            stockCaseId={stockCase.id} 
            title={stockCase.title}
          />
        </div>
      </div>
    </Card>
  );
};

export default EnhancedStockCaseCard;