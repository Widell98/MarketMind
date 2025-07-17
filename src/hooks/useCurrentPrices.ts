
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  errorMessage?: string;
}

export const useCurrentPrices = (holdings: any[]) => {
  const { user } = useAuth();
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(10.5);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.SEK) {
        const newRate = data.rates.SEK;
        if (Math.abs(newRate - exchangeRate) / exchangeRate > 0.01) {
          setExchangeRate(newRate);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
    }
  };

  const fetchPrices = async () => {
    if (!user || holdings.length === 0) return;

    const securitiesWithSymbols = holdings.filter(h => h.symbol && !h.is_cash);
    if (securitiesWithSymbols.length === 0) return;

    setLoading(true);
    try {
      await fetchExchangeRate();

      const pricePromises = securitiesWithSymbols.map(async (holding) => {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol: holding.symbol },
          });

          if (error || !data || typeof data.price !== 'number') {
            return {
              symbol: holding.symbol,
              result: {
                symbol: holding.symbol,
                name: holding.name,
                price: 0,
                change: 0,
                changePercent: 0,
                currency: holding.currency || 'SEK',
                priceInSEK: 0,
                changeInSEK: 0,
                hasValidPrice: false,
                errorMessage: 'Pris kunde inte hämtas',
              }
            };
          }

          const holdingCurrency = holding.currency || 'SEK';
          const quoteCurrency = data.currency || 'USD';
          const convertedToSEK = quoteCurrency === 'USD' && holdingCurrency === 'SEK';

          return {
            symbol: holding.symbol,
            result: {
              symbol: data.symbol || holding.symbol,
              name: holding.name,
              price: data.price,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              currency: quoteCurrency,
              priceInSEK: convertedToSEK ? data.price * exchangeRate : data.price,
              changeInSEK: convertedToSEK ? (data.change || 0) * exchangeRate : (data.change || 0),
              hasValidPrice: true,
            }
          };
        } catch (err) {
          return {
            symbol: holding.symbol,
            result: {
              symbol: holding.symbol,
              name: holding.name,
              price: 0,
              change: 0,
              changePercent: 0,
              currency: holding.currency || 'SEK',
              priceInSEK: 0,
              changeInSEK: 0,
              hasValidPrice: false,
              errorMessage: 'Tekniskt fel',
            }
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const pricesMap: Record<string, StockPrice> = {};
      
      results.forEach(({ symbol, result }) => {
        pricesMap[symbol] = result;
      });

      setPrices(pricesMap);
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
    if (user && holdings.length > 0) {
      fetchPrices();
    }
  }, [user, holdings]);

  return {
    prices,
    loading,
    lastUpdated,
    exchangeRate,
    refetchPrices: fetchPrices
  };
};
