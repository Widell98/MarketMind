import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Package,
  MessageSquare,
  ShoppingCart,
  Trash2,
  Brain,
  AlertTriangle,
  Lightbulb,
  ArrowRightLeft,
  Target,
  Shield,
  DollarSign,
  PieChart
} from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InteractivePortfolio from '@/components/InteractivePortfolio';
import EnhancedPortfolioDashboard from '@/components/EnhancedPortfolioDashboard';
import AddHoldingDialog from '@/components/AddHoldingDialog';

interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  portfolio, 
  onQuickChat, 
  onActionClick 
}) => {
  const { actualHoldings, loading, deleteHolding, addHolding } = useUserHoldings();
  const { toast } = useToast();
  const [isAddHoldingDialogOpen, setIsAddHoldingDialogOpen] = useState(false);
  const [recommendationToAdd, setRecommendationToAdd] = useState<any>(null);

  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    console.log(`Deleting holding: ${holdingName} (${holdingId})`);
    const success = await deleteHolding(holdingId);
    if (success) {
      toast({
        title: "Innehav raderat",
        description: `${holdingName} har tagits bort från din portfölj.`,
      });
    }
  };

  const handleDiscussHolding = (holdingName: string, symbol?: string) => {
    const message = `Berätta mer om ${holdingName}${symbol ? ` (${symbol})` : ''}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;
    onQuickChat(message);
  };

  const handleBuyRecommendation = (stock: any) => {
    const message = `Jag vill köpa ${stock.name || stock.symbol}. Kan du ge mig den senaste informationen om aktien och se till att den passar in i min portfölj?`;
    onQuickChat(message);
  };

  const handleDiscussRecommendation = (stock: any) => {
    const message = `Berätta mer om ${stock.name || stock.symbol} och varför den rekommenderas för min portfölj. Vilka är riskerna och möjligheterna?`;
    onQuickChat(message);
  };

  const handleRemoveRecommendation = (index: number) => {
    console.log(`Removing recommendation at index: ${index}`);
    // Implement logic to remove the recommendation from the portfolio
    toast({
      title: "Rekommendation borttagen",
      description: `AI-rekommendationen har tagits bort från listan.`,
    });
  };

  const handleOpenAddHoldingDialog = (recommendation?: any) => {
    if (recommendation) {
      setRecommendationToAdd(recommendation);
    } else {
      setRecommendationToAdd(null);
    }
    setIsAddHoldingDialogOpen(true);
  };

  const handleCloseAddHoldingDialog = () => {
    setIsAddHoldingDialogOpen(false);
    setRecommendationToAdd(null);
  };

  const handleAddHoldingFromDialog = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    if (success) {
      toast({
        title: "Innehav tillagt",
        description: `${holdingData.name} har lagts till i din portfölj.`,
      });
      return true;
    }
    return false;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Portfölj Värde</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Totala värdet av dina investeringar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">
              {portfolio?.total_value ? formatCurrency(portfolio.total_value) : '0.00 SEK'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Förväntad Avkastning</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Baserat på nuvarande innehav
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">
              {portfolio?.expected_return ? `${portfolio.expected_return}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Risk Score</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Din portföljs riskbedömning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">
              {portfolio?.risk_score ? portfolio.risk_score : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Diversifiering</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Hur väl diversifierad din portfölj är
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold">
              {portfolio?.diversification_score ? portfolio.diversification_score : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Holdings */}
      {actualHoldings.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Dina Nuvarande Innehav
            </CardTitle>
            <CardDescription>
              Hantera dina aktieinnehav
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actualHoldings.map(holding => (
              <div key={holding.id} className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{holding.name}</h3>
                      {holding.symbol && (
                        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          {holding.symbol}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-3">
                      {holding.quantity && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {holding.quantity} aktier
                        </span>
                      )}
                      {holding.purchase_price && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Köpt för {formatCurrency(holding.purchase_price)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {holding.holding_type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                      onClick={() => handleDiscussHolding(holding.name, holding.symbol)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Diskutera
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Radera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera innehav</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill radera <strong>{holding.name}</strong> från dina innehav? 
                            Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteHolding(holding.id, holding.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Radera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Recommended Holdings */}
      {portfolio?.recommended_stocks && portfolio.recommended_stocks.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-rekommenderade Innehav
            </CardTitle>
            <CardDescription>
              AI-genererade förslag baserat på din riskprofil och investeringsmål
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolio.recommended_stocks.map((stock: any, index: number) => (
              <div key={index} className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{stock.name || stock.symbol}</h3>
                      {stock.symbol && (
                        <span className="font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                          {stock.symbol}
                        </span>
                      )}
                      {stock.allocation && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                          {stock.allocation}% av portföljen
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-3">
                      {stock.sector && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {stock.sector}
                        </span>
                      )}
                      {stock.expected_return && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Förväntad avkastning: {stock.expected_return}%
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        AI-rekommendation
                      </span>
                    </div>
                    {stock.reasoning && (
                      <p className="text-xs text-gray-500 mt-2 break-words overflow-wrap-anywhere leading-relaxed">
                        {stock.reasoning}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300"
                      onClick={() => handleOpenAddHoldingDialog(stock)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Köp
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                      onClick={() => handleDiscussRecommendation(stock)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Diskutera
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                      onClick={() => handleRemoveRecommendation(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Radera
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interactive Portfolio */}
      {portfolio && (
        <InteractivePortfolio 
          portfolio={portfolio} 
          onQuickChat={onQuickChat} 
        />
      )}

      {/* Enhanced Portfolio Dashboard */}
      {portfolio && (
        <EnhancedPortfolioDashboard 
          portfolio={portfolio} 
          recommendations={portfolio.recommended_stocks} 
        />
      )}

      {/* Dialogs */}
      <AddHoldingDialog
        isOpen={isAddHoldingDialogOpen}
        onClose={handleCloseAddHoldingDialog}
        onAdd={handleAddHoldingFromDialog}
        initialData={recommendationToAdd}
      />
    </div>
  );
};

export default PortfolioOverview;
