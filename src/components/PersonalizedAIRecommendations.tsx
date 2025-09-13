import React, { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import RecommendationSection from '@/components/RecommendationSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { Recommendation } from '@/types/recommendation';

interface StockCase {
  id: string | number;
  company_name: string;
  title: string;
  description?: string;
  sector?: string;
  profiles?: { display_name?: string; username: string };
}

interface SelectedStock {
  name: string;
  symbol: string;
  sector: string;
  market: string;
  currency: string;
}

const PersonalizedAIRecommendations = () => {
  const { user } = useAuth();
  const { latestCases, loading } = useLatestStockCases(6);
  const navigate = useNavigate();
  const { addHolding } = useUserHoldings();
  const { toast } = useToast();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
  const [personalizedCases, setPersonalizedCases] = useState<StockCase[]>([]);

  useEffect(() => {
    setPersonalizedCases(latestCases as StockCase[]);
  }, [latestCases]);

  const recommendations: Recommendation[] = personalizedCases.map((stockCase) => ({
    title: stockCase.company_name,
    description: stockCase.description || stockCase.title,
    tags: stockCase.sector ? [stockCase.sector] : [],
    author: stockCase.profiles ? stockCase.profiles.display_name || stockCase.profiles.username : undefined,
    isAI: true
  }));

  const handleAddToPortfolio = (stockCase: StockCase, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Inloggning krävs',
        description: 'Du måste vara inloggad för att lägga till innehav',
        variant: 'destructive'
      });
      return;
    }

    setSelectedStock({
      name: stockCase.company_name,
      symbol: stockCase.title,
      sector: stockCase.sector || 'Okänd',
      market: 'Stockholm',
      currency: 'SEK'
    });
    setIsAddHoldingOpen(true);
  };

  const handleDiscussWithAI = (stockCase: StockCase, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase,
      personalContext: true
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleDeleteRecommendation = (stockCase: StockCase, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setPersonalizedCases((prev) => prev.filter((c) => c.id !== stockCase.id));
    toast({
      title: 'Rekommendation borttagen',
      description: 'Rekommendationen har tagits bort från listan.'
    });
  };

  const handleViewDetails = (stockCase: StockCase) => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const handleAddHolding = async (holdingData: SelectedStock) => {
    try {
      await addHolding(holdingData);
      toast({
        title: 'Tillagt till portfölj!',
        description: `${holdingData.name} har lagts till i din portfölj`,
        variant: 'default'
      });
      setIsAddHoldingOpen(false);
      setSelectedStock(null);
      return true;
    } catch (error) {
      console.error('Error adding holding:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till i portföljen. Försök igen.',
        variant: 'destructive'
      });
      return false;
    }
  };

  if (!user) {
    return null;
  }

  const emptyState = (
    <div className="text-center py-8">
      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2 text-foreground">Inga AI-rekommendationer tillgängliga</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        AI:n arbetar på att hitta personaliserade investeringsmöjligheter för dig.
      </p>
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-700 dark:text-blue-300">Få AI-rekommendationer</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Chatta med AI:n för att få personaliserade investeringsförslag
        </p>
      </div>
      <Button
        onClick={() => navigate('/ai-chat')}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Brain className="w-4 h-4" />
        Chatta med AI
      </Button>
    </div>
  );

  return (
    <>
      <RecommendationSection
        title="AI-Rekommenderade Innehav"
        description="Personaliserade investeringsförslag baserade på din profil"
        icon={<Brain className="w-5 h-5 text-primary" />}
        recommendations={recommendations}
        loading={loading}
        loadingText="Laddar AI-rekommendationer..."
        emptyState={emptyState}
        navigateLabel="Få fler"
        onNavigate={() => navigate('/ai-chat')}
        onViewAll={recommendations.length > 6 ? () => navigate('/ai-chat') : undefined}
        viewAllLabel={`Visa alla AI-rekommendationer (${recommendations.length})`}
        onAdd={(index, e) => handleAddToPortfolio(personalizedCases[index], e)}
        onDiscuss={(index, e) => handleDiscussWithAI(personalizedCases[index], e)}
        onDelete={(index, e) => handleDeleteRecommendation(personalizedCases[index], e)}
        onSelect={(index) => handleViewDetails(personalizedCases[index])}
      />
      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          setIsAddHoldingOpen(false);
          setSelectedStock(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedStock}
      />
    </>
  );
};

export default PersonalizedAIRecommendations;
