
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, RefreshCw, LogIn, AlertTriangle } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { portfolioSummary, loading, lastUpdated, exchangeRate, refreshPrices } = usePortfolioValue();

  const formatCurrency = (amount: number, currency: string = 'SEK', showCurrency: boolean = true) => {
    const currencyCode = currency === 'SEK' ? 'SEK' : 'USD';
    const formatter = new Intl.NumberFormat('sv-SE', {
      style: showCurrency ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits: currency === 'SEK' ? 0 : 2,
      maximumFractionDigits: currency === 'SEK' ? 2 : 2
    });
    return formatter.format(amount);
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-5 h-5 text-green-600" />
            Aktuella Priser
          </CardTitle>
          <CardDescription>Realtidspriser för dina innehav</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Logga in för att se aktuella priser för dina aktier
            </p>
            <Button onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4 mr-2" />
              Logga in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="w-5 h-5 text-green-600" />
              Aktuella Priser & Utveckling
            </CardTitle>
            <CardDescription>
              Realtidspriser med vinst/förlust-beräkning (1 USD = {exchangeRate.toFixed(2)} SEK)
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
            disabled={loading || holdingsLoading}
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
      <CardContent>
        {holdingsLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Laddar innehav...</p>
          </div>
        ) : actualHoldings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Lägg till innehav för att se aktuella priser och utveckling</p>
          </div>
        ) : loading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Hämtar aktuella priser...</p>
          </div>
        ) : portfolioSummary?.holdingsWithValues.length ? (
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
                    {holding.quantity} aktier @ {formatCurrency(holding.purchasePrice)}
                  </div>
                </div>
                <div className="text-right">
                  {holding.hasValidPrice ? (
                    <>
                      <div className="font-medium text-sm mb-1">
                        {formatCurrency(holding.currentPrice)} per aktie
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Totalt värde: {formatCurrency(holding.totalValue)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        {holding.profitLoss >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <div className="text-right">
                          <div className={`text-xs font-medium ${
                            holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(holding.profitLoss)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              holding.profitLoss >= 0 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {formatPercentage(holding.profitLossPercent)}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm text-amber-600 font-medium">
                        {holding.errorMessage || "Pris saknas - lägg in rätt ticker"}
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Inga priser att visa</p>
            <p className="text-xs">Kontrollera att dina innehav har korrekta symboler</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsPrices;
