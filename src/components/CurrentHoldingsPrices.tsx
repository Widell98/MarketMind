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
      <Card className="h-fit">
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
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Aktuella Priser
            </CardTitle>
            <CardDescription className="text-sm">
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
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>API-fel:</strong> {error}
            <div className="text-xs mt-1">Kontrollera att Alpha Vantage API-nyckeln är konfigurerad korrekt.</div>
          </div>
        )}
        
        {loading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Hämtar aktuella priser från Alpha Vantage API...
          </div>
        )}
        
        <div className="space-y-3">
          {holdingsWithSymbols.map(holding => {
            const quote = quotes[holding.symbol];
            const quantity = holding.quantity || 1;
            
            console.log(`Holding ${holding.symbol}:`, { quote, quantity });
            
            return (
              <div key={holding.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{holding.name}</h3>
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                        {holding.symbol}
                      </span>
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
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    {loading && !quote ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ) : quote ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(quote.price)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Live
                          </Badge>
                        </div>
                        
                        {holding.quantity && (
                          <div className="text-sm text-gray-600 text-right">
                            Totalt värde: <span className="font-medium">{formatCurrency(quote.price * quantity)}</span>
                          </div>
                        )}
                        
                        {/* Dagens förändring */}
                        <div className={`text-sm flex items-center justify-end gap-1 ${
                          quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {quote.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-medium">
                            {quote.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(quote.change))} 
                            ({Math.abs(quote.changePercent).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center">
                        <div className="text-gray-400">Ingen data</div>
                        <div className="text-xs text-gray-400">Kontrollera: {holding.symbol}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {holdingsWithSymbols.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            Inga aktier med symboler hittades. Lägg till aktiesymboler (t.ex. AAPL, MSFT) för att se aktuella priser.
          </div>
        )}

        {holdingsWithSymbols.length > 0 && Object.keys(quotes).length === 0 && !loading && (
          <div className="text-center py-4 text-amber-700 text-sm bg-amber-50 rounded-lg border border-amber-200">
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
