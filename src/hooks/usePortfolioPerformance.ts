import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';
import { mapEdgeFunctionErrorMessage } from '@/utils/mapEdgeFunctionError';
import type { SheetTicker } from '@/hooks/useSheetTickers';

// ... (Behåll befintliga hjälpfunktioner som logFinnhubInvocationWarning, parseNumeric etc.)

type FinnhubPriceResponse = {
  symbol: string;
  price: number;
  currency: string | null;
  profileFetched?: boolean;
};

// ... (Behåll hjälpfunktioner: normalizeValue, stripSymbolPrefix, getSymbolVariants, findTickerMatch, buildTickerVariantLookup, normalizeNameKey)
// (Jag utelämnar dessa för att spara plats, de ska vara kvar som de är)
const logFinnhubInvocationWarning = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

const logFinnhubInvocationError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeValue = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const stripSymbolPrefix = (symbol?: string | null) => {
  const normalized = normalizeValue(symbol);
  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();
  const parts = upper.split(':');
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate : upper;
};

const getSymbolVariants = (symbol?: string | null) => {
  const variants = new Set<string>();

  const addVariant = (value?: string | null) => {
    const normalized = normalizeValue(value);
    if (!normalized) {
      return;
    }

    const upper = normalized.toUpperCase();
    variants.add(upper);

    const stripped = stripSymbolPrefix(upper);
    if (stripped && stripped !== upper) {
      variants.add(stripped);
    }
  };

  addVariant(symbol);

  const currentVariants = Array.from(variants);
  currentVariants.forEach((variant) => {
    if (variant.endsWith('.ST')) {
      const base = variant.replace(/\.ST$/, '');
      if (base) {
        variants.add(base);
      }
    } else {
      variants.add(`${variant}.ST`);
    }
  });

  return Array.from(variants);
};

const findTickerMatch = (tickers: SheetTicker[], ticker: string): SheetTicker | null => {
  const targetVariants = new Set(getSymbolVariants(ticker));

  for (const candidate of tickers) {
    const candidateVariants = getSymbolVariants(candidate.symbol);
    if (candidateVariants.some((variant) => targetVariants.has(variant))) {
      return candidate;
    }
  }

  return null;
};

const buildTickerVariantLookup = (tickers: SheetTicker[]) => {
  const lookup = new Map<string, SheetTicker>();

  tickers.forEach((ticker) => {
    const variants = getSymbolVariants(ticker.symbol);
    variants.forEach((variant) => {
      lookup.set(variant.toUpperCase(), ticker);
    });

    const canonical = stripSymbolPrefix(ticker.symbol);
    if (canonical) {
      lookup.set(canonical.toUpperCase(), ticker);
    }

    if (ticker.symbol) {
      lookup.set(ticker.symbol.toUpperCase(), ticker);
    }
  });

  return lookup;
};

