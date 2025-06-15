
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Heart } from 'lucide-react';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const TrendingCases = () => {
  const { trendingCases, loading } = useTrendingStockCases(6);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            No trending cases yet. Be the first to like a case!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Cases
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/stock-cases')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingCases.map((stockCase, index) => (
            <div
              key={stockCase.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
              onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
            >
              {/* Ranking Badge - Smaller and more elegant */}
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                  {index + 1}
                </div>
              </div>

              {/* Company Image - Larger and more prominent */}
              <div className="flex-shrink-0">
                {stockCase.image_url ? (
                  <img
                    src={stockCase.image_url}
                    alt={stockCase.company_name}
                    className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                  {stockCase.company_name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                  {stockCase.title}
                </p>
                
                <div className="flex items-center gap-2">
                  {stockCase.case_categories && (
                    <Badge 
                      className="text-xs px-2 py-0.5"
                      style={{ 
                        backgroundColor: `${stockCase.case_categories.color}15`,
                        color: stockCase.case_categories.color,
                        border: `1px solid ${stockCase.case_categories.color}30`
                      }}
                    >
                      {stockCase.case_categories.name}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    <span>{(stockCase as any).likeCount || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Performance */}
              {stockCase.performance_percentage !== null && (
                <div className="flex-shrink-0 text-right">
                  <span className={`text-sm font-semibold ${
                    stockCase.performance_percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stockCase.performance_percentage > 0 ? '+' : ''}
                    {stockCase.performance_percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingCases;
