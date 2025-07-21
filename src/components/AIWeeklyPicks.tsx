
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calendar, MessageCircle } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const AIWeeklyPicks = () => {
  const { latestCases, loading } = useLatestStockCases(6);
  const navigate = useNavigate();

  // Filter AI-generated cases (in the future this will be actual AI cases)
  const aiCases = latestCases.filter(stockCase => 
    stockCase.title?.includes('AI') || 
    stockCase.description?.includes('AI-genererad')
  ).slice(0, 3);

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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

  if (aiCases.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Kommer snart
          </Badge>
        </div>
        <Card className="text-center py-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="pt-4">
            <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <CardTitle className="text-lg mb-2">AI-Genererade Veckofall Kommer Snart</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Två gånger i veckan kommer AI att generera personaliserade investeringsmöjligheter baserat på marknadstrender.
            </p>
            <Button variant="outline" onClick={() => navigate('/stock-cases')}>
              Utforska Befintliga Fall
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <Calendar className="w-3 h-3 mr-1" />
            Uppdateras 2x/vecka
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiCases.map((stockCase) => (
          <Card key={stockCase.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Genererad
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
                
                {stockCase.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stockCase.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDiscussWithAI(stockCase)}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(stockCase.id)}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Visa detaljer
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Skapad {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIWeeklyPicks;
