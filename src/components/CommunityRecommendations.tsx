
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Brain, ArrowRight, Sparkles, LayoutGrid, List as ListIcon } from 'lucide-react';
import RecommendationCard from '@/components/RecommendationCard';
import { useCommunityRecommendations, CommunityRecommendation } from '@/hooks/useCommunityRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import AddHoldingDialog from '@/components/AddHoldingDialog';

declare global {
  interface Window {
    refreshCommunityRecommendations?: () => void;
  }
}

interface SelectedStock {
  name: string;
  symbol: string;
  sector: string;
  market: string;
  currency: string;
}

interface SelectedRecommendation extends CommunityRecommendation {
  stockInfo: SelectedStock;
}

const CommunityRecommendations: React.FC = () => {
  const { recommendations, loading, refetch } = useCommunityRecommendations();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addHolding } = useUserHoldings();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<SelectedRecommendation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Expose refetch function globally so SaveOpportunityButton can use it
  React.useEffect(() => {
    window.refreshCommunityRecommendations = refetch;
    return () => {
      delete window.refreshCommunityRecommendations;
    };
  }, [refetch]);

  const handleViewItem = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      navigate(`/stock-cases/${recommendation.stock_case.id}`);
    } else if (recommendation.analysis) {
      navigate(`/analysis/${recommendation.analysis.id}`);
    }
  };

  const handleAddToPortfolio = async (recommendation: CommunityRecommendation, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }

    const stockName = recommendation.stock_case
      ? recommendation.stock_case.company_name
      : recommendation.analysis?.title || '';

    const stockSymbol = recommendation.stock_case
      ? recommendation.stock_case.title
      : (recommendation.analysis?.title || stockName).toUpperCase().substring(0, 4);

    const sector = recommendation.stock_case
      ? recommendation.stock_case.sector || 'Okänd'
      : 'Analys';

    setSelectedRecommendation({
      ...recommendation,
      stockInfo: {
        name: stockName,
        symbol: stockSymbol,
        sector,
        market: 'Stockholm',
        currency: 'SEK'
      }
    });
    setIsAddHoldingOpen(true);
  };

  const handleAddHolding = async (
    holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
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

  const handleDiscussWithAI = (recommendation: CommunityRecommendation, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    let contextData: Record<string, unknown> = {};
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

    navigate('/ai-chatt', { state: { contextData } });
  };

  const handleDeleteRecommendation = async (recommendation: CommunityRecommendation, e: React.MouseEvent<HTMLButtonElement>) => {
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
    <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              Community-rekommenderade Innehav
              {recommendations.length > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-2 px-3 py-1 rounded-full">
                  {recommendations.length} rekommendationer
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 ml-13 leading-relaxed">
              Dina sparade stock-cases och analyser från communityn
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground font-medium">
            {recommendations.length} sparade rekommendationer
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/stock-cases')}
              className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium"
            >
              Hitta fler <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        {viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  title={getItemTitle(recommendation)}
                  description={getItemDescription(recommendation)}
                  tags={recommendation.tags}
                  isAI={isAIGenerated(recommendation)}
                  author={getCreatorInfo(recommendation) || undefined}
                  onAdd={(e) => handleAddToPortfolio(recommendation, e)}
                  onDiscuss={(e) => handleDiscussWithAI(recommendation, e)}
                  onDelete={(e) => handleDeleteRecommendation(recommendation, e)}
                  onClick={() => handleViewItem(recommendation)}
                />
              ))}
            </div>
            {recommendations.length > 6 && (
              <Button
                variant="outline"
                className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
                onClick={() => navigate('/discover-opportunities')}
              >
                Visa alla sparade rekommendationer ({recommendations.length})
              </Button>
            )}
          </>
        ) : (
          <div className={`space-y-4 ${recommendations.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {recommendations.slice(0, 6).map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                title={getItemTitle(recommendation)}
                description={getItemDescription(recommendation)}
                tags={recommendation.tags}
                isAI={isAIGenerated(recommendation)}
                author={getCreatorInfo(recommendation) || undefined}
                onAdd={(e) => handleAddToPortfolio(recommendation, e)}
                onDiscuss={(e) => handleDiscussWithAI(recommendation, e)}
                onDelete={(e) => handleDeleteRecommendation(recommendation, e)}
                onClick={() => handleViewItem(recommendation)}
              />
            ))}

            {recommendations.length > 6 && (
              <Button
                variant="outline"
                className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
                onClick={() => navigate('/discover-opportunities')}
              >
                Visa alla sparade rekommendationer ({recommendations.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          setIsAddHoldingOpen(false);
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation?.stockInfo}
      />
    </Card>
  );
};

export default CommunityRecommendations;
