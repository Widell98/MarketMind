
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Bookmark, Share2, Search, Filter, TrendingUp, BarChart3, Calendar, Eye, Activity, Brain, Target, Building } from 'lucide-react';
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useNavigate } from 'react-router-dom';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useStockCaseFollows } from '@/hooks/useStockCaseFollows';

const DiscoverOpportunities = () => {
  const navigate = useNavigate();
  const { stockCases, loading: stockCasesLoading } = useStockCases();
  const { data: analyses, isLoading: analysesLoading } = useAnalyses(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Filter and search logic
  const filteredStockCases = stockCases.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sector?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAnalyses = (analyses || []).filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAnalysisIcon = (analysisType: string) => {
    switch (analysisType) {
      case 'market_insight':
        return <Activity className="h-8 w-8" />;
      case 'technical_analysis':
        return <BarChart3 className="h-8 w-8" />;
      case 'fundamental_analysis':
        return <Brain className="h-8 w-8" />;
      case 'sector_analysis':
        return <Building className="h-8 w-8" />;
      case 'portfolio_analysis':
        return <Target className="h-8 w-8" />;
      default:
        return <BarChart3 className="h-8 w-8" />;
    }
  };

  const getAnalysisColor = (analysisType: string) => {
    switch (analysisType) {
      case 'market_insight':
        return 'from-blue-500 to-blue-600';
      case 'technical_analysis':
        return 'from-green-500 to-green-600';
      case 'fundamental_analysis':
        return 'from-purple-500 to-purple-600';
      case 'sector_analysis':
        return 'from-orange-500 to-orange-600';
      case 'portfolio_analysis':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const StockCaseCard = ({ stockCase }: { stockCase: any }) => {
    const { likeCount, isLiked, toggleLike, loading: likeLoading } = useStockCaseLikes(stockCase.id);
    const { followCount, isFollowing, toggleFollow, loading: followLoading } = useStockCaseFollows(stockCase.id);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={stockCase.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop'}
            alt={stockCase.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge variant={stockCase.status === 'active' ? 'default' : 'secondary'}>
              {stockCase.status}
            </Badge>
          </div>
        </div>
        
        <CardHeader>
          <CardTitle className="text-lg">{stockCase.company_name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{stockCase.title}</p>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Ingång: {stockCase.entry_price}kr</span>
              <span>Mål: {stockCase.target_price}kr</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                disabled={likeLoading}
                className="flex items-center space-x-1 hover:text-red-500"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                <span>{likeCount}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow();
                }}
                disabled={followLoading}
                className="flex items-center space-x-1 hover:text-blue-500"
              >
                <Eye className={`h-4 w-4 ${isFollowing ? 'fill-current text-blue-500' : ''}`} />
                <span>{followCount}</span>
              </button>

              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>0</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4 cursor-pointer hover:text-blue-500" />
              <Share2 className="h-4 w-4 cursor-pointer hover:text-blue-500" />
            </div>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
          </div>
        </CardContent>
      </Card>
    );
  };

  const AnalysisCard = ({ analysis }: { analysis: any }) => {
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/analysis/${analysis.id}`)}
      >
        <div className={`h-48 bg-gradient-to-br ${getAnalysisColor(analysis.analysis_type)} flex items-center justify-center relative`}>
          <div className="text-white text-center">
            {getAnalysisIcon(analysis.analysis_type)}
            <div className="mt-2 text-sm font-medium">
              {analysis.analysis_type.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/20 text-white">
              Analys
            </Badge>
          </div>
        </div>
        
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2">{analysis.title}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {analysis.content?.substring(0, 100)}...
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{analysis.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{analysis.comments_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{analysis.views_count || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
            </div>
            
            <div className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4 cursor-pointer hover:text-blue-500" />
              <Share2 className="h-4 w-4 cursor-pointer hover:text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-finance-navy dark:text-gray-200 mb-2">
            Upptäck Möjligheter
          </h1>
          <p className="text-muted-foreground">
            Utforska aktiecases och analyser från vår community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök efter företag, sektorer eller nyckelord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Alla</TabsTrigger>
            <TabsTrigger value="cases">Aktiecases</TabsTrigger>
            <TabsTrigger value="analyses">Analyser</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mix stock cases and analyses */}
              {[...filteredStockCases.slice(0, 6), ...filteredAnalyses.slice(0, 6)]
                .sort(() => Math.random() - 0.5)
                .map((item, index) => (
                  <div key={`mixed-${index}`}>
                    {'company_name' in item ? (
                      <StockCaseCard stockCase={item} />
                    ) : (
                      <AnalysisCard analysis={item} />
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="cases" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStockCases.map((stockCase) => (
                <StockCaseCard key={stockCase.id} stockCase={stockCase} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analyses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnalyses.map((analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DiscoverOpportunities;
