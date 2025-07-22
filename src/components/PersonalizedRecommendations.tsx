
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, MessageCircle, Heart, Bookmark, User, Eye, BarChart3 } from 'lucide-react';
import { usePersonalizedRecommendations } from '@/hooks/usePersonalizedRecommendations';
import { useNavigate } from 'react-router-dom';

const PersonalizedRecommendations = () => {
  const { recommendations, loading } = usePersonalizedRecommendations();
  const navigate = useNavigate();

  const handleViewDetails = (recommendation: any) => {
    if (recommendation.type === 'stock_case') {
      navigate(`/stock-cases/${recommendation.item.id}`);
    } else if (recommendation.type === 'analysis') {
      navigate(`/analysis/${recommendation.item.id}`);
    }
  };

  const handleDiscussWithAI = (recommendation: any) => {
    const contextData = {
      type: recommendation.type,
      id: recommendation.item.id,
      title: recommendation.item.title || recommendation.item.company_name,
      data: recommendation.item
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const getPlaceholderImage = (stockCase: any) => {
    // Use different placeholder images based on sector or company
    const placeholders = [
      'photo-1488590528505-98d2b5aba04b', // Tech/laptop
      'photo-1485833077593-4278bba3f11f', // Nature/growth
      'photo-1500375592092-40eb2168fd21', // Ocean/stability
      'photo-1469474968028-56623f02e420', // Mountain/strength
    ];
    
    const index = stockCase.id ? stockCase.id.length % placeholders.length : 0;
    return placeholders[index];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Upptäck Nya Möjligheter</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Upptäck Nya Möjligheter</h2>
        </div>
        <Card className="text-center py-8">
          <CardContent className="pt-4">
            <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <CardTitle className="text-lg mb-2">Inga möjligheter tillgängliga</CardTitle>
            <p className="text-sm text-muted-foreground">
              Skapa en portfölj för att upptäcka nya möjligheter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate stock cases and analyses
  const stockCaseRecommendations = recommendations.filter(r => r.type === 'stock_case');
  const analysisRecommendations = recommendations.filter(r => r.type === 'analysis');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">Upptäck Nya Möjligheter</h2>
      </div>

      {/* Stock Cases - Instagram Style */}
      {stockCaseRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Upptäck Aktiefall</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockCaseRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="relative">
                  {/* Image */}
                  <div className="h-64 relative overflow-hidden">
                    <img
                      src={recommendation.item.image_url || `https://images.unsplash.com/${getPlaceholderImage(recommendation.item)}?auto=format&fit=crop&w=800&q=80`}
                      alt={recommendation.item.company_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        <Target className="w-3 h-3 mr-1" />
                        {Math.round(recommendation.confidence * 100)}% match
                      </Badge>
                      
                      {recommendation.item.sector && (
                        <Badge variant="outline" className="bg-white/90 text-gray-900">
                          {recommendation.item.sector}
                        </Badge>
                      )}
                    </div>

                    {/* Company info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl font-bold mb-1 line-clamp-2">
                        {recommendation.item.company_name}
                      </h3>
                      <p className="text-sm opacity-90 line-clamp-1 mb-2">
                        {recommendation.item.title}
                      </p>
                      
                      {/* Performance indicator */}
                      {recommendation.item.performance_percentage && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            recommendation.item.performance_percentage > 0 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {recommendation.item.performance_percentage > 0 ? '+' : ''}{recommendation.item.performance_percentage}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Floating action buttons */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full w-10 h-10 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Heart functionality would go here
                        }}
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full w-10 h-10 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Bookmark functionality would go here
                        }}
                      >
                        <Bookmark className="w-4 h-4 text-blue-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <strong>AI-Insight:</strong> {recommendation.reason}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDiscussWithAI(recommendation)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Diskutera
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(recommendation)}
                        >
                          Se detaljer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analyses - Twitter/X Style */}
      {analysisRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold">Upptäck Analyser</h3>
          </div>
          
          <div className="space-y-3">
            {analysisRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => handleViewDetails(recommendation)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      {recommendation.item.profiles?.display_name?.[0] || 
                       recommendation.item.profiles?.username?.[0] || 
                       <User className="w-5 h-5 text-white" />}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {recommendation.item.profiles?.display_name || 
                           recommendation.item.profiles?.username || 
                           'AI Analyst'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(recommendation.item.created_at).toLocaleDateString('sv-SE')}
                        </span>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Target className="w-3 h-3 mr-1" />
                          {Math.round(recommendation.confidence * 100)}% match
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">
                        {recommendation.item.title}
                      </h4>
                      
                      <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-3">
                        <strong>AI-Insight:</strong> {recommendation.reason}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{recommendation.item.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{recommendation.item.views_count || 0}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiscussWithAI(recommendation);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Diskutera
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
