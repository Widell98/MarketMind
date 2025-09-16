
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StockQuote {
  symbol: string | null;
  name?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  previousClose: number | null;
  lastUpdated: string;
  currency?: string | null;
  hasValidPrice: boolean;
  error?: string;
}

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PortfolioPerformance {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  historicalData: HistoricalData[];
  lastUpdated: string;
}

export const useRealTimeMarketData = () => {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [portfolioPerformance, setPortfolioPerformance] = useState<PortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExchangeRate = useCallback(async (): Promise<number | null> => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const rate = data.rates?.SEK;

      if (typeof rate === 'number') {
        setExchangeRate(rate);
        return rate;
      }

      throw new Error('SEK rate missing in exchange response');
    } catch (err) {
      console.warn('Failed to fetch exchange rate:', err);
      setExchangeRate(null);
      return null;
    }
  }, []);

  const convertToSEK = useCallback((amount: number | null, fromCurrency: string, rate: number | null): number | null => {
    if (amount === null) {
      return null;
    }

    if (fromCurrency === 'USD') {
      return rate ? amount * rate : null;
    }

    return amount;
  }, []);

  const fetchStockQuote = useCallback(async (symbol: string): Promise<StockQuote | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
        body: { symbol }
      });

      if (error) throw error;
      const quote = data as StockQuote;

      if (!quote.hasValidPrice || quote.price === null) {
        console.warn(`Yahoo Finance saknar pris för ${symbol}:`, quote.error);
      }

      return quote;
    } catch (err) {
      console.error(`Error fetching quote for ${symbol}:`, err);
      return null;
    }
  }, []);

  const fetchHistoricalData = useCallback(async (symbol: string, period: string = '1mo'): Promise<HistoricalData[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
        body: { symbol, period }
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Error fetching historical data for ${symbol}:`, err);
      return [];
    }
  }, []);

  const updatePortfolioPerformance = useCallback(async (holdings: any[]) => {
    if (!holdings.length) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch current exchange rate
      const currentRate = await fetchExchangeRate();

      const symbols = holdings
        .filter(h => h.symbol && h.holding_type !== 'recommendation')
        .map(h => h.symbol);

      if (!symbols.length) {
        setLoading(false);
        return;
      }

      // Fetch current quotes for all holdings
      const quotePromises = symbols.map(async (symbol) => {
        const quote = await fetchStockQuote(symbol);
        return { symbol, quote };
      });

      const quoteResults = await Promise.all(quotePromises);
      const newQuotes: Record<string, StockQuote> = {};

      let totalValue = 0;
      let totalCost = 0;
      let dailyChange = 0;

      quoteResults.forEach(({ symbol, quote }) => {
        if (quote && quote.hasValidPrice && quote.price !== null) {
          newQuotes[symbol] = quote;
          if (quote.symbol && quote.symbol !== symbol) {
            newQuotes[quote.symbol] = quote;
          }

          const holding = holdings.find(h => h.symbol === symbol);
          if (holding && holding.quantity) {
            const holdingCurrency = holding.currency || 'SEK';
            const quoteCurrency = quote.currency || 'SEK';

            const priceInSEK = convertToSEK(quote.price, quoteCurrency, currentRate);
            const changeInSEK = convertToSEK(quote.change, quoteCurrency, currentRate) ?? 0;
            const purchasePriceInSEK = convertToSEK(
              holding.purchase_price ?? quote.price,
              holdingCurrency,
              currentRate
            );

            if (priceInSEK === null || purchasePriceInSEK === null) {
              console.warn(`Saknar växelkurs för ${symbol}, hoppar över värdeberäkning.`);
              return;
            }

            const currentValue = priceInSEK * holding.quantity;
            const costBasis = purchasePriceInSEK * holding.quantity;
            const dailyChangeValue = changeInSEK * holding.quantity;

            totalValue += currentValue;
            totalCost += costBasis;
            dailyChange += dailyChangeValue;
          }
        } else if (quote && !quote.hasValidPrice) {
          toast({
            title: 'Pris saknas',
            description: `Kunde inte hämta pris för ${symbol} från Yahoo Finance.`,
            variant: 'destructive',
          });
        }
      });

      const totalChange = totalValue - totalCost;
      const totalChangePercent = totalCost > 0 ? (totalChange / totalCost) * 100 : 0;
      const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;

      // Fetch historical data for portfolio (using a representative ETF like SPY for now)
      const historicalData = await fetchHistoricalData('SPY', '1mo');

      setQuotes(newQuotes);
      setPortfolioPerformance({
        totalValue,
        totalChange,
        totalChangePercent,
        dailyChange,
        dailyChangePercent,
        historicalData,
        lastUpdated: new Date().toISOString()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update portfolio performance';
      setError(errorMessage);
      toast({
        title: "Marknadsdata fel",
        description: "Kunde inte hämta aktuell marknadsdata. Försöker igen...",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchStockQuote, fetchHistoricalData, fetchExchangeRate, convertToSEK, toast]);

  const refreshData = useCallback(async (holdings: any[]) => {
    await updatePortfolioPerformance(holdings);
  }, [updatePortfolioPerformance]);

  return {
    quotes,
    portfolioPerformance,
    loading,
    error,
    refreshData,
    fetchStockQuote,
    fetchHistoricalData,
    exchangeRate
  };
};
