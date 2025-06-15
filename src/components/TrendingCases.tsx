
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
        <div className="space-y-4">
          {trendingCases.map((stockCase, index) => (
            <div
              key={stockCase.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {stockCase.company_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {stockCase.title}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
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
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    <span>{(stockCase as any).likeCount || 0}</span>
                  </div>
                </div>
              </div>
              
              {stockCase.performance_percentage !== null && (
                <div className="flex-shrink-0">
                  <span className={`text-sm font-semibold ${
                    stockCase.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'
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
