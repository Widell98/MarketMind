import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Bookmark, Filter, BarChart3, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import PersonalizedAIRecommendations from '@/components/PersonalizedAIRecommendations';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import StockCaseCard from '@/components/StockCaseCard';
import AnalysisSection from '@/components/AnalysisSection';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
const DiscoverOpportunities = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const {
    stockCases: allStockCases,
    loading: allLoading
  } = useStockCases(false);
  const {
    trendingCases,
    loading: trendingLoading
  } = useTrendingStockCases(12);
  const categories = [{
    id: 'all',
    name: 'Alla möjligheter',
    icon: Filter
  }, {
    id: 'growth',
    name: 'Tillväxtmöjligheter',
    icon: TrendingUp
  }, {
    id: 'dividend',
    name: 'Utdelningsmöjligheter',
    icon: Target
  }, {
    id: 'value',
    name: 'Värdeinvesteringar',
    icon: BarChart3
  }, {
    id: 'trending',
    name: 'Trending nu',
    icon: Sparkles
  }];
  const getFilteredCases = () => {
    if (categoryFilter === 'trending') return trendingCases;
    if (categoryFilter === 'all') return allStockCases;
    return allStockCases.filter(stockCase => {
      switch (categoryFilter) {
        case 'growth':
          return stockCase.sector === 'Technology' || stockCase.sector === 'Healthcare';
        case 'dividend':
          return stockCase.dividend_yield && parseFloat(stockCase.dividend_yield) > 3;
        case 'value':
          return stockCase.pe_ratio && parseFloat(stockCase.pe_ratio) < 15;
        default:
          return true;
      }
    });
  };
  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };
  const handleDeleteStockCase = async (id: string) => {
    // Implementation for delete
  };
  const handleDiscussWithAI = (item: any, type: 'stock_case' | 'analysis') => {
    const contextData = {
      type,
      id: item.id,
      title: item.title || item.company_name,
      data: item
    };
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };

  // Mock data for saved opportunities
  const mockSavedOpportunities = [{
    id: '1',
    type: 'stock_case' as const,
    title: 'Tesla Long-term Growth Case',
    company_name: 'Tesla Inc.',
    description: 'Electric vehicle market leader with strong fundamentals',
    sector: 'Technology',
    performance_percentage: 15.2,
    created_at: '2024-01-15T10:00:00Z',
    ai_generated: false
  }, {
    id: '2',
    type: 'analysis' as const,
    title: 'Renewable Energy Sector Analysis',
    description: 'Deep dive into renewable energy investment opportunities',
    sector: 'Energy',
    created_at: '2024-01-10T14:30:00Z',
    ai_generated: true
  }];
  const handleRemoveOpportunity = (id: string) => {
    console.log('Removing opportunity:', id);
  };
  const handleViewOpportunity = (opportunity: any) => {
    if (opportunity.type === 'stock_case') {
      navigate(`/stock-cases/${opportunity.id}`);
    } else if (opportunity.type === 'analysis') {
      navigate(`/analysis/${opportunity.id}`);
    }
  };
  return <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Upptäck Nya Möjligheter
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            AI-driven investeringsmöjligheter baserat på din portfölj och marknadstrender
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Upptäck</span>
            </TabsTrigger>
            
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Bläddra</span>
            </TabsTrigger>
          </TabsList>

          {/* Upptäck Tab */}
          <TabsContent value="discover" className="space-y-8">
            {user ? <>
                {/* AI Weekly Picks - New Section */}
                <AIWeeklyPicks />

                {/* Personalized AI Recommendations */}
                <PersonalizedAIRecommendations />

                {/* Original Personalized Recommendations */}
                <PersonalizedRecommendations />

                {/* Trending sektion */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-bold">Trending Just Nu</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingCases.slice(0, 6).map(stockCase => <Card key={stockCase.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold line-clamp-2 text-base">
                                  {stockCase.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {stockCase.company_name}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                Trending
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <Button variant="ghost" size="sm" onClick={() => handleDiscussWithAI(stockCase, 'stock_case')} className="text-purple-600 hover:text-purple-700">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Diskutera med AI
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => handleViewStockCaseDetails(stockCase.id)}>
                                Läs mer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>
                </div>
              </> : <Card className="text-center py-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <CardContent className="pt-4">
                  <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <CardTitle className="text-xl mb-2">Få AI-Powered Rekommendationer</CardTitle>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Logga in för att få skräddarsydda investeringsmöjligheter med AI-analys baserat på din portfölj och marknadstrender.
                  </p>
                  <Button onClick={() => navigate('/auth')} className="bg-purple-600 hover:bg-purple-700">
                    Logga in för AI-rekommendationer
                  </Button>
                </CardContent>
              </Card>}
          </TabsContent>

          {/* Sparade Tab */}
          <TabsContent value="saved" className="space-y-6">
            {user ? <SavedOpportunitiesSection opportunities={mockSavedOpportunities} onRemove={handleRemoveOpportunity} onView={handleViewOpportunity} loading={false} /> : <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
                <CardContent className="pt-4">
                  <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <CardTitle className="text-lg mb-2">Logga in för att spara möjligheter</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">
                    Skapa ett konto för att spara intressanta aktiefall och analyser.
                  </p>
                  <Button onClick={() => navigate('/auth')} variant="outline">
                    Logga in
                  </Button>
                </CardContent>
              </Card>}
          </TabsContent>

          {/* Bläddra Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(category => {
              const Icon = category.icon;
              return <Button key={category.id} variant={categoryFilter === category.id ? 'default' : 'outline'} onClick={() => setCategoryFilter(category.id)} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>;
            })}
            </div>

            {/* Filtered Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {categories.find(c => c.id === categoryFilter)?.name || 'Alla möjligheter'}
                </h2>
                <Badge variant="secondary">
                  {getFilteredCases().length} möjligheter
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredCases().map(stockCase => <StockCaseCard key={stockCase.id} stockCase={stockCase} onViewDetails={handleViewStockCaseDetails} onDelete={handleDeleteStockCase} />)}
              </div>
            </div>

            {/* Analyser sektion */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold">Senaste Analyser</h2>
              </div>
              <AnalysisSection limit={6} showHeader={false} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
};
export default DiscoverOpportunities;