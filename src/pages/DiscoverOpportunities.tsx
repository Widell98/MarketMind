
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Bookmark, Filter, BarChart3, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import PersonalizedAIRecommendations from '@/components/PersonalizedAIRecommendations';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import StockCaseCard from '@/components/StockCaseCard';
import LatestCases from '@/components/LatestCases';
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useAnalysesList } from '@/hooks/useAnalysesList';
import { useNavigate } from 'react-router-dom';

const DiscoverOpportunities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(12);
  const { data: allAnalyses, isLoading: analysesLoading } = useAnalysesList(20);

  const categories = [
    { id: 'all', name: 'Alla möjligheter', icon: Filter },
    { id: 'growth', name: 'Tillväxtmöjligheter', icon: TrendingUp },
    { id: 'dividend', name: 'Utdelningsmöjligheter', icon: Target },
    { id: 'value', name: 'Värdeinvesteringar', icon: BarChart3 },
    { id: 'trending', name: 'Trending nu', icon: Sparkles },
  ];

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
    navigate('/ai-chat', { state: { contextData } });
  };

  // Filter analyses by type for visual sections
  const trendingAnalyses = allAnalyses?.filter(analysis => 
    analysis.likes_count > 5 || analysis.views_count > 100
  ).slice(0, 6) || [];

  const latestAnalyses = allAnalyses?.filter(analysis => 
    analysis.analysis_type === 'market_insight'
  ).slice(0, 6) || [];

  const aiGeneratedAnalyses = allAnalyses?.filter(analysis => 
    analysis.ai_generated
  ).slice(0, 6) || [];

  // Mock data for saved opportunities
  const mockSavedOpportunities = [
    {
      id: '1',
      type: 'stock_case' as const,
      title: 'Tesla Long-term Growth Case',
      company_name: 'Tesla Inc.',
      description: 'Electric vehicle market leader with strong fundamentals',
      sector: 'Technology',
      performance_percentage: 15.2,
      created_at: '2024-01-15T10:00:00Z',
      ai_generated: false,
    },
    {
      id: '2',
      type: 'analysis' as const,
      title: 'Renewable Energy Sector Analysis',
      description: 'Deep dive into renewable energy investment opportunities',
      sector: 'Energy',
      created_at: '2024-01-10T14:30:00Z',
      ai_generated: true,
    },
  ];

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

  return (
    <Layout>
      <div className="space-y-8">
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
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Sparade</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Bläddra</span>
            </TabsTrigger>
          </TabsList>

          {/* Upptäck Tab */}
          <TabsContent value="discover" className="space-y-8">
            {user ? (
              <>
                {/* AI Weekly Picks */}
                <AIWeeklyPicks />

                {/* Personalized AI Recommendations */}
                <PersonalizedAIRecommendations />

                {/* Original Personalized Recommendations */}
                <PersonalizedRecommendations />

                {/* Trending Stock Cases - Using same style as LatestCases */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        Trending Aktiefall
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/stock-cases')}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Visa alla
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trendingCases.slice(0, 6).map((stockCase) => (
                        <TrendingStockCaseVisualCard key={stockCase.id} stockCase={stockCase} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Latest Analyses with Visual Cards */}
                {!analysesLoading && latestAnalyses.length > 0 && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-500" />
                          Senaste Marknadsinsikter
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate('/analysis')}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Visa alla
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {latestAnalyses.map((analysis) => (
                          <AnalysisVisualCard key={analysis.id} analysis={analysis} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Generated Analyses */}
                {!analysesLoading && aiGeneratedAnalyses.length > 0 && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          AI-Genererade Analyser
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate('/analysis')}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Visa alla
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiGeneratedAnalyses.map((analysis) => (
                          <AnalysisVisualCard key={analysis.id} analysis={analysis} showAIBadge={true} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="text-center py-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
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
              </Card>
            )}
          </TabsContent>

          {/* Sparade Tab */}
          <TabsContent value="saved" className="space-y-6">
            {user ? (
              <SavedOpportunitiesSection 
                opportunities={mockSavedOpportunities}
                onRemove={handleRemoveOpportunity}
                onView={handleViewOpportunity}
                loading={false}
              />
            ) : (
              <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
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
              </Card>
            )}
          </TabsContent>

          {/* Bläddra Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={categoryFilter === category.id ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
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
                {getFilteredCases().map((stockCase) => (
                  <StockCaseCard
                    key={stockCase.id}
                    stockCase={stockCase}
                    onViewDetails={handleViewStockCaseDetails}
                    onDelete={handleDeleteStockCase}
                  />
                ))}
              </div>
            </div>

            {/* All Analyses in Browse Tab */}
            {!analysesLoading && allAnalyses && allAnalyses.length > 0 && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader>
                  <CardTitle>Alla Analyser</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAnalyses.slice(0, 9).map((analysis) => (
                      <AnalysisVisualCard key={analysis.id} analysis={analysis} size="medium" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// New Visual Card for Trending Stock Cases (same style as LatestCases)
const TrendingStockCaseVisualCard = ({ stockCase }: { stockCase: any }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const getImageUrl = (stockCase: any) => {
    if (stockCase.image_url) {
      return stockCase.image_url;
    }
    // Fallback images based on category or company name
    const fallbackImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=200&fit=crop&crop=center'
    ];
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  };

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img 
          src={getImageUrl(stockCase)} 
          alt={stockCase.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
            TRENDING
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {stockCase.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {stockCase.company_name}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle discuss with AI
            }}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Diskutera
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Läs mer
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Visual Analysis Card (same style as stock case cards)
const AnalysisVisualCard = ({ analysis, showAIBadge = false, size = 'large' }: { 
  analysis: any; 
  showAIBadge?: boolean;
  size?: 'large' | 'medium';
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/analysis/${analysis.id}`);
  };

  const getPlaceholderImage = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'photo-1461749280684-dccba630e2f6'; // Java programming monitor
      case 'technical_analysis':
        return 'photo-1487058792275-0ad4aaf24ca7'; // Colorful code on monitor
      case 'fundamental_analysis':
        return 'photo-1485827404703-89b55fcc595e'; // White robot
      case 'sector_analysis':
        return 'photo-1497604401993-f2e922e5cb0a'; // Glass building
      default:
        return 'photo-1526374965328-7f61d4dc18c5'; // Matrix style
    }
  };

  const cardHeight = size === 'large' ? 'h-80' : 'h-64';
  const imageHeight = size === 'large' ? 'h-48' : 'h-40';

  return (
    <Card 
      className={`${cardHeight} border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden`}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className={`${imageHeight} relative bg-gray-100 dark:bg-gray-800 overflow-hidden`}>
        <img 
          src={`https://images.unsplash.com/${getPlaceholderImage(analysis.analysis_type)}?auto=format&fit=crop&w=800&q=80`}
          alt={analysis.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="text-xs font-medium text-white bg-black/50 border-white/20 backdrop-blur-sm">
            ANALYS
          </Badge>
        </div>
        {showAIBadge && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-600 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {analysis.title}
          </h3>
          {analysis.profiles && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              av {analysis.profiles.display_name || analysis.profiles.username}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle discuss with AI
            }}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Diskutera
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Läs mer
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DiscoverOpportunities;
