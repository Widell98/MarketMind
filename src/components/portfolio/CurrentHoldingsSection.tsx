
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Package2, Coins, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { formatCurrency } from '@/utils/currencyUtils';

interface CurrentHoldingsSectionProps {
  onQuickChat?: (message: string) => void;
  onActionClick?: (action: string) => void;
}

const CurrentHoldingsSection: React.FC<CurrentHoldingsSectionProps> = ({
  onQuickChat,
  onActionClick
}) => {
  const { actualHoldings, loading } = useUserHoldings();
  const { performance, updating, updatePrices } = usePortfolioPerformance();

  // Filter out recommendations
  const currentHoldings = actualHoldings.filter(holding => 
    holding.holding_type !== 'recommendation'
  );

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const calculatePerformancePercentage = (holding: any) => {
    if (!holding.purchase_price || !holding.current_value || !holding.quantity) {
      return 0;
    }
    const totalPurchaseValue = holding.purchase_price * holding.quantity;
    return ((holding.current_value - totalPurchaseValue) / totalPurchaseValue) * 100;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Aktuella Innehav</CardTitle>
              <CardDescription className="text-sm">
                {currentHoldings.length} aktiva innehav
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={updatePrices}
              disabled={updating}
              className="text-xs"
            >
              {updating ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Uppdatera
            </Button>
            <Button
              size="sm"
              onClick={() => onActionClick?.('add_holding')}
              className="text-xs"
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              Lägg till
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Laddar innehav...</p>
          </div>
        ) : currentHoldings.length > 0 ? (
          <div className="space-y-3">
            {currentHoldings.slice(0, 5).map((holding) => {
              const performancePercentage = calculatePerformancePercentage(holding);
              
              return (
                <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{holding.name}</h4>
                      {holding.symbol && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {holding.symbol}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {holding.sector && <span>{holding.sector}</span>}
                      {holding.quantity && <span>• {holding.quantity} st</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {formatCurrency(holding.current_value || 0)}
                      </span>
                      {getTrendIcon(performancePercentage)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {holding.purchase_price && holding.current_value && holding.quantity && (
                        <span className={
                          performancePercentage >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          {performancePercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentHoldings.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onActionClick?.('view_all_holdings')}
                  className="text-xs"
                >
                  Visa alla {currentHoldings.length} innehav
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <Coins className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-medium text-sm mb-1">Inga innehav än</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Lägg till dina första investeringar för att börja spåra din portfölj
              </p>
              <Button
                size="sm"
                onClick={() => onActionClick?.('add_holding')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Lägg till innehav
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsSection;
