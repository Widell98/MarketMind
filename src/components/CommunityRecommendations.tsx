
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
import HoldingsGroupSection from '@/components/HoldingsGroupSection';
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
        <div className="space-y-4">
          <HoldingsGroupSection
            title="Community-rekommenderade Innehav"
            holdings={recommendations.slice(0, 6).map(recommendation => ({
              id: recommendation.id,
              name: getItemTitle(recommendation),
              symbol: recommendation.stock_case?.title || '',
              holding_type: 'recommendation',
              current_value: 0,
              currency: 'SEK',
              sector: recommendation.stock_case?.sector || 'Community',
              _originalData: recommendation
            }))}
            totalValue={0}
            groupPercentage={0}
            isCollapsible={false}
            defaultExpanded={true}
            getPriceForHolding={() => null}
            onDiscuss={(name) => {
              const recommendation = recommendations.find(r => getItemTitle(r) === name);
              if (recommendation) handleDiscussWithAI(recommendation, {} as any);
            }}
            onDelete={(id) => {
              const recommendation = recommendations.find(r => r.id === id);
              if (recommendation) handleDeleteRecommendation(recommendation, {} as any);
            }}
            onAddToPortfolio={(id) => {
              const recommendation = recommendations.find(r => r.id === id);
              if (recommendation) handleAddToPortfolio(recommendation, {} as any);
            }}
            showAsRecommendations={true}
          />
          
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
