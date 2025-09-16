import React, { useState, useEffect } from 'react';
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
  Activity,
  RefreshCw,
  LogIn,
  AlertTriangle,
} from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StockPrice {
  symbol: string | null;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  hasValidPrice: boolean;
  errorMessage?: string;
  lastUpdated?: string;
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
      const symbolsToFetch = actualHoldings.map((holding) => {
        return {
          searchTerm: holding.symbol || holding.name,
          holding,
        };
      });

      const pricePromises = symbolsToFetch.map(async ({ searchTerm, holding }) => {
        try {
          if (!searchTerm) {
            return {
              symbol: null,
              name: holding.name || 'Okänt innehav',
              price: null,
              change: null,
              changePercent: null,
              currency: holding.currency || null,
              hasValidPrice: false,
              errorMessage: 'Ingen giltig ticker-symbol angiven',
            };
          }

          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol: searchTerm },
          });

          if (error || !data) {
            return {
              symbol: searchTerm,
              name: holding.name || searchTerm,
              price: null,
              change: null,
              changePercent: null,
              currency: holding.currency || null,
              hasValidPrice: false,
              errorMessage: 'Pris kunde inte hämtas – kontrollera symbolen',
            };
          }

          const quote = data as {
            symbol: string | null;
            name?: string;
            price: number | null;
            change: number | null;
            changePercent: number | null;
            currency: string | null;
            hasValidPrice: boolean;
            error?: string;
            lastUpdated?: string;
          };

          if (!quote.hasValidPrice || quote.price === null) {
            return {
              symbol: quote.symbol || searchTerm,
              name: holding.name || quote.name || searchTerm,
              price: null,
              change: null,
              changePercent: null,
              currency: quote.currency || holding.currency || null,
              hasValidPrice: false,
              errorMessage: quote.error || 'Pris kunde inte hämtas från Yahoo Finance',
              lastUpdated: quote.lastUpdated,
            };
          }

          return {
            symbol: quote.symbol || searchTerm,
            name: holding.name || quote.name || searchTerm,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            currency: quote.currency || holding.currency || null,
            hasValidPrice: true,
            lastUpdated: quote.lastUpdated,
          };
        } catch (err) {
          return {
            symbol: searchTerm,
            name: holding.name || searchTerm,
            price: null,
            change: null,
            changePercent: null,
            currency: holding.currency || null,
            hasValidPrice: false,
            errorMessage: 'Tekniskt fel vid prisinhämtning',
          };
        }
      });

      const results = await Promise.all(pricePromises);
      setPrices(results);
      setLastUpdated(
        new Date().toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err) {
      console.error('Fel vid hämtning av priser:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && actualHoldings.length > 0) {
      fetchPrices();
    }
  }, [user, actualHoldings]);

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) {
      return '–';
    }

    const currencyCode = currency || 'SEK';

    try {
      const formatter = new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return formatter.format(amount);
    } catch (error) {
      console.warn('Failed to format currency', error);
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  const formatPercentage = (percent: number | null) => {
    if (percent === null || Number.isNaN(percent)) {
      return '–';
    }

    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-5 h-5 text-green-600" /> Aktuella Priser
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
              <LogIn className="w-4 h-4 mr-2" /> Logga in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="w-5 h-5 text-green-600 flex-shrink-0" /> 
              <span className="truncate">Aktuella Priser</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              <span className="block">Realtidspriser för dina innehav via Yahoo Finance</span>
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
              <div
                key={`${stock.symbol ?? 'UNKNOWN'}-${stock.name}`}
                className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg gap-2 min-w-0"
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="font-medium text-xs sm:text-sm flex items-center gap-2">
                    <span className="truncate">{stock.name}</span>
                    {!stock.hasValidPrice && (
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(stock.symbol ?? 'Okänd symbol')} • {(stock.currency ?? 'Okänd valuta')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 min-w-0">
                  {stock.hasValidPrice ? (
                    <>
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {formatCurrency(stock.price, stock.currency)}
                      </div>
                      {typeof stock.changePercent === 'number' ? (
                        <div className="flex items-center gap-1 justify-end">
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs whitespace-nowrap ${
                              stock.changePercent >= 0
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {formatPercentage(stock.changePercent)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Ingen kursförändring tillgänglig</div>
                      )}
                    </>
                  ) : (
                    <div className="text-center max-w-[120px] sm:max-w-none">
                      <div className="text-xs text-amber-600 font-medium truncate">
                        {stock.errorMessage || 'Pris saknas'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Kontrollera symbol
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
