
import React, { useState } from 'react';
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
  ArrowRight,
  Sparkles,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Star
} from 'lucide-react';
import { useCommunityRecommendations, CommunityRecommendation } from '@/hooks/useCommunityRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import AddHoldingDialog from '@/components/AddHoldingDialog';

const CommunityRecommendations: React.FC = () => {
  const { recommendations, loading, refetch } = useCommunityRecommendations();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addHolding } = useUserHoldings();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CommunityRecommendation | null>(null);

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

  const handleAddToPortfolio = async (recommendation: CommunityRecommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }

    // Extract stock information and prepare for dialog
    let stockName = '';
    let stockSymbol = '';
    let sector = '';

    if (recommendation.stock_case) {
      stockName = recommendation.stock_case.company_name;
      stockSymbol = recommendation.stock_case.title;
      sector = recommendation.stock_case.sector || 'Okänd';
    } else if (recommendation.analysis) {
      stockName = recommendation.analysis.title;
      sector = 'Analys';
    }

    setSelectedRecommendation({
      ...recommendation,
      stockInfo: {
        name: stockName,
        symbol: stockSymbol || stockName.toUpperCase().substring(0, 4),
        sector: sector,
        market: 'Stockholm',
        currency: 'SEK'
      }
    } as any);
    setIsAddHoldingOpen(true);
  };

  const handleAddHolding = async (holdingData: any) => {
    try {
      await addHolding(holdingData);
      
      toast({
        title: "Tillagt till portfölj!",
        description: `${holdingData.name} har lagts till i din portfölj som en Community-rekommendation`,
        variant: "default"
      });
      
      setIsAddHoldingOpen(false);
      setSelectedRecommendation(null);
      return true;
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till i portföljen. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleDiscussWithAI = (recommendation: CommunityRecommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let contextData = {};
    if (recommendation.stock_case) {
      contextData = {
        type: 'stock_case',
        id: recommendation.stock_case.id,
        title: recommendation.stock_case.title,
        data: recommendation.stock_case
      };
    } else if (recommendation.analysis) {
      contextData = {
        type: 'analysis',
        id: recommendation.analysis.id,
        title: recommendation.analysis.title,
        data: recommendation.analysis
      };
    }

    navigate('/ai-chat', { state: { contextData } });
  };

  const handleDeleteRecommendation = async (recommendation: CommunityRecommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att ta bort rekommendationer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('id', recommendation.id);

      if (error) throw error;

      toast({
        title: "Rekommendation borttagen",
        description: "Rekommendationen har tagits bort från din lista."
      });

      // Refresh the recommendations list
      refetch();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort rekommendationen. Försök igen senare.",
        variant: "destructive"
      });
    }
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
            
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/stock-cases')} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="w-4 h-4" />
                Utforska Stock Cases
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
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Community-rekommenderade Innehav
          {recommendations.length > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
              {recommendations.length} rekommendationer
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Dina sparade stock-cases och analyser från communityn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {recommendations.length} sparade rekommendationer
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/stock-cases')}
            className="text-blue-600 hover:text-blue-700"
          >
            Hitta fler <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {recommendations.slice(0, 6).map((recommendation) => (
            <div 
              key={recommendation.id}
              className="p-3 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-200"
              onClick={() => handleViewItem(recommendation)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <h4 className="font-medium text-sm truncate">{getItemTitle(recommendation)}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAIGenerated(recommendation) ? (
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAddToPortfolio(recommendation, e)}
                      className="text-xs bg-white hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 flex-1"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Lägg till i portfölj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDiscussWithAI(recommendation, e)}
                      className="text-xs bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 flex-1"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteRecommendation(recommendation, e)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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

      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          setIsAddHoldingOpen(false);
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={(selectedRecommendation as any)?.stockInfo}
      />
    </Card>
  );
};

export default CommunityRecommendations;
