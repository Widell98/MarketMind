
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Heart, Clock } from 'lucide-react';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const TrendingCasesGrid = () => {
  const { trendingCases, loading } = useTrendingStockCases(6);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending Cases
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (trendingCases.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending Cases
          </h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No trending cases yet. Be the first to like a case!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Trending Cases
        </h2>
        <Button 
          variant="ghost"
          onClick={() => navigate('/stock-cases')}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All Cases
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingCases.map((stockCase, index) => (
          <Card
            key={stockCase.id}
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-orange-200 dark:hover:border-orange-800"
            onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    <span>{(stockCase as any).likeCount || 0}</span>
                  </div>
                </div>
                {stockCase.performance_percentage !== null && (
                  <span className={`text-lg font-bold ${
                    stockCase.performance_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stockCase.performance_percentage > 0 ? '+' : ''}
                    {stockCase.performance_percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              
              <CardTitle className="text-xl group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {stockCase.company_name}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {stockCase.title}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrendingCasesGrid;
