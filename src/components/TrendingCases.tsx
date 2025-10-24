
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Heart } from 'lucide-react';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { getOptimizedCaseImage } from '@/utils/imageUtils';

const TrendingCases = () => {
  const { trendingCases, loading } = useTrendingStockCases(6);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingCases.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 hover:shadow-xl transition-shadow duration-300">
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
          {trendingCases.map((stockCase, index) => {
            const optimizedSources = getOptimizedCaseImage(stockCase.image_url);

            return (
              <div
                key={stockCase.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md group"
                onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
              >
              {/* Ranking Badge - Enhanced */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                  {index + 1}
                </div>
              </div>

              {/* Company Image - Enhanced */}
              <div className="flex-shrink-0">
                {stockCase.image_url ? (
                  <img
                    src={optimizedSources?.src ?? stockCase.image_url}
                    srcSet={optimizedSources?.srcSet}
                    alt={stockCase.company_name}
                    className="w-20 h-20 rounded-xl object-cover shadow-md border border-gray-200 dark:border-gray-700 group-hover:shadow-lg transition-shadow"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-md group-hover:shadow-lg transition-shadow">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Content - Enhanced */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {stockCase.company_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">
                  {stockCase.title}
                </p>
                
                <div className="flex items-center gap-3">
                  {stockCase.case_categories && (
                    <Badge 
                      className="text-xs px-3 py-1"
                      style={{ 
                        backgroundColor: `${stockCase.case_categories.color}15`,
                        color: stockCase.case_categories.color,
                        border: `1px solid ${stockCase.case_categories.color}30`
                      }}
                    >
                      {stockCase.case_categories.name}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <Heart className="w-3 h-3 fill-current" />
                    <span className="font-medium">{(stockCase as any).likeCount || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Performance - Enhanced */}
              {stockCase.performance_percentage !== null && (
                <div className="flex-shrink-0 text-right">
                  <span className={`text-lg font-bold ${
                    stockCase.performance_percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stockCase.performance_percentage > 0 ? '+' : ''}
                    {stockCase.performance_percentage.toFixed(1)}%
                  </span>
                </div>
              )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingCases;
