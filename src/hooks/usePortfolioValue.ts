
import { useState, useEffect, useCallback } from 'react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { supabase } from '@/integrations/supabase/client';

interface HoldingValue {
  id: string;
  name: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
  hasValidPrice: boolean;
  errorMessage?: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdingsWithValues: HoldingValue[];
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const usePortfolioValue = () => {
  const { actualHoldings } = useUserHoldings();
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(10.5);
  const [priceCache, setPriceCache] = useState<Map<string, { price: number; timestamp: number; currency: string }>>(new Map());

  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates?.SEK) {
        setExchangeRate(data.rates.SEK);
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
    }
  }, []);

  const fetchPriceWithRetry = useCallback(async (symbol: string, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
          body: { symbol }
        });
        
        if (error) throw error;
        if (data && data.price > 0) return data;
        
        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${symbol}:`, error);
        if (i === retries - 1) throw error;
      }
    }
    return null;
  }, []);

  const calculatePortfolioValue = useCallback(async () => {
    if (!actualHoldings.length) {
      setPortfolioSummary(null);
      return;
    }

    setLoading(true);
    await fetchExchangeRate();

    const holdingsWithValues: HoldingValue[] = [];
    let totalValue = 0;
    let totalCost = 0;

    for (const holding of actualHoldings) {
      // Skip holdings without quantity or purchase price
      if (!holding.quantity || !holding.purchase_price) {
        continue;
      }

      const searchSymbol = holding.symbol || holding.name;
      const cacheKey = searchSymbol.toUpperCase();
      const now = Date.now();
      
      // Check cache first
      let priceData = priceCache.get(cacheKey);
      const isCacheValid = priceData && (now - priceData.timestamp < CACHE_DURATION);

      if (!isCacheValid) {
        try {
          const apiData = await fetchPriceWithRetry(searchSymbol);
          if (apiData && apiData.price > 0) {
            priceData = {
              price: apiData.price,
              timestamp: now,
              currency: apiData.currency || 'USD'
            };
            
            // Update cache
            setPriceCache(prev => new Map(prev).set(cacheKey, priceData!));
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${searchSymbol}:`, error);
        }
      }

      if (priceData) {
        // Convert to SEK if needed
        let currentPriceInSEK = priceData.price;
        if (priceData.currency === 'USD' && holding.currency === 'SEK') {
          currentPriceInSEK = priceData.price * exchangeRate;
        }

        const totalHoldingValue = currentPriceInSEK * holding.quantity;
        const totalHoldingCost = holding.purchase_price * holding.quantity;
        const profitLoss = totalHoldingValue - totalHoldingCost;
        const profitLossPercent = totalHoldingCost > 0 ? (profitLoss / totalHoldingCost) * 100 : 0;

        holdingsWithValues.push({
          id: holding.id,
          name: holding.name,
          symbol: holding.symbol,
          quantity: holding.quantity,
          purchasePrice: holding.purchase_price,
          currentPrice: currentPriceInSEK,
          totalValue: totalHoldingValue,
          totalCost: totalHoldingCost,
          profitLoss,
          profitLossPercent,
          currency: holding.currency || 'SEK',
          hasValidPrice: true
        });

        totalValue += totalHoldingValue;
        totalCost += totalHoldingCost;
      } else {
        // No valid price data
        const totalHoldingCost = holding.purchase_price * holding.quantity;
        
        holdingsWithValues.push({
          id: holding.id,
          name: holding.name,
          symbol: holding.symbol,
          quantity: holding.quantity,
          purchasePrice: holding.purchase_price,
          currentPrice: 0,
          totalValue: 0,
          totalCost: totalHoldingCost,
          profitLoss: 0,
          profitLossPercent: 0,
          currency: holding.currency || 'SEK',
          hasValidPrice: false,
          errorMessage: "Pris saknas - lägg in rätt ticker"
        });

        totalCost += totalHoldingCost;
      }
    }

    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    setPortfolioSummary({
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercent,
      holdingsWithValues
    });

    setLastUpdated(new Date());
    setLoading(false);
  }, [actualHoldings, exchangeRate, priceCache, fetchExchangeRate, fetchPriceWithRetry]);

  // Initial calculation and periodic updates
  useEffect(() => {
    if (actualHoldings.length > 0) {
      calculatePortfolioValue();
    }
  }, [actualHoldings, calculatePortfolioValue]);

  // Set up periodic updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (actualHoldings.length > 0) {
        calculatePortfolioValue();
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [actualHoldings, calculatePortfolioValue]);

  const refreshPrices = useCallback(() => {
    setPriceCache(new Map()); // Clear cache to force refresh
    calculatePortfolioValue();
  }, [calculatePortfolioValue]);

  return {
    portfolioSummary,
    loading,
    lastUpdated,
    exchangeRate,
    refreshPrices
  };
};
