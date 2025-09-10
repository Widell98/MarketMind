import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, ArrowRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import RecommendationCard from '@/components/RecommendationCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/AddHoldingDialog';

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
  const { latestCases, loading } = useLatestStockCases(4);
  const navigate = useNavigate();
  const { addHolding } = useUserHoldings();
  const { toast } = useToast();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // In the future, this will use actual AI recommendations based on user portfolio
  // For now, we'll show latest cases with personalization context
  const personalizedCases = latestCases.slice(0, 4) as StockCase[];
  const handleAddToPortfolio = (stockCase: StockCase, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
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
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };

  const handleDeleteRecommendation = (stockCase: StockCase, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // For AI recommendations, we could implement removal from recommendations list
    // For now, we'll show a toast that this feature could be implemented
    toast({
      title: "Funktionen kommer snart",
      description: "Möjligheten att ta bort AI-rekommendationer kommer i en framtida uppdatering.",
      variant: "default"
    });
  };

  const handleViewDetails = (stockCase: StockCase) => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const handleAddHolding = async (holdingData: SelectedStock) => {
    try {
      await addHolding(holdingData);
      toast({
        title: "Tillagt till portfölj!",
        description: `${holdingData.name} har lagts till i din portfölj`,
        variant: "default"
      });
      setIsAddHoldingOpen(false);
      setSelectedStock(null);
      return true;
    } catch (error) {
      console.error('Error adding holding:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till i portföljen. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  };
  if (!user) {
    return null;
  }
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Rekommenderade Innehav
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4 animate-pulse" />
              <span>Laddar AI-rekommendationer...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (personalizedCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Rekommenderade Innehav
          </CardTitle>
          <CardDescription>
            Personaliserade investeringsförslag baserade på din profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga AI-rekommendationer tillgängliga</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              AI:n arbetar på att hitta personaliserade investeringsmöjligheter för dig.
            </p>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Få AI-rekommendationer
                </span>
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
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Rekommenderade Innehav
            {personalizedCases.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">
                {personalizedCases.length} rekommendationer
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Personaliserade investeringsförslag baserade på din profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {personalizedCases.length} AI-rekommendationer
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'text-purple-600' : 'text-muted-foreground'}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'text-purple-600' : 'text-muted-foreground'}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ai-chat')}
                className="text-purple-600 hover:text-purple-700"
              >
                Få fler <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {personalizedCases.map((stockCase) => (
                <RecommendationCard
                  key={stockCase.id}
                  title={stockCase.company_name}
                  description={stockCase.description || stockCase.title}
                  tags={stockCase.sector ? [stockCase.sector] : []}
                  isAI={true}
                  author={stockCase.profiles ? stockCase.profiles.display_name || stockCase.profiles.username : undefined}
                  onAdd={(e) => handleAddToPortfolio(stockCase, e)}
                  onDiscuss={(e) => handleDiscussWithAI(stockCase, e)}
                  onDelete={(e) => handleDeleteRecommendation(stockCase, e)}
                  onClick={() => handleViewDetails(stockCase)}
                />
              ))}
            </div>
          ) : (
            <div className={`space-y-3 ${personalizedCases.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
              {personalizedCases.map((stockCase) => (
                <RecommendationCard
                  key={stockCase.id}
                  title={stockCase.company_name}
                  description={stockCase.description || stockCase.title}
                  tags={stockCase.sector ? [stockCase.sector] : []}
                  isAI={true}
                  author={stockCase.profiles ? stockCase.profiles.display_name || stockCase.profiles.username : undefined}
                  onAdd={(e) => handleAddToPortfolio(stockCase, e)}
                  onDiscuss={(e) => handleDiscussWithAI(stockCase, e)}
                  onDelete={(e) => handleDeleteRecommendation(stockCase, e)}
                  onClick={() => handleViewDetails(stockCase)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
