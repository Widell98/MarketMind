
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Brain, 
  ExternalLink, 
  User,
  BookOpen,
  TrendingUp,
  Tag,
  MessageCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useCommunityRecommendations, CommunityRecommendation } from '@/hooks/useCommunityRecommendations';

const CommunityRecommendations: React.FC = () => {
  const { recommendations, loading, refetch } = useCommunityRecommendations();
  const navigate = useNavigate();

  // Expose refetch function globally so SaveOpportunityButton can use it
  React.useEffect(() => {
    (window as any).refreshCommunityRecommendations = refetch;
    return () => {
      delete (window as any).refreshCommunityRecommendations;
    };
  }, [refetch]);

  const handleViewItem = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      navigate(`/stock-cases/${recommendation.stock_case.id}`);
    } else if (recommendation.analysis) {
      navigate(`/analysis/${recommendation.analysis.id}`);
    }
  };

  const handleDiscussWithAI = (recommendation: CommunityRecommendation) => {
    const contextData = {
      type: recommendation.stock_case ? 'stock_case' : 'analysis',
      id: recommendation.stock_case?.id || recommendation.analysis?.id,
      title: getItemTitle(recommendation),
      data: recommendation.stock_case || recommendation.analysis
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const getItemIcon = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      return recommendation.stock_case.ai_generated ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />;
    }
    return recommendation.analysis?.ai_generated ? <Brain className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />;
  };

  const getItemTitle = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      return recommendation.stock_case.company_name;
    }
    return recommendation.analysis?.title || 'Analys';
  };

  const getItemDescription = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      return recommendation.stock_case.description || recommendation.stock_case.title;
    }
    return recommendation.analysis?.content?.substring(0, 100) + '...' || '';
  };

  const getCreatorInfo = (recommendation: CommunityRecommendation) => {
    const profile = recommendation.stock_case?.profiles || recommendation.analysis?.profiles;
    if (!profile) return null;
    
    return profile.display_name || profile.username;
  };

  const isAIGenerated = (recommendation: CommunityRecommendation) => {
    return recommendation.stock_case?.ai_generated || recommendation.analysis?.ai_generated;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community-rekommenderade Innehav
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4 animate-pulse" />
              <span>Laddar community-rekommendationer...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community-rekommenderade Innehav
          </CardTitle>
          <CardDescription>
            Dina sparade stock-cases och analyser från communityn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga sparade rekommendationer</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Utforska stock-cases och analyser från communityn och spara intressanta innehåll för att se det här.
            </p>
            
            {/* Enhanced CTA with inspiration hint */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Hitta inspiration på /stock-cases
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Spara intressanta cases och analyser för att bygga din investeringsstrategi
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/stock-cases')} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <TrendingUp className="w-4 h-4" />
                Utforska Stock Cases
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/discover-opportunities')} 
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Upptäck Analyser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Community-rekommenderade Innehav
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Dina sparade stock-cases och analyser från communityn ({recommendations.length} st)</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/stock-cases')}
            className="text-blue-600 hover:text-blue-700"
          >
            Hitta fler <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, 6).map((recommendation) => (
            <div 
              key={recommendation.id}
              className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewItem(recommendation)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getItemIcon(recommendation)}
                    <h4 className="font-medium text-sm truncate">{getItemTitle(recommendation)}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAIGenerated(recommendation) ? (
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Community
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {getItemDescription(recommendation)}
                  </p>

                  {getCreatorInfo(recommendation) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Av: {getCreatorInfo(recommendation)}
                    </p>
                  )}

                  {recommendation.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {recommendation.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {recommendation.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{recommendation.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* AI Discussion for saved items */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDiscussWithAI(recommendation);
                      }}
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex-1 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera med AI
                    </Button>
                  </div>
                </div>
                
                <Button size="sm" variant="ghost" className="flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {recommendations.length > 6 && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/discover-opportunities')}
            >
              Visa alla sparade rekommendationer ({recommendations.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityRecommendations;
