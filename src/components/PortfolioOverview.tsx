
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
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
import { useUserHoldings } from '@/hooks/useUserHoldings';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import UserHoldingsManager from './UserHoldingsManager';

interface PortfolioOverviewProps {
  portfolio?: any;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  portfolio, 
  onQuickChat, 
  onActionClick 
}) => {
  const { actualHoldings, recommendations, loading, deleteHolding, updateHolding, addHolding } = useUserHoldings();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  const handleEditHolding = (holding: any) => {
    setSelectedHolding(holding);
    setShowEditDialog(true);
  };

  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    console.log(`Deleting holding: ${holdingName} (${holdingId})`);
    const success = await deleteHolding(holdingId);
    if (success) {
      console.log('Holding deleted successfully');
    }
  };

  const handleSaveHolding = async (holdingData: any) => {
    if (selectedHolding) {
      const success = await updateHolding(selectedHolding.id, holdingData);
      if (success) {
        setSelectedHolding(null);
        setShowEditDialog(false);
      }
    }
  };

  const handleAddFromRecommendation = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setShowAddDialog(true);
  };

  const handleAddHolding = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    setSelectedRecommendation(null);
    return success;
  };

  const handleDiscussHolding = (holdingName: string, symbol?: string) => {
    const sessionName = `${holdingName} Analys`;
    const message = `Berätta mer om ${holdingName}${symbol ? ` (${symbol})` : ''}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;
    onQuickChat(`NEW_SESSION:${sessionName}:${message}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Standard button styles for consistency
  const primaryButtonClass = "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300";
  const dangerButtonClass = "text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300";

  // Calculate portfolio metrics if we have holdings
  const totalValue = actualHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
  const totalCost = actualHoldings.reduce((sum, holding) => sum + (holding.purchase_price || 0) * (holding.quantity || 1), 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Värde</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Baserat på {actualHoldings.length} innehav
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinst/Förlust</CardTitle>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGainLoss)}
            </div>
            <p className={`text-xs ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekommendationer</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              AI-genererade förslag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversifiering</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actualHoldings.length > 0 ? 'Bra' : 'Ingen'}
            </div>
            <p className="text-xs text-muted-foreground">
              {actualHoldings.length} olika innehav
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Dina Nuvarande Innehav
              </CardTitle>
              <CardDescription>
                {loading 
                  ? "Laddar dina innehav..."
                  : actualHoldings.length > 0 
                    ? `Hantera dina aktieinnehav (${actualHoldings.length} st)`
                    : "Lägg till dina befintliga aktier och fonder för bättre portföljanalys"
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className={primaryButtonClass}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <PieChart className="w-4 h-4 animate-pulse" />
                <span>Laddar innehav...</span>
              </div>
            </div>
          ) : actualHoldings.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Lägg till dina nuvarande aktier och fonder för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
              <Button 
                className={primaryButtonClass}
                variant="outline"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till innehav
              </Button>
            </div>
          ) : (
            actualHoldings.map(holding => (
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
                      className={primaryButtonClass}
                      onClick={() => handleDiscussHolding(holding.name, holding.symbol)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Diskutera
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className={primaryButtonClass}
                      onClick={() => handleEditHolding(holding)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Redigera
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={dangerButtonClass}
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
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              AI Rekommendationer
            </CardTitle>
            <CardDescription>
              Förslag baserade på din portfölj och riskprofil ({recommendations.length} st)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map(recommendation => (
              <div key={recommendation.id} className="relative bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{recommendation.name}</h3>
                      {recommendation.symbol && (
                        <span className="font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                          {recommendation.symbol}
                        </span>
                      )}
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        AI Rekommendation
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-3">
                      {recommendation.purchase_price && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Riktkurs: {formatCurrency(recommendation.purchase_price)}
                        </span>
                      )}
                      {recommendation.sector && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {recommendation.sector}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={primaryButtonClass}
                      onClick={() => handleDiscussHolding(recommendation.name, recommendation.symbol)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Diskutera
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300"
                      onClick={() => handleAddFromRecommendation(recommendation)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Lägg till
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={dangerButtonClass}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Radera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera rekommendation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill radera rekommendationen för <strong>{recommendation.name}</strong>? 
                            Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteHolding(recommendation.id, recommendation.name)}
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

      {/* Dialogs */}
      <AddHoldingDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        recommendation={selectedRecommendation}
      />

      <EditHoldingDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedHolding(null);
        }}
        onSave={handleSaveHolding}
        holding={selectedHolding}
      />
    </div>
  );
};

export default PortfolioOverview;
