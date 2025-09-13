import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Brain, Sparkles } from 'lucide-react';
import RecommendationSection from '@/components/RecommendationSection';
import { useCommunityRecommendations, CommunityRecommendation } from '@/hooks/useCommunityRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { Button } from '@/components/ui/button';
import { Recommendation } from '@/types/recommendation';

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

  useEffect(() => {
    window.refreshCommunityRecommendations = refetch;
    return () => {
      delete window.refreshCommunityRecommendations;
    };
  }, [refetch]);

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

  const mappedRecommendations: Recommendation[] = recommendations.map((r) => ({
    title: getItemTitle(r),
    description: getItemDescription(r),
    tags: r.tags,
    author: getCreatorInfo(r) || undefined,
    isAI: !!isAIGenerated(r)
  }));

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
        title: 'Inloggning krävs',
        description: 'Du måste vara inloggad för att lägga till innehav',
        variant: 'destructive'
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
        title: 'Tillagt till portfölj!',
        description: `${holdingData.name} har lagts till i din portfölj som en Community-rekommendation`,
        variant: 'default'
      });
      setIsAddHoldingOpen(false);
      setSelectedRecommendation(null);
      return true;
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till i portföljen. Försök igen.',
        variant: 'destructive'
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
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleDeleteRecommendation = async (
    recommendation: CommunityRecommendation,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Fel',
        description: 'Du måste vara inloggad för att ta bort rekommendationer',
        variant: 'destructive'
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
        title: 'Rekommendation borttagen',
        description: 'Rekommendationen har tagits bort från din lista.'
      });
      refetch();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort rekommendationen. Försök igen senare.',
        variant: 'destructive'
      });
    }
  };

  const emptyState = (
    <div className="text-center py-8">
      <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2 text-foreground">Inga sparade rekommendationer</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        Utforska stock-cases och analyser från communityn och spara intressanta innehåll för att se det här.
      </p>
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-700 dark:text-purple-300">Hitta inspiration på /stock-cases</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Spara intressanta cases och analyser för att bygga din investeringsstrategi
        </p>
      </div>
      <Button
        onClick={() => navigate('/stock-cases')}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Brain className="w-4 h-4" />
        Utforska Stock Cases
      </Button>
    </div>
  );

  return (
    <>
      <RecommendationSection
        title="Community-rekommenderade Innehav"
        description="Dina sparade stock-cases och analyser från communityn"
        icon={<Users className="w-5 h-5 text-primary" />}
        recommendations={mappedRecommendations}
        loading={loading}
        loadingText="Laddar community-rekommendationer..."
        emptyState={emptyState}
        navigateLabel="Hitta fler"
        onNavigate={() => navigate('/stock-cases')}
        onViewAll={recommendations.length > 6 ? () => navigate('/discover-opportunities') : undefined}
        viewAllLabel={`Visa alla sparade rekommendationer (${recommendations.length})`}
        onAdd={(index, e) => handleAddToPortfolio(recommendations[index], e)}
        onDiscuss={(index, e) => handleDiscussWithAI(recommendations[index], e)}
        onDelete={(index, e) => handleDeleteRecommendation(recommendations[index], e)}
        onSelect={(index) => handleViewItem(recommendations[index])}
      />
      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          setIsAddHoldingOpen(false);
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation?.stockInfo}
      />
    </>
  );
};

export default CommunityRecommendations;
