import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, User, MessageCircle, Star, ShoppingCart, Sparkles, Trash2, ArrowRight, Tag } from 'lucide-react';
import HoldingsGroupSection from '@/components/HoldingsGroupSection';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/AddHoldingDialog';
const PersonalizedAIRecommendations = () => {
  const { user } = useAuth();
  const { latestCases, loading } = useLatestStockCases(4);
  const navigate = useNavigate();
  const { addHolding } = useUserHoldings();
  const { toast } = useToast();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  // In the future, this will use actual AI recommendations based on user portfolio
  // For now, we'll show latest cases with personalization context
  const personalizedCases = latestCases.slice(0, 4);
  const handleAddToPortfolio = (stockCase: any, e: React.MouseEvent) => {
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

  const handleDiscussWithAI = (stockCase: any, e: React.MouseEvent) => {
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

  const handleDeleteRecommendation = (stockCase: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // For AI recommendations, we could implement removal from recommendations list
    // For now, we'll show a toast that this feature could be implemented
    toast({
      title: "Funktionen kommer snart",
      description: "Möjligheten att ta bort AI-rekommendationer kommer i en framtida uppdatering.",
      variant: "default"
    });
  };

  const handleViewDetails = (stockCase: any) => {
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const handleAddHolding = async (holdingData: any) => {
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/ai-chat')}
              className="text-purple-600 hover:text-purple-700"
            >
              Få fler <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-4">
            <HoldingsGroupSection
              title="AI-Rekommenderade Innehav"
              holdings={personalizedCases.map(stockCase => ({
                id: stockCase.id,
                name: stockCase.company_name,
                symbol: stockCase.title,
                holding_type: 'recommendation',
                current_value: 0,
                currency: 'SEK',
                sector: stockCase.sector,
                _originalData: stockCase
              }))}
              totalValue={0}
              groupPercentage={0}
              isCollapsible={false}
              defaultExpanded={true}
              getPriceForHolding={() => null}
              onDiscuss={(name, symbol) => {
                const stockCase = personalizedCases.find(sc => sc.company_name === name || sc.title === symbol);
                if (stockCase) handleDiscussWithAI(stockCase, {} as any);
              }}
              onDelete={(id) => {
                const stockCase = personalizedCases.find(sc => sc.id === id);
                if (stockCase) handleDeleteRecommendation(stockCase, {} as any);
              }}
              onAddToPortfolio={(id) => {
                const stockCase = personalizedCases.find(sc => sc.id === id);
                if (stockCase) handleAddToPortfolio(stockCase, {} as any);
              }}
              showAsRecommendations={true}
            />
          </div>
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