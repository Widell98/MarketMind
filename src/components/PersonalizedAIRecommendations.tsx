import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
const PersonalizedAIRecommendations = () => {
  const {
    user
  } = useAuth();
  const {
    latestCases,
    loading
  } = useLatestStockCases(4);
  const navigate = useNavigate();

  // In the future, this will use actual AI recommendations based on user portfolio
  // For now, we'll show latest cases with personalization context
  const personalizedCases = latestCases.slice(0, 4);
  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };
  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase,
      personalContext: true
    };
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };
  if (!user) {
    return null;
  }
  if (loading) {
    return <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Personaliserade AI-Rekommendationer</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return;
};
export default PersonalizedAIRecommendations;