
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';

const PersonalizedAIRecommendations = () => {
  const { user } = useAuth();
  const { latestCases, loading } = useLatestStockCases(4);
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
    navigate('/ai-chat', { state: { contextData } });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Personaliserade AI-Rekommendationer</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Personaliserade AI-Rekommendationer</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <User className="w-3 h-3 mr-1" />
            Anpassad för dig
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalizedCases.map((stockCase, index) => (
          <Card key={stockCase.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Target className="w-3 h-3 mr-1" />
                        {index === 0 ? 'Hög matchning' : 
                         index === 1 ? 'Bra passform' : 
                         index === 2 ? 'Intressant' : 'Värt att överväga'}
                      </Badge>
                      {stockCase.case_categories && (
                        <Badge variant="secondary" className="text-xs">
                          {stockCase.case_categories.name}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-2 text-sm mb-1">
                      {stockCase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stockCase.company_name}
                    </p>
                    {stockCase.sector && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {stockCase.sector}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <strong>AI-Insikt:</strong> {
                    index === 0 ? 'Passar din riskprofil och sektorpreferenser perfekt' :
                    index === 1 ? 'Kompletterande tillgång för din portfölj' :
                    index === 2 ? 'Ny sektorexponering med god potential' :
                    'Diversifieringsmöjlighet inom din komfortzon'
                  }
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDiscussWithAI(stockCase)}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Diskutera passform
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(stockCase.id)}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Se analys
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedAIRecommendations;
