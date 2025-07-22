import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { usePersonalizedRecommendations } from '@/hooks/usePersonalizedRecommendations';
import { useNavigate } from 'react-router-dom';
const PersonalizedRecommendations = () => {
  const {
    recommendations,
    loading
  } = usePersonalizedRecommendations();
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
    return <div className="space-y-4">
        {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return;
};
export default PersonalizedRecommendations;