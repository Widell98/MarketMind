
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, TrendingUp, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';

interface EnhancedStockCaseCardProps {
  stockCase: any;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  showAIActions?: boolean;
}

const EnhancedStockCaseCard = ({ 
  stockCase, 
  onViewDetails, 
  onDelete,
  showAIActions = true 
}: EnhancedStockCaseCardProps) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const navigate = useNavigate();

  const handleCardClick = () => {
    onViewDetails(stockCase.id);
  };

  const handleDiscussWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      company: stockCase.company_name,
      data: stockCase
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleAddToPortfolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/portfolio-implementation', { 
      state: { 
        suggestion: {
          symbol: stockCase.company_name,
          name: stockCase.title,
          type: 'stock',
          reason: `Baserat på aktiefall: ${stockCase.title}`
        }
      }
    });
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
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Winner {performance ? `+${performance}%` : ''}
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Loser {performance ? `${performance}%` : ''}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        Active
      </Badge>
    );
  };

  const getImageUrl = (stockCase: any) => {
    if (stockCase.image_url) {
      return stockCase.image_url;
    }
    const fallbackImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center',
    ];
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  };

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img 
          src={getImageUrl(stockCase)} 
          alt={stockCase.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
            STOCK CASE
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getCategoryColor(stockCase.case_categories?.name || 'Tech')}`}></div>
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
            {stockCase.case_categories?.name || 'Tech'}
          </span>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {stockCase.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
      </CardHeader>

      <CardContent className="pt-0">
        {/* Price Information */}
        {stockCase.entry_price && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entry</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stockCase.entry_price} kr
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {stockCase.current_price || stockCase.entry_price} kr
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {stockCase.target_price || 'TBD'}
              </p>
            </div>
          </div>
        )}

        {/* AI Actions Section */}
        {showAIActions && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscussWithAI}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Diskutera med AI
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToPortfolio}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Lägg till i portfölj
              </Button>
            </div>
          </div>
        )}

        {/* Engagement Stats and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>0</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className={`flex items-center gap-1 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SaveOpportunityButton 
              itemType="stock_case" 
              itemId={stockCase.id}
              itemTitle={stockCase.title}
              variant="ghost"
              size="sm"
              showText={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStockCaseCard;
