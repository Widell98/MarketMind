
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from './AddHoldingDialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Plus, 
  ArrowUpRight,
  Target,
  MessageSquare,
  LogIn,
  ShoppingCart
} from 'lucide-react';

interface Portfolio {
  id: string;
  portfolio_name: string;
  asset_allocation: any;
  recommended_stocks: any[];
  total_value: number;
  expected_return: number;
  risk_score: number;
  created_at: string;
}

interface PortfolioOverviewProps {
  portfolio: Portfolio | null;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview = ({ portfolio, onQuickChat, onActionClick }: PortfolioOverviewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { actualHoldings } = useUserHoldings();
  const { toast } = useToast();
  const [showAddHolding, setShowAddHolding] = useState(false);

  const handleAIRecommendations = () => {
    if (!user) {
      toast({
        title: "Logga in krävs",
        description: "Du måste vara inloggad för att få AI-rekommendationer",
        variant: "destructive"
      });
      return;
    }
    navigate('/ai-chat', {
      state: { 
        createNewSession: true, 
        sessionName: 'AI Portföljrekommendationer',
        initialMessage: 'Ge mig AI-rekommenderade innehav baserat på min riskprofil och investeringsmål'
      }
    });
  };

  const handleBuyStock = (stock: any) => {
    if (!user) {
      toast({
        title: "Logga in krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Innehav noterat",
      description: `Du har noterat intresse för ${stock.name || stock.symbol}. Kom ihåg att detta endast är för utbildningssyfte.`,
    });
  };

  const handleAddHolding = () => {
    if (!user) {
      toast({
        title: "Logga in krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }
    setShowAddHolding(true);
  };

  const totalHoldingsValue = actualHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-primary shadow-md">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                    {portfolio?.portfolio_name || 'Min Portfölj'}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    AI-optimerad investeringsstrategi
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                <Target className="w-3 h-3 mr-1" />
                Aktiv
              </Badge>
              {portfolio && (
                <Badge variant="outline" className="px-3 py-1">
                  Risk: {portfolio.risk_score}/10
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Portföljvärde</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold">
                  {user ? `${totalHoldingsValue.toLocaleString()} SEK` : '---'}
                </p>
              </div>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Förväntad avkastning</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm sm:text-lg lg:text-xl font-bold">
                    {portfolio?.expected_return || 0}%
                  </p>
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Innehav</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold">
                  {user ? actualHoldings.length : '---'}
                </p>
              </div>
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Riskpoäng</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold">
                  {portfolio?.risk_score || 0}/10
                </p>
              </div>
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Current Holdings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Nuvarande Innehav</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Dina aktiva investeringar
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={handleAddHolding}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Lägg till innehav</span>
              <span className="sm:hidden">Lägg till</span>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {!user ? (
              <div className="text-center py-8 space-y-3">
                <LogIn className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Logga in för att se innehav</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Skapa ett konto för att hantera dina investeringar
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Logga in
                </Button>
              </div>
            ) : actualHoldings.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <PieChart className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Inga innehav än</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Lägg till dina första investeringar för att komma igång
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {actualHoldings.slice(0, 5).map((holding, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{holding.symbol}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {holding.quantity} st × {holding.average_price} SEK
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-medium text-sm">
                        {(holding.current_value || 0).toLocaleString()} SEK
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        {(holding.current_value || 0) > (holding.quantity * holding.average_price) ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {((((holding.current_value || 0) / (holding.quantity * holding.average_price)) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {actualHoldings.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    och {actualHoldings.length - 5} till...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommended Holdings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">AI-Rekommenderade Innehav</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Personaliserade förslag baserat på din profil
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={handleAIRecommendations}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Få AI rekommenderade innehav</span>
              <span className="sm:hidden">AI rekommendationer</span>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {!portfolio?.recommended_stocks || portfolio.recommended_stocks.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Inga rekommendationer än</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Chatta med AI:n för att få personliga investeringsförslag
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio.recommended_stocks.slice(0, 5).map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">
                        {stock.name || stock.symbol}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {stock.sector} • {stock.allocation || '5'}% allokering
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBuyStock(stock)}
                      className="flex items-center gap-1 flex-shrink-0 ml-3"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span className="text-xs">Köp</span>
                    </Button>
                  </div>
                ))}
                {portfolio.recommended_stocks.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    och {portfolio.recommended_stocks.length - 5} till...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddHoldingDialog 
        open={showAddHolding}
        onOpenChange={setShowAddHolding}
      />
    </div>
  );
};

export default PortfolioOverview;
