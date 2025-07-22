import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calendar, MessageCircle, Clock, Target, BarChart3, Users } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
const AIWeeklyPicks = () => {
  const {
    latestCases,
    loading
  } = useLatestStockCases(6);
  const navigate = useNavigate();

  // Filter AI-generated cases (in the future this will be actual AI cases)
  const aiCases = latestCases.filter(stockCase => stockCase.title?.includes('AI') || stockCase.description?.includes('AI-genererad') || stockCase.ai_generated === true).slice(0, 3);
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
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };
  const handleGenerateAICases = () => {
    // Trigger the weekly cases generation function
    navigate('/ai-chat', {
      state: {
        initialMessage: 'Kan du hjälpa mig att generera AI-baserade investeringsmöjligheter baserat på aktuella marknadstrender?'
      }
    });
  };
  if (loading) {
    return <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse">
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
  if (aiCases.length === 0) {
    return <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <Clock className="w-3 h-3 mr-1" />
            Beta
          </Badge>
        </div>

        {/* Hero Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-green-900/20 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI-Driven Investeringsanalys
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Få personaliserade investeringsmöjligheter baserade på avancerad AI-analys av marknadstrender, sektorprestanda och din riskprofil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div className="text-sm">
                      <div className="font-semibold">Personaliserad</div>
                      <div className="text-muted-foreground">Anpassad för din profil</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <div className="text-sm">
                      <div className="font-semibold">Datadriven</div>
                      <div className="text-muted-foreground">Baserad på marknadsdata</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div className="text-sm">
                      <div className="font-semibold">Regelbundet</div>
                      <div className="text-muted-foreground">Uppdateras 2x/vecka</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleGenerateAICases} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Få AI-Rekommendationer Nu
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/stock-cases')}>
                    Utforska Befintliga Fall
                  </Button>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 to-blue-800 rounded-full flex items-center justify-center">
                    <Sparkles className="w-20 h-20 text-purple-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        

        {/* Timeline Section */}
        
      </div>;
  }
  return <div className="space-y-4">
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
        {aiCases.map(stockCase => <Card key={stockCase.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Genererad
                      </Badge>
                      {stockCase.case_categories && <Badge variant="secondary" className="text-xs">
                          {stockCase.case_categories.name}
                        </Badge>}
                    </div>
                    <h3 className="font-semibold line-clamp-2 text-sm mb-1">
                      {stockCase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stockCase.company_name}
                    </p>
                    {stockCase.sector && <Badge variant="outline" className="text-xs mb-2">
                        {stockCase.sector}
                      </Badge>}
                  </div>
                </div>
                
                {stockCase.description && <p className="text-xs text-muted-foreground line-clamp-2">
                    {stockCase.description}
                  </p>}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDiscussWithAI(stockCase)} className="text-purple-600 hover:text-purple-700 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera
                    </Button>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(stockCase.id)} className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Visa detaljer
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Skapad {formatDistanceToNow(new Date(stockCase.created_at), {
                addSuffix: true,
                locale: sv
              })}
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};
export default AIWeeklyPicks;