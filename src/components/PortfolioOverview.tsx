import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Plus,
  BarChart3,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import { calculatePortfolioMetrics } from '@/lib/portfolioCalculations';
import { useNavigate } from 'react-router-dom';
import EditHoldingDialog from '@/components/EditHoldingDialog';
import AddHoldingDialog from '@/components/AddHoldingDialog';

interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio,
  onQuickChat,
  onActionClick,
}) => {
  const { actualHoldings, addHolding, updateHolding, deleteHolding, refetch } = useUserHoldings();
  const navigate = useNavigate();

  const [editingHolding, setEditingHolding] = useState<UserHolding | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleQuickChat = (message: string) => {
    onQuickChat(message);
  };

  const handleActionClick = (action: string) => {
    onActionClick(action);
  };

  const calculatePortfolioMetricsData = () => {
    return calculatePortfolioMetrics(actualHoldings);
  };

  const { totalInvested, currentValue, totalReturn, totalReturnPercentage } = calculatePortfolioMetricsData();

  const handleAddHolding = async (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const success = await addHolding(holdingData);
    if (success) {
      // Refresh the data to show the new holding and update recommendations
      refetch();
    }
    return success;
  };

  const handleUpdateHolding = async (holdingData: Partial<UserHolding>) => {
    if (!editingHolding) return;
    
    const success = await updateHolding(editingHolding.id, holdingData);
    if (success) {
      setIsEditDialogOpen(false);
      setEditingHolding(null);
      refetch();
    }
  };

  const handleEditClick = (holding: UserHolding) => {
    setEditingHolding(holding);
    setIsEditDialogOpen(true);
  };

  const handleDeleteHolding = async (id: string) => {
    const success = await deleteHolding(id);
    if (success) {
      refetch();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="space-y-1 sm:space-y-2 pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            Portföljöversikt
          </CardTitle>
          <CardDescription>
            En sammanfattning av din nuvarande portfölj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Invested */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Investerat Totalt
              </div>
              <div className="text-sm sm:text-base font-medium">
                {totalInvested.toLocaleString('sv-SE', {
                  style: 'currency',
                  currency: 'SEK',
                })}
              </div>
            </div>

            {/* Current Value */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Nuvarande Värde
              </div>
              <div className="text-sm sm:text-base font-medium">
                {currentValue.toLocaleString('sv-SE', {
                  style: 'currency',
                  currency: 'SEK',
                })}
              </div>
            </div>

            {/* Total Return */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Avkastning
              </div>
              <div className={`text-sm sm:text-base font-medium flex items-center gap-1 ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {totalReturn.toLocaleString('sv-SE', {
                    style: 'currency',
                    currency: 'SEK',
                  })}
                  ({totalReturnPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Metrics Overview */}
      {actualHoldings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Portföljens Prestanda
            </CardTitle>
            <CardDescription>
              En översikt över din portföljs viktigaste mätvärden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Total Invested */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Investerat Totalt
                </div>
                <div className="text-sm sm:text-base font-medium">
                  {totalInvested.toLocaleString('sv-SE', {
                    style: 'currency',
                    currency: 'SEK',
                  })}
                </div>
              </div>

              {/* Current Value */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Nuvarande Värde
                </div>
                <div className="text-sm sm:text-base font-medium">
                  {currentValue.toLocaleString('sv-SE', {
                    style: 'currency',
                    currency: 'SEK',
                  })}
                </div>
              </div>

              {/* Total Return */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Total Avkastning
                </div>
                <div className={`text-sm sm:text-base font-medium flex items-center gap-1 ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {totalReturn.toLocaleString('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    })}
                    ({totalReturnPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Snabbåtgärder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs sm:text-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Lägg till innehav</span>
              <span className="sm:hidden">Lägg till</span>
            </Button>
            
            <Button 
              onClick={() => handleQuickChat('Analysera min portfölj och ge förbättringsförslag')}
              className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analysera portfölj</span>
              <span className="sm:hidden">Analysera</span>
            </Button>
            
            <Button 
              onClick={() => handleQuickChat('Föreslå rebalansering av min portfölj')}
              className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs sm:text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Rebalansera</span>
              <span className="sm:hidden">Balansera</span>
            </Button>
            
            <Button 
              onClick={() => handleQuickChat('Beräkna min risk och föreslå justeringar')}
              className="h-auto py-3 px-3 flex flex-col items-center gap-2 text-xs sm:text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              variant="outline"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Riskanalys</span>
              <span className="sm:hidden">Risk</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Table */}
      {actualHoldings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Mina Innehav ({actualHoldings.length})
            </CardTitle>
            <CardDescription>
              Dina nuvarande investeringar och deras prestanda
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium">Innehav</th>
                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium">Antal</th>
                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium">Köppris</th>
                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium">Värde</th>
                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {actualHoldings.map((holding) => {
                    const currentValue = holding.current_value || (holding.quantity && holding.purchase_price ? holding.quantity * holding.purchase_price : 0);
                    const purchaseValue = holding.quantity && holding.purchase_price ? holding.quantity * holding.purchase_price : 0;
                    const change = currentValue - purchaseValue;
                    const changePercent = purchaseValue > 0 ? (change / purchaseValue) * 100 : 0;

                    return (
                      <tr key={holding.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 sm:p-4">
                          <div>
                            <div className="font-medium text-sm">{holding.name}</div>
                            {holding.symbol && (
                              <div className="text-xs text-muted-foreground">{holding.symbol}</div>
                            )}
                            <div className="text-xs text-muted-foreground capitalize">
                              {holding.holding_type === 'stock' ? 'Aktie' : 
                               holding.holding_type === 'fund' ? 'Fond' :
                               holding.holding_type === 'crypto' ? 'Krypto' :
                               holding.holding_type === 'bonds' ? 'Obligation' :
                               holding.holding_type === 'real_estate' ? 'Fastighet' : 'Övrigt'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="text-sm">
                            {holding.quantity ? holding.quantity.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) : '-'}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="text-sm">
                            {holding.purchase_price ? 
                              `${holding.purchase_price.toLocaleString('sv-SE', { 
                                style: 'currency', 
                                currency: holding.currency || 'SEK' 
                              })}` : '-'
                            }
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="text-sm font-medium">
                            {currentValue > 0 ? 
                              currentValue.toLocaleString('sv-SE', { 
                                style: 'currency', 
                                currency: holding.currency || 'SEK' 
                              }) : '-'
                            }
                          </div>
                          {change !== 0 && (
                            <div className={`text-xs flex items-center justify-end gap-1 ${
                              change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {change >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {change >= 0 ? '+' : ''}{change.toLocaleString('sv-SE', { 
                                  style: 'currency', 
                                  currency: holding.currency || 'SEK' 
                                })} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(holding)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {portfolio?.recommendations && portfolio?.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              AI Rekommendationer
            </CardTitle>
            <CardDescription>
              Baserat på din profil och mål, här är några rekommendationer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-none pl-0 space-y-2">
              {portfolio.recommendations.map((recommendation: any) => (
                <li key={recommendation.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium text-sm">{recommendation.name}</div>
                    <div className="text-xs text-muted-foreground">{recommendation.description}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/ai-chat')}>
                    Läs mer
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Informational Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            Tips & Insikter
          </CardTitle>
          <CardDescription>
            Få ut det mesta av din portfölj med dessa användbara tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 space-y-2 text-sm">
            <li>
              Diversifiera dina investeringar för att minska risken.
            </li>
            <li>
              Se över din portfölj regelbundet för att säkerställa att den
              fortfarande passar dina mål.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Add dialogs */}
      <AddHoldingDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddHolding}
      />

      <EditHoldingDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingHolding(null);
        }}
        onSave={handleUpdateHolding}
        holding={editingHolding}
      />
    </div>
  );
};

export default PortfolioOverview;
