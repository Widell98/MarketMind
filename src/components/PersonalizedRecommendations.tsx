
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { usePersonalizedRecommendations } from '@/hooks/usePersonalizedRecommendations';
import { useNavigate } from 'react-router-dom';

const PersonalizedRecommendations = () => {
  const { recommendations, loading } = usePersonalizedRecommendations();
  const navigate = useNavigate();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'portfolio_complement':
        return <Target className="w-4 h-4" />;
      case 'sector_match':
        return <BarChart3 className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'portfolio_complement':
        return 'Portföljkomplement';
      case 'sector_match':
        return 'Sektormatch';
      case 'trending':
        return 'Trending';
      default:
        return 'Rekommenderad';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'portfolio_complement':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'sector_match':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'trending':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    }
  };

  const handleItemClick = (rec: any) => {
    if (rec.type === 'stock_case') {
      navigate(`/stock-cases/${rec.item.id}`);
    } else {
      navigate(`/analysis/${rec.item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold">Personliga Rekommendationer</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card 
            key={rec.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 shadow-sm"
            onClick={() => handleItemClick(rec)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium mb-2 ${getCategoryColor(rec.category)}`}
                  >
                    {getCategoryIcon(rec.category)}
                    <span className="ml-1">{getCategoryLabel(rec.category)}</span>
                  </Badge>
                  <CardTitle className="text-base line-clamp-2">
                    {rec.item.title || rec.item.company_name}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {rec.reason}
              </p>
              
              {rec.item.company_name && rec.type === 'stock_case' && (
                <p className="text-xs text-muted-foreground mb-2">
                  {rec.item.company_name}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Konfidensgrad:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full mr-1 ${
                          i < Math.round(rec.confidence * 5) 
                            ? 'bg-yellow-400' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="text-xs">
                  Utforska
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
