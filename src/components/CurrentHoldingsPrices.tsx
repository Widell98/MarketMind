
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  DollarSign,
  Clock
} from 'lucide-react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { useUserHoldings } from '@/hooks/useUserHoldings';

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { quotes, loading, error, refreshData } = useRealTimeMarketData();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch data when holdings are loaded
  useEffect(() => {
    if (actualHoldings.length > 0 && !holdingsLoading) {
      console.log('Fetching market data for holdings:', actualHoldings.map(h => h.symbol).filter(Boolean));
      refreshData(actualHoldings);
      setLastRefresh(new Date());
    }
  }, [actualHoldings, holdingsLoading, refreshData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (actualHoldings.length > 0) {
        console.log('Auto-refreshing market data...');
        refreshData(actualHoldings);
        setLastRefresh(new Date());
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [actualHoldings, refreshData]);

  const handleManualRefresh = () => {
    if (actualHoldings.length > 0) {
      console.log('Manual refresh triggered');
      refreshData(actualHoldings);
      setLastRefresh(new Date());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateReturns = (currentPrice: number, purchasePrice: number, quantity: number = 1) => {
    const currentValue = currentPrice * quantity;
    const purchaseValue = purchasePrice * quantity;
    const absoluteReturn = currentValue - purchaseValue;
    const percentageReturn = purchaseValue > 0 ? (absoluteReturn / purchaseValue) * 100 : 0;
    
    return {
      currentValue,
      purchaseValue,
      absoluteReturn,
      percentageReturn
    };
  };

  if (holdingsLoading || actualHoldings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Aktuella Priser
          </CardTitle>
          <CardDescription>Realtidspriser på dina innehav</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {holdingsLoading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Laddar innehav...</span>
              </div>
            ) : (
              <div>
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Lägg till aktier för att se aktuella priser</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const holdingsWithSymbols = actualHoldings.filter(holding => holding.symbol);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Aktuella Priser
            </CardTitle>
            <CardDescription>
              Realtidsdata från Alpha Vantage • Senast uppdaterad: {formatTime(lastRefresh)}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>API-fel:</strong> {error}
            <div className="text-xs mt-1">Kontrollera att Alpha Vantage API-nyckeln är konfigurerad korrekt.</div>
          </div>
        )}
        
        {loading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Hämtar aktuella priser från Alpha Vantage API...
          </div>
        )}
        
        <div className="space-y-3">
          {holdingsWithSymbols.map(holding => {
            const quote = quotes[holding.symbol];
            const purchasePrice = holding.purchase_price || 0;
            const quantity = holding.quantity || 1;
            
            console.log(`Holding ${holding.symbol}:`, { quote, purchasePrice, quantity });
            
            let returns = null;
            if (quote && purchasePrice > 0) {
              returns = calculateReturns(quote.price, purchasePrice, quantity);
            }
            
            return (
              <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{holding.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-mono bg-gray-100 px-1 rounded text-xs">{holding.symbol}</span>
                    {holding.quantity && (
                      <span>• {holding.quantity} aktier</span>
                    )}
                    {purchasePrice > 0 && (
                      <span>• Köpt för {formatCurrency(purchasePrice)}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {loading && !quote ? (
                    <div className="animate-pulse">
                      <div className="h-5 bg-muted rounded w-16 mb-1"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </div>
                  ) : quote ? (
                    <>
                      <div className="font-medium">
                        <div className="flex items-center gap-1">
                          <span>{formatCurrency(quote.price)}</span>
                          <span className="text-xs text-muted-foreground">
                            (API)
                          </span>
                        </div>
                        {holding.quantity && (
                          <div className="text-xs text-muted-foreground">
                            Totalt värde: {formatCurrency(quote.price * quantity)}
                          </div>
                        )}
                      </div>
                      
                      {/* Daily change from API */}
                      <div className={`text-sm flex items-center gap-1 justify-end ${
                        quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {quote.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {quote.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(quote.change))} 
                          ({Math.abs(quote.changePercent).toFixed(2)}%)
                        </span>
                      </div>

                      {/* Total return since purchase */}
                      {returns && returns.absoluteReturn !== 0 && (
                        <div className={`text-xs mt-1 flex items-center gap-1 justify-end ${
                          returns.absoluteReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <Badge variant="outline" className={`text-xs px-1 py-0 ${
                            returns.absoluteReturn >= 0 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            Avkastning: {returns.absoluteReturn >= 0 ? '+' : ''}{formatCurrency(returns.absoluteReturn)} 
                            ({returns.percentageReturn >= 0 ? '+' : ''}{returns.percentageReturn.toFixed(1)}%)
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <div>Ingen data tillgänglig</div>
                      <div className="text-xs">Kontrollera symbol: {holding.symbol}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {holdingsWithSymbols.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Inga aktier med symboler hittades. Lägg till aktiesymboler (t.ex. AAPL, MSFT) för att se aktuella priser.
          </div>
        )}

        {holdingsWithSymbols.length > 0 && Object.keys(quotes).length === 0 && !loading && (
          <div className="text-center py-4 text-amber-600 text-sm bg-amber-50 rounded-lg border border-amber-200">
            <div className="font-medium">Inga priser hämtades från API</div>
            <div className="text-xs mt-1">
              Kontrollera att Alpha Vantage API-nyckeln är konfigurerad och att aktiesymbolerna är korrekta.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsPrices;
