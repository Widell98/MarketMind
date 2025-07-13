import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockQuote {
  symbol: string;
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
  currency: string;
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
        return null;
      }

      return data as StockQuote;
    } catch (error) {
      console.error('Error invoking fetch-stock-quote function:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = async (symbol: string, currency: string = 'SEK'): Promise<number | null> => {
    const quote = await fetchStockQuote(symbol);
    
    if (!quote || !quote.hasValidPrice || !quote.price) {
      return null;
    }

    // Simple currency conversion (you might want to use a real exchange rate API)
    let priceInTargetCurrency = quote.price;
    
    if (quote.currency === 'USD' && currency === 'SEK') {
      priceInTargetCurrency = quote.price * 10.5; // Approximate conversion
    } else if (quote.currency === 'SEK' && currency === 'USD') {
      priceInTargetCurrency = quote.price / 10.5;
    }

    return Math.round(priceInTargetCurrency * 100) / 100;
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
    // If no symbol, return original data
    if (!holdingData.symbol || !holdingData.quantity) {
      return holdingData;
    }

    try {
      // Get current market price
      const currentPrice = await getCurrentPrice(holdingData.symbol, holdingData.currency);
      
      if (currentPrice) {
        // Calculate current value based on market price
        const currentValue = currentPrice * holdingData.quantity;
        
        return {
          ...holdingData,
          current_value: Math.round(currentValue * 100) / 100,
          purchase_price: holdingData.purchase_price || currentPrice // Use market price as purchase price if not provided
        };
      } else {
        // If we can't get real price, use purchase price as current value
        const fallbackValue = holdingData.purchase_price && holdingData.quantity 
          ? holdingData.purchase_price * holdingData.quantity
          : 0;
          
        toast({
          title: "Prisuppdatering misslyckades",
          description: `Kunde inte hämta aktuellt pris för ${holdingData.symbol}. Använder inmatat pris.`,
          variant: "default",
        });
        
        return {
          ...holdingData,
          current_value: Math.round(fallbackValue * 100) / 100
        };
      }
    } catch (error) {
      console.error('Error validating and pricing holding:', error);
      
      // Fallback to purchase price
      const fallbackValue = holdingData.purchase_price && holdingData.quantity 
        ? holdingData.purchase_price * holdingData.quantity
        : 0;
        
      return {
        ...holdingData,
        current_value: Math.round(fallbackValue * 100) / 100
      };
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