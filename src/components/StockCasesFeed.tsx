
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';

const StockCasesFeed = () => {
  const { latestCases, loading } = useLatestStockCases(6);
  const navigate = useNavigate();

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
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
          <TrendingDown className="w-3 h-3 mr-1" />
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

  const getImageUrl = (stockCase: any) => {
    if (stockCase.image_url) {
      return stockCase.image_url;
    }
    // Fallback images based on category or company name
    const fallbackImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=200&fit=crop&crop=center'
    ];
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="border-0 shadow-sm animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (latestCases.length === 0) {
    return (
      <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
        <CardContent className="pt-4">
          <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Inga cases än
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Investment cases kommer att visas här när de läggs till av våra experter.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/stock-cases')}>
            Utforska alla cases
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {latestCases.map((stockCase) => (
        <Card key={stockCase.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden">
          {/* Image */}
          <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <img 
              src={getImageUrl(stockCase)} 
              alt={stockCase.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
                {stockCase.case_type?.toUpperCase() || 'STOCK CASE'}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              {getStatusBadge(stockCase.status, stockCase.performance)}
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getCategoryColor(stockCase.case_categories?.name || 'Tech')}`}></div>
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                {stockCase.case_categories?.name || 'Tech'}
              </span>
            </div>
          </div>

          <CardHeader className="pb-3">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {stockCase.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {stockCase.company}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
              </span>
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

            {/* Engagement Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{stockCase.views || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{stockCase.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>0</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => handleViewDetails(stockCase.id)}
              >
                Läs mer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StockCasesFeed;
