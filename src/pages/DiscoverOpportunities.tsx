
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Bookmark, Share2, Search, Filter, TrendingUp, BarChart3, Calendar, Eye } from 'lucide-react';
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

  const StockCaseFeedCard = ({ stockCase }: { stockCase: any }) => {
    const { likeCount, isLiked, toggleLike, loading: likeLoading } = useStockCaseLikes(stockCase.id);
    const { followCount, isFollowing, toggleFollow, loading: followLoading } = useStockCaseFollows(stockCase.id);

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <div 
          className="relative aspect-[16/10] cursor-pointer group"
          onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
        >
          <img
            src={stockCase.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop'}
            alt={stockCase.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Status badge */}
          <div className="absolute top-4 left-4">
            <Badge 
              className={`${
                stockCase.status === 'active' 
                  ? 'bg-green-500/90 text-white' 
                  : 'bg-gray-500/90 text-white'
              } backdrop-blur-sm`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {stockCase.status === 'active' ? 'Aktiv' : 'Stängd'}
            </Badge>
          </div>

          {/* Company info overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-xl font-bold mb-1">{stockCase.company_name}</h3>
            <p className="text-white/90 text-sm line-clamp-2">{stockCase.title}</p>
            {stockCase.sector && (
              <Badge variant="secondary" className="mt-2 bg-white/20 text-white backdrop-blur-sm">
                {stockCase.sector}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Metrics row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {stockCase.entry_price && (
                <span>Ingång: {stockCase.entry_price} kr</span>
              )}
              {stockCase.target_price && (
                <span>Mål: {stockCase.target_price} kr</span>
              )}
            </div>
            {stockCase.performance_percentage && (
              <Badge variant={stockCase.performance_percentage >= 0 ? "default" : "destructive"}>
                {stockCase.performance_percentage > 0 ? '+' : ''}{stockCase.performance_percentage.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                disabled={likeLoading}
                className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
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
                className="flex items-center gap-1 text-sm hover:text-blue-500 transition-colors"
              >
                <Eye className={`h-4 w-4 ${isFollowing ? 'fill-current text-blue-500' : ''}`} />
                <span>{followCount}</span>
              </button>

              <button className="flex items-center gap-1 text-sm hover:text-gray-700 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>0</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="hover:text-blue-500 transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="hover:text-blue-500 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
            <Calendar className="h-3 w-3" />
            <span>{new Date(stockCase.created_at).toLocaleDateString('sv-SE')}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AnalysisFeedCard = ({ analysis }: { analysis: any }) => {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <div 
          className="relative aspect-[16/10] cursor-pointer group"
          onClick={() => navigate(`/analysis/${analysis.id}`)}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <div className="text-center text-white p-6">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-bold mb-2">{analysis.title}</h3>
              <p className="text-sm opacity-90 line-clamp-3">{analysis.content?.substring(0, 150)}...</p>
            </div>
          </div>
          
          {/* Type badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analys
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{analysis.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{analysis.comments_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{analysis.views_count || 0}</span>
            </div>
          </div>

          {/* Tags */}
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {analysis.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(analysis.created_at).toLocaleDateString('sv-SE')}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="hover:text-blue-500 transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="hover:text-blue-500 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
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
                      <StockCaseFeedCard stockCase={item} />
                    ) : (
                      <AnalysisFeedCard analysis={item} />
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="cases" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStockCases.map((stockCase) => (
                <StockCaseFeedCard key={stockCase.id} stockCase={stockCase} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analyses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnalyses.map((analysis) => (
                <AnalysisFeedCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DiscoverOpportunities;