const normalizeNameKey = (name?: string | null) => {
  if (typeof name !== 'string') {
    return null;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

export interface PerformanceData {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  totalCash: number;
  totalPortfolioValue: number;
  cashPercentage: number;
  investedPercentage: number;
  lastUpdated: string;
}

export interface HoldingPerformance {
  id: string;
  name: string;
  symbol?: string;
  currentValue: number;
  investedValue: number;
  profit: number;
  profitPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  hasPurchasePrice: boolean;
  currency: string; // TILLAGT: För att kunna avgöra marknad
}

interface PriceUpdateSummary {
  updated: number;
  errors: number;
  unmatched: Array<{ symbol?: string; name?: string }>;
  tickerFound?: boolean;
  requestedTicker?: string;
}

interface HoldingRow {
  id: string;
  quantity: number | string | null;
  symbol?: string | null;
  name?: string | null;
  price_currency?: string | null;
  currency?: string | null;
}

export const usePortfolioPerformance = () => {
  const [performance, setPerformance] = useState<PerformanceData>({
    totalValue: 0,
    totalInvested: 0,
    totalReturn: 0,
    totalReturnPercentage: 0,
    dayChange: 0,
    dayChangePercentage: 0,
    totalCash: 0,
    totalPortfolioValue: 0,
    cashPercentage: 0,
    investedPercentage: 0,
    lastUpdated: new Date().toISOString()
  });
  const [holdingsPerformance, setHoldingsPerformance] = useState<HoldingPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      calculatePerformance();
      // Set up realtime updates
      const channel = supabase
        .channel('portfolio-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_holdings',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            calculatePerformance();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'portfolio_performance_history',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            calculatePerformance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const calculatePerformance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all holdings (both securities and cash)
      const { data: allHoldings, error: holdingsError } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', user.id);

      if (holdingsError) {
        console.error('Error fetching holdings:', holdingsError);
        return;
      }

      if (!allHoldings || allHoldings.length === 0) {
        setPerformance({
          totalValue: 0,
          totalInvested: 0,
          totalReturn: 0,
          totalReturnPercentage: 0,
          dayChange: 0,
          dayChangePercentage: 0,
          totalCash: 0,
          totalPortfolioValue: 0,
          cashPercentage: 0,
          investedPercentage: 0,
          lastUpdated: new Date().toISOString()
        });
        setHoldingsPerformance([]);
        return;
      }

      // Separate cash and securities
      const securities = allHoldings.filter(h => !h.is_cash && h.holding_type !== 'recommendation');
      const cashHoldings = allHoldings.filter(h => h.is_cash);

      // Calculate total cash
      const totalCash = cashHoldings.reduce((sum, holding) => {
        const parsedValue = parseNumeric(holding.current_value);
        const cashValue = parsedValue ?? 0;
        const cashCurrency = typeof holding.currency === 'string' ? holding.currency : 'SEK';
        return sum + convertToSEK(cashValue, cashCurrency);
      }, 0);

      // Get yesterday's performance data for day change calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('portfolio_performance_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr);

      // Calculate securities performance
      let totalValue = 0;
      let totalInvested = 0;
      let totalYesterdayValue = 0;
      const holdingsPerf: HoldingPerformance[] = [];

      securities.forEach(holding => {
        const {
          valueInSEK: currentValue,
          quantity,
          priceCurrency,
        } = resolveHoldingValue(holding);

        const parsedPurchasePrice = parseNumeric(holding.purchase_price);
        const hasPurchasePrice = parsedPurchasePrice !== null && parsedPurchasePrice > 0 && quantity > 0;
        const purchasePrice = hasPurchasePrice ? parsedPurchasePrice : 0;

        const investedValue = hasPurchasePrice
          ? convertToSEK(purchasePrice * quantity, holding.currency || priceCurrency || 'SEK')
          : currentValue;

        // Find yesterday's value for this holding
        const yesterdayHolding = yesterdayData?.find(d => d.holding_id === holding.id);
        const yesterdayRawValue = yesterdayHolding
          ? parseNumeric(yesterdayHolding.total_value) ?? currentValue
          : currentValue;
        const yesterdayCurrency = yesterdayHolding?.currency || holding.currency || priceCurrency || 'SEK';
        const yesterdayValue = convertToSEK(yesterdayRawValue, yesterdayCurrency);

        const profit = hasPurchasePrice ? currentValue - investedValue : 0;
        const profitPercentage = hasPurchasePrice && investedValue > 0 ? (profit / investedValue) * 100 : 0;
        const dayChange = currentValue - yesterdayValue;
        const dayChangePercentage = yesterdayValue > 0 ? (dayChange / yesterdayValue) * 100 : 0;

        holdingsPerf.push({
          id: holding.id,
          name: holding.name,
          symbol: holding.symbol,
          currentValue,
          investedValue,
          profit,
          profitPercentage,
          dayChange,
          dayChangePercentage,
          hasPurchasePrice,
          currency: holding.currency || priceCurrency || 'SEK', // TILLAGT
        });

        totalValue += currentValue;
        totalInvested += investedValue;
        totalYesterdayValue += yesterdayValue;
      });

      const totalReturn = totalValue - totalInvested;
      const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
      const dayChange = totalValue - totalYesterdayValue;
      const dayChangePercentage = totalYesterdayValue > 0 ? (dayChange / totalYesterdayValue) * 100 : 0;

      // Calculate total portfolio value (securities + cash)
      const totalPortfolioValue = totalValue + totalCash;
      const cashPercentage = totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0;
      const investedPercentage = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;

      setPerformance({
        totalValue: Math.round(totalValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100,
        dayChange: Math.round(dayChange * 100) / 100,
        dayChangePercentage: Math.round(dayChangePercentage * 100) / 100,
        totalCash: Math.round(totalCash * 100) / 100,
        totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
        cashPercentage: Math.round(cashPercentage * 100) / 100,
        investedPercentage: Math.round(investedPercentage * 100) / 100,
        lastUpdated: new Date().toISOString()
      });

      setHoldingsPerformance(holdingsPerf);

      // Save today's performance history for future day change calculations
      // This ensures that tomorrow we can calculate day-over-day changes
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Check if today's history already exists to avoid unnecessary checks
      const { data: todayHistoryCheck } = await supabase
        .from('portfolio_performance_history')
        .select('holding_id')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .limit(1000); // Reasonable limit

      const existingHoldingIds = new Set(todayHistoryCheck?.map(h => h.holding_id) || []);

      // Save today's performance history for all securities
      const todayHistoryPromises = securities.map(async (holding) => {
        const {
          valueInSEK: currentValue,
          pricePerUnit,
          priceCurrency,
        } = resolveHoldingValue(holding);

        // Only save if we have a valid value
        if (currentValue > 0) {
          const pricePerUnitValue = pricePerUnit ?? (currentValue / (parseNumeric(holding.quantity) ?? 1));
          
          // Skip if already saved today (optimization, but upsert will handle duplicates anyway)
          if (existingHoldingIds.has(holding.id)) {
            return;
          }
          
          // Upsert today's performance data (update if exists, insert if not)
          // This is critical for calculating day-over-day changes
          const { error: historyError } = await supabase
            .from('portfolio_performance_history')
            .upsert({
              user_id: user.id,
              holding_id: holding.id,
              date: todayStr,
              price_per_unit: pricePerUnitValue,
              total_value: currentValue,
              currency: priceCurrency || holding.currency || 'SEK',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'holding_id,date'
            });

          if (historyError) {
            console.error(`Error saving performance history for holding ${holding.id}:`, historyError);
          }
        }
      });

      // Save all history entries in parallel
      // We don't await this to avoid blocking the UI, but errors are logged
      Promise.all(todayHistoryPromises).catch(error => {
        console.error('Error saving portfolio performance history:', error);
      });

    } catch (error) {
      console.error('Error calculating performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAllPrices = async (): Promise<PriceUpdateSummary | null> => {
    // ... (rest of the function remains the same as previously provided, no changes needed here)
    // Förkortat här för läsbarhet, men se till att hela funktionen behålls i din fil
    if (!user || updating) return null;
    // ... logic ...
    return null;
  };
  
  const updatePrices = async (ticker?: string): Promise<PriceUpdateSummary | null> => {
      // ... (rest of the function remains the same as previously provided, no changes needed here)
      if (!user || updating) return null;
      // ... logic ...
      return null;
  };

  // OBS: Se till att du behåller hela `updateAllPrices` och `updatePrices` funktionerna från originalfilen 
  // eller kopierar dem från föregående svar. Jag har inte ändrat något i dem.

  return {
    performance,
    holdingsPerformance,
    loading,
    updating,
    updateAllPrices,
    updatePrices,
    refetch: calculatePerformance
  };
};
