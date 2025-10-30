import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, LogIn } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, resolveHoldingValue } from '@/utils/currencyUtils';
import { supabase } from '@/integrations/supabase/client';

type LivePriceMap = Record<string, { price: number; currency: string | null } | undefined>;

const CurrentHoldingsPrices: React.FC = () => {
  const { actualHoldings, loading: holdingsLoading } = useUserHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [livePrices, setLivePrices] = useState<LivePriceMap>({});
  const [livePriceState, setLivePriceState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setLivePrices({});
      setLivePriceState({ loading: false, error: null });
    }
  }, [user]);

  useEffect(() => {
    if (!user || holdingsLoading) {
      return;
    }

    const symbols = Array.from(
      new Set(
        actualHoldings
          .map((holding) => (typeof holding.symbol === 'string' ? holding.symbol.trim().toUpperCase() : ''))
          .filter((symbol) => symbol.length > 0)
      )
    );

    if (symbols.length === 0) {
      setLivePrices({});
      setLivePriceState((prev) => (prev.loading || prev.error ? { loading: false, error: null } : prev));
      return;
    }

    let isMounted = true;
    setLivePriceState({ loading: true, error: null });

    (async () => {
      const nextPrices: LivePriceMap = {};
      let encounteredError: string | null = null;

      for (const symbol of symbols) {
        try {
          const { data, error } = await supabase.functions.invoke<{
            success?: boolean;
            symbol?: string;
            price?: number | null;
            currency?: string | null;
            error?: string;
          }>('get-ticker-price', {
            body: { symbol },
          });

          if (error) {
            console.warn('Edge function error when fetching Finnhub price for', symbol, error);
            if (!encounteredError) {
              encounteredError = error.message ?? 'Kunde inte hämta live-priser just nu.';
            }
            continue;
          }

          const rawPrice = typeof data?.price === 'number' && Number.isFinite(data.price) && data.price > 0
            ? data.price
            : null;

          if (rawPrice === null) {
            if (data?.error && !encounteredError) {
              encounteredError = data.error;
            }
            continue;
          }

          const resolvedCurrency = typeof data?.currency === 'string' && data.currency.trim().length > 0
            ? data.currency.trim().toUpperCase()
            : null;

          nextPrices[symbol] = { price: rawPrice, currency: resolvedCurrency };
        } catch (err) {
          console.error('Unexpected error fetching Finnhub price for', symbol, err);
          if (!encounteredError) {
            encounteredError = err instanceof Error ? err.message : 'Ett oväntat fel uppstod vid prisuppdateringen.';
          }
        }
      }

      if (!isMounted) {
        return;
      }

      if (Object.keys(nextPrices).length > 0) {
        setLivePrices((prev) => ({ ...prev, ...nextPrices }));
      }

      setLivePriceState({
        loading: false,
        error: encounteredError,
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [actualHoldings, holdingsLoading, user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-5 h-5 text-green-600" /> Aktuella priser
          </CardTitle>
          <CardDescription>Logga in för att se dina innehavs senaste priser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <LogIn className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inloggning krävs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Logga in för att se de senaste priserna för dina innehav
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4 mr-2" /> Logga in
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pricedHoldings = useMemo(() => {
    return actualHoldings
      .filter((holding) => holding.holding_type !== 'cash')
      .map((holding) => {
        const normalizedSymbol = typeof holding.symbol === 'string' ? holding.symbol.trim().toUpperCase() : '';
        const live = normalizedSymbol ? livePrices[normalizedSymbol] : undefined;

        const holdingWithLivePrice = live
          ? {
              ...holding,
              current_price_per_unit: live.price,
              price_currency: live.currency ?? holding.price_currency ?? holding.currency,
            }
          : holding;

        const {
          pricePerUnit,
          priceCurrency,
          pricePerUnitInSEK,
          valueInOriginalCurrency,
          valueCurrency,
          valueInSEK,
        } = resolveHoldingValue(holdingWithLivePrice);

        return {
          id: holding.id,
          name: holding.name,
          symbol: holding.symbol,
          price: pricePerUnit,
          currency: priceCurrency,
          priceInSEK: pricePerUnitInSEK,
          valueOriginal: valueInOriginalCurrency,
          valueCurrency,
          valueSEK: valueInSEK,
        };
      });
  }, [actualHoldings, livePrices]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="w-5 h-5 text-green-600" /> Aktuella priser
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {livePriceState.loading
            ? 'Hämtar live-priser från Finnhub...'
            : livePriceState.error
              ? livePriceState.error
              : 'Visar senaste registrerade prisuppgifter.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {holdingsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            <p>Laddar dina innehav...</p>
          </div>
        ) : pricedHoldings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Lägg till innehav för att se lagrade priser.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pricedHoldings.map((holding) => (
              <div
                key={holding.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{holding.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {holding.symbol || 'Symbol saknas'} • {holding.currency}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">
                    {holding.price !== null && typeof holding.price === 'number' && holding.price > 0
                      ? (
                        <>
                          {formatCurrency(holding.price, holding.currency)}
                          {holding.currency !== 'SEK' && holding.priceInSEK !== null && holding.priceInSEK > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ≈ {formatCurrency(holding.priceInSEK, 'SEK')}
                            </span>
                          )}
                        </>
                      )
                      : 'Pris saknas'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Värde: {formatCurrency(holding.valueSEK, 'SEK')}
                    {holding.valueCurrency !== 'SEK' && holding.valueOriginal > 0 && (
                      <span className="ml-1">
                        ({formatCurrency(holding.valueOriginal, holding.valueCurrency)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentHoldingsPrices;
