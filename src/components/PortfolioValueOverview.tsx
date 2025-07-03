
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';

const PortfolioValueOverview: React.FC = () => {
  const { portfolioSummary, loading, lastUpdated, exchangeRate, refreshPrices } = usePortfolioValue();

  const formatCurrency = (amount: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (!portfolioSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
            Portföljvärde
          </CardTitle>
          <CardDescription>Lägg till innehav för att se ditt portföljvärde</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                Portföljvärde
              </CardTitle>
              <CardDescription>
                Sammanfattning av dina innehav (1 USD = {exchangeRate.toFixed(2)} SEK)
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Senast uppdaterad: {lastUpdated.toLocaleTimeString('sv-SE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={refreshPrices}
              disabled={loading}
              className="text-xs shrink-0 w-8 h-8 p-0"
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nuvarande värde</p>
              <p className="text-lg font-semibold">{formatCurrency(portfolioSummary.totalValue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Totalt investerat</p>
              <p className="text-lg font-medium">{formatCurrency(portfolioSummary.totalCost)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {portfolioSummary.totalProfitLoss >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                portfolioSummary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(portfolioSummary.totalProfitLoss)}
              </span>
              <Badge 
                variant="outline" 
                className={`${
                  portfolioSummary.totalProfitLoss >= 0 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {formatPercentage(portfolioSummary.totalProfitLossPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Innehav i detalj</CardTitle>
          <CardDescription>Individuell utveckling per innehav</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-green-600" />
              <p className="text-sm text-muted-foreground">Uppdaterar priser...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolioSummary.holdingsWithValues.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {holding.name}
                      {!holding.hasValidPrice && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {holding.symbol && `${holding.symbol} • `}
                      {holding.quantity} st @ {formatCurrency(holding.purchasePrice)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {holding.hasValidPrice ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {formatCurrency(holding.totalValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(holding.currentPrice)} per aktie
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          {holding.profitLoss >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${
                            holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossPercent)})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-amber-600 font-medium">
                          {holding.errorMessage}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Kostnad: {formatCurrency(holding.totalCost)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioValueOverview;
