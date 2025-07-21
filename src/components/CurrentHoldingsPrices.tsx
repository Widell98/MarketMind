
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
  priceInSEK: number;
  changeInSEK: number;
  hasValidPrice: boolean;
}

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(10.5); // Default USD/SEK rate

  const fetchExchangeRate = async () => {
    try {
      // Use a more stable exchange rate API or cache the rate for longer periods
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.SEK) {
        const newRate = data.rates.SEK;
        // Only update if the rate has changed significantly (more than 1%) to avoid frequent updates
        if (Math.abs(newRate - exchangeRate) / exchangeRate > 0.01) {
          setExchangeRate(newRate);
          console.log(`Updated exchange rate from ${exchangeRate.toFixed(2)} to ${newRate.toFixed(2)} SEK/USD`);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using current rate:', exchangeRate, error);
    }
  };

  const fetchPrices = async () => {
    if (!user || actualHoldings.length === 0) return;

    setLoading(true);
    try {
      // Fetch exchange rate first but don't wait for it to complete entirely
      await fetchExchangeRate();

      // Get unique symbols from holdings, prioritize symbol over name
      const symbolsToFetch = [...new Set(actualHoldings
        .filter(holding => holding.symbol || holding.name)
        .map(holding => holding.symbol || holding.name)
        .filter(Boolean)
      )];

      if (symbolsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      console.log('Fetching prices for symbols:', symbolsToFetch);

      // Fetch prices for all symbols
      const pricePromises = symbolsToFetch.map(async (symbol) => {
        try {
          console.log(`Making API call for symbol: ${symbol}`);
          
          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol: symbol }
          });

          if (error) {
            console.error(`API error for ${symbol}:`, error);
            throw error;
          }

          console.log(`API response for ${symbol}:`, data);

          const holding = actualHoldings.find(h => h.symbol === symbol || h.name === symbol);
          const holdingCurrency = holding?.currency || 'SEK';
          const quoteCurrency = data.currency || 'USD';
          
          // Check if we got valid price data
          const hasValidPrice = data && typeof data.price === 'number' && data.price > 0;
          
          let priceInSEK = data.price || 0;
          let changeInSEK = data.change || 0;

          // Convert to SEK if needed and we have valid data
          if (hasValidPrice) {
            if (quoteCurrency === 'USD' && holdingCurrency === 'SEK') {
              priceInSEK = data.price * exchangeRate;
              changeInSEK = data.change * exchangeRate;
            } else if (quoteCurrency === 'SEK' && holdingCurrency === 'USD') {
              priceInSEK = data.price;
              changeInSEK = data.change;
            }
          }

          return {
            symbol: data.symbol || symbol,
            name: data.name || holding?.name || symbol,
            price: data.price || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            currency: quoteCurrency,
            priceInSEK,
            changeInSEK,
            hasValidPrice
          };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          
          // Return a placeholder with invalid price indicator
          const holding = actualHoldings.find(h => h.symbol === symbol || h.name === symbol);
          return {
            symbol: symbol,
            name: holding?.name || symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            currency: holding?.currency || 'SEK',
            priceInSEK: 0,
            changeInSEK: 0,
            hasValidPrice: false
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const validResults = results.filter((price): price is StockPrice => price !== null);
      
      setPrices(validResults);
      setLastUpdated(new Date().toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      console.log('Final price results:', validResults);
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
              Realtidspriser för dina innehav (1 USD = {exchangeRate.toFixed(2)} SEK)
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
            {prices.map((stock) => {
              const holding = actualHoldings.find(h => h.symbol === stock.symbol || h.name === stock.symbol);
              const holdingCurrency = holding?.currency || 'SEK';
              const displayPrice = holdingCurrency === 'SEK' && stock.currency === 'USD' ? stock.priceInSEK : stock.price;
              const displayChange = holdingCurrency === 'SEK' && stock.currency === 'USD' ? stock.changeInSEK : stock.change;
              
              return (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{stock.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stock.symbol} • {stock.currency}
                      {stock.currency !== holdingCurrency && (
                        <span className="ml-1 text-blue-600">→ {holdingCurrency}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {stock.hasValidPrice ? (
                      <>
                        <div className="font-medium text-sm">
                          {formatCurrency(displayPrice || 0, holdingCurrency)}
                          {stock.currency !== holdingCurrency && (
                            <div className="text-xs text-muted-foreground">
                              ({formatCurrency(stock.price, stock.currency)})
                            </div>
                          )}
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
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground font-medium">Saknar exakt pris</div>
                        <div className="text-xs text-muted-foreground">API-data ej tillgänglig</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
