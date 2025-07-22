
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Bookmark, MessageCircle, Share, Eye, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';

interface InstagramStockCaseCardProps {
  stockCase: any;
  onViewDetails: (id: string) => void;
}

const InstagramStockCaseCard = ({ stockCase, onViewDetails }: InstagramStockCaseCardProps) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const [isDoubleTapped, setIsDoubleTapped] = useState(false);
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    if (!isLiked) {
      toggleLike();
      setIsDoubleTapped(true);
      setTimeout(() => setIsDoubleTapped(false), 1000);
    }
  };

  const handleCardClick = () => {
    onViewDetails(stockCase.id);
  };

  const getImageUrl = (stockCase: any) => {
    if (stockCase.image_url) {
      return stockCase.image_url;
    }
    const fallbackImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
    ];
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  };

  const getStatusBadge = (status: string, performance: number | null) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{performance || 0}%
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-500/90 text-white border-0 backdrop-blur-sm">
          {performance || 0}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/90 text-white border-0 backdrop-blur-sm">
        Active
      </Badge>
    );
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900 max-w-sm mx-auto">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {stockCase.profiles?.display_name?.[0] || stockCase.profiles?.username?.[0] || 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
        </div>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden group"
        onDoubleClick={handleDoubleClick}
        onClick={handleCardClick}
      >
        <img 
          src={getImageUrl(stockCase)} 
          alt={stockCase.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Double tap heart animation */}
        {isDoubleTapped && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-16 h-16 text-red-500 fill-current animate-ping" />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
            {stockCase.case_categories?.name || 'STOCK CASE'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Engagement actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className={`transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to comments or open comment modal
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share functionality
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-green-500 transition-colors"
            >
              <Share className="w-6 h-6" />
            </button>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Save/bookmark functionality
            }}
            className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 transition-colors"
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {likeCount} gillningar
        </div>

        {/* Title and description */}
        <div className="space-y-1">
          <div className="flex items-start space-x-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {stockCase.company_name}
            </span>
            <span className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
              {stockCase.title}
            </span>
          </div>
        </div>

        {/* Price info */}
        {stockCase.entry_price && (
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Entry: {stockCase.entry_price} kr</span>
            {stockCase.current_price && (
              <span>Current: {stockCase.current_price} kr</span>
            )}
            {stockCase.target_price && (
              <span>Target: {stockCase.target_price} kr</span>
            )}
          </div>
        )}

        {/* View details button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCardClick}
          className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Visa detaljer
        </Button>
      </CardContent>
    </Card>
  );
};

export default InstagramStockCaseCard;
