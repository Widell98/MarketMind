
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, RefreshCw, LogIn } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPrices = async () => {
    if (!user || actualHoldings.length === 0) return;

    setLoading(true);
    try {
      // Get unique symbols from holdings
      const symbols = [...new Set(actualHoldings
        .filter(holding => holding.symbol)
        .map(holding => holding.symbol!)
      )];

      if (symbols.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch prices for all symbols
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol }
          });

          if (error) throw error;

          return {
            symbol: data.symbol,
            name: data.name || symbol,
            price: data.price || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            currency: data.currency || 'SEK'
          };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(pricePromises);
      const validPrices = results.filter((price): price is StockPrice => price !== null);
      
      setPrices(validPrices);
      setLastUpdated(new Date().toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && actualHoldings.length > 0) {
      fetchPrices();
    }
  }, [user, actualHoldings]);

  const formatCurrency = (amount: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency === 'SEK' ? 'SEK' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Show login prompt if user is not authenticated
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
              Aktuella Priser
            </CardTitle>
            <CardDescription>
              Realtidspriser för dina innehav
              {lastUpdated && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Senast uppdaterad: {lastUpdated}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={fetchPrices}
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
            <p>Lägg till innehav för att se aktuella priser</p>
          </div>
        ) : loading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Hämtar aktuella priser...</p>
          </div>
        ) : prices.length > 0 ? (
          <div className="space-y-3">
            {prices.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{stock.name}</div>
                  <div className="text-xs text-muted-foreground">{stock.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(stock.price, stock.currency)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    {stock.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        stock.changePercent >= 0 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {formatPercentage(stock.changePercent)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Inga priser att visa</p>
            <p className="text-xs">Kontrollera att dina innehav har korrekta symbolar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsPrices;
