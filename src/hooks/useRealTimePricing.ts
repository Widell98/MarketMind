import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockQuote {
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
  hasValidPrice: boolean;
  currency: string | null;
  error?: string;
}

export const useRealTimePricing = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStockQuote = async (symbol: string): Promise<StockQuote | null> => {
    if (!symbol) return null;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
        body: { symbol }
      });

      if (error) {
        console.error('Error fetching stock quote:', error);
        toast({
          title: 'Prisuppdatering misslyckades',
          description: `Kunde inte hämta pris från Yahoo Finance för ${symbol}.`,
          variant: 'destructive',
        });
        return null;
      }

      const quote = data as StockQuote;

      if (!quote.hasValidPrice || quote.price === null) {
        toast({
          title: 'Prisuppdatering misslyckades',
          description: quote.error
            ? `Yahoo Finance: ${quote.error}`
            : `Kunde inte hämta pris för ${symbol}.`,
          variant: 'destructive',
        });
      }

      return quote;
    } catch (error) {
      console.error('Error invoking fetch-stock-quote function:', error);
      toast({
        title: 'Prisuppdatering misslyckades',
        description: `Tekniskt fel vid prisinhämtning för ${symbol}.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = async (symbol: string, _currency: string = 'SEK'): Promise<number | null> => {
    const quote = await fetchStockQuote(symbol);

    if (!quote || !quote.hasValidPrice || quote.price === null) {
      return null;
    }

    return Math.round(quote.price * 100) / 100;
  };

  const calculateCurrentValue = async (symbol: string, quantity: number, currency: string = 'SEK'): Promise<number | null> => {
    const price = await getCurrentPrice(symbol, currency);

    if (!price) return null;

    return Math.round(price * quantity * 100) / 100;
  };

  const validateAndPriceHolding = async (holdingData: {
    symbol?: string;
    quantity?: number;
    purchase_price?: number;
    currency: string;
  }) => {
    // If no symbol or quantity, return original data
    if (!holdingData.symbol || !holdingData.quantity) {
      return holdingData;
    }

    try {
      console.log(`Validating and pricing holding: ${holdingData.symbol}, quantity: ${holdingData.quantity}, currency: ${holdingData.currency}`);
      
      const quote = await fetchStockQuote(holdingData.symbol);

      if (quote && quote.hasValidPrice && quote.price !== null) {
        const currentValue = quote.price * holdingData.quantity;

        console.log(`Successfully fetched Yahoo Finance price for ${holdingData.symbol}: ${quote.price} × ${holdingData.quantity} = ${currentValue}`);

        return {
          ...holdingData,
          currency: quote.currency || holdingData.currency,
          current_value: Math.round(currentValue * 100) / 100,
        };
      }

      console.warn(`No Yahoo Finance price for ${holdingData.symbol}.`);

      toast({
        title: "Pris saknas",
        description: `Kunde inte hämta korrekt pris för ${holdingData.symbol} från Yahoo Finance.`,
        variant: "destructive",
      });

      return holdingData;
    } catch (error) {
      console.error('Error validating and pricing holding:', error);
      toast({
        title: "Pris saknas",
        description: `Tekniskt fel vid prisinhämtning för ${holdingData.symbol}.`,
        variant: "destructive",
      });

      return holdingData;
    }
  };

  return {
    loading,
    fetchStockQuote,
    getCurrentPrice,
    calculateCurrentValue,
    validateAndPriceHolding
  };
};