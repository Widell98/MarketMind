import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';
import type { SheetTicker } from '@/hooks/useSheetTickers';

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
            console.log('Holdings updated, recalculating performance...');
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
            console.log('Performance history updated, recalculating performance...');
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

        const purchasePrice = parseNumeric(holding.purchase_price);
        const hasPurchasePrice = purchasePrice !== null && quantity > 0;

        let investedValue = currentValue;
        if (hasPurchasePrice && purchasePrice !== null) {
          const investedValueOriginal = purchasePrice * quantity;
          investedValue = convertToSEK(
            investedValueOriginal,
            holding.currency || priceCurrency || 'SEK'
          );
        }

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
          dayChangePercentage
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

    } catch (error) {
      console.error('Error calculating performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = async (ticker?: string): Promise<PriceUpdateSummary | null> => {
    if (!user || updating) {
      return null;
    }

    const normalizedTicker = ticker?.trim().toUpperCase();

    if (!normalizedTicker) {
      toast({
        title: 'Välj innehav att uppdatera',
        description: 'Klicka på ett innehavs ticker i listan för att uppdatera priset.',
      });
      return null;
    }

    try {
      setUpdating(true);

      const { data: tickerResponse, error: tickerError } = await supabase.functions.invoke('list-sheet-tickers');

      if (tickerError) {
        throw new Error(tickerError.message || 'Kunde inte hämta tickers från Google Sheets.');
      }

      const tickerList = Array.isArray(tickerResponse?.tickers)
        ? (tickerResponse.tickers as SheetTicker[])
        : [];

      if (tickerList.length === 0) {
        throw new Error('Kunde inte hämta tickers från Google Sheets.');
      }

      const matchedTicker = findTickerMatch(tickerList, normalizedTicker);

      if (!matchedTicker) {
        toast({
          title: 'Tickern hittades inte',
          description: 'Tickern finns inte i Google Sheets-listan. Kontrollera stavningen eller välj en annan ticker.',
          variant: 'destructive',
        });
        return {
          updated: 0,
          errors: 0,
          unmatched: [],
          tickerFound: false,
          requestedTicker: normalizedTicker,
        };
      }

      if (typeof matchedTicker.price !== 'number' || !Number.isFinite(matchedTicker.price) || matchedTicker.price <= 0) {
        throw new Error(`Tickern ${matchedTicker.symbol} saknar ett giltigt pris i Google Sheets.`);
      }

      const canonicalSymbol = stripSymbolPrefix(matchedTicker.symbol) ?? matchedTicker.symbol.toUpperCase();
      const symbolVariants = getSymbolVariants(matchedTicker.symbol);

      let holdingsQuery = supabase
        .from('user_holdings')
        .select('id, quantity, symbol, name, holding_type')
        .eq('user_id', user.id)
        .neq('holding_type', 'cash');

      if (symbolVariants.length > 1) {
        holdingsQuery = holdingsQuery.or(symbolVariants.map((variant) => `symbol.ilike.${variant}`).join(','));
      } else if (symbolVariants.length === 1) {
        holdingsQuery = holdingsQuery.ilike('symbol', symbolVariants[0]);
      }

      const { data: holdings, error: holdingsError } = await holdingsQuery;

      if (holdingsError) {
        throw holdingsError;
      }

      if (!holdings || holdings.length === 0) {
        toast({
          title: 'Inget innehav att uppdatera',
          description: `Tickern ${canonicalSymbol} finns inte i din portfölj.`,
          variant: 'destructive',
        });
        return {
          updated: 0,
          errors: 0,
          unmatched: [],
          tickerFound: true,
          requestedTicker: canonicalSymbol,
        };
      }

      const priceCurrency = matchedTicker.currency ? matchedTicker.currency.toUpperCase() : 'SEK';
      const pricePerUnit = matchedTicker.price;
      const pricePerUnitInSEK = convertToSEK(pricePerUnit, priceCurrency);

      const timestamp = new Date().toISOString();
      let updatedCount = 0;
      let errorCount = 0;
      const failedHoldings: Array<{ symbol?: string; name?: string }> = [];

      const typedHoldings = holdings as HoldingRow[];

      for (const holding of typedHoldings) {
        const quantity = parseNumeric(holding.quantity) ?? 0;
        const computedValue = Number.isFinite(pricePerUnitInSEK)
          ? quantity > 0
            ? quantity * pricePerUnitInSEK
            : 0
          : null;

        const { error: updateError } = await supabase
          .from('user_holdings')
          .update({
            current_price_per_unit: pricePerUnit,
            price_currency: priceCurrency,
            ...(computedValue !== null ? { current_value: computedValue } : {}),
            updated_at: timestamp,
          })
          .eq('id', holding.id);

        if (updateError) {
          errorCount++;
          failedHoldings.push({
            symbol: holding.symbol ?? undefined,
            name: holding.name ?? undefined,
          });
          console.error(`Error updating holding ${holding.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      const descriptionParts: string[] = [];

      if (updatedCount > 0) {
        descriptionParts.push(`${updatedCount} innehav uppdaterades`);
      }

      if (errorCount > 0) {
        descriptionParts.push(`${errorCount} uppdateringar misslyckades`);
      }

      if (updatedCount === 0 && errorCount === 0) {
        descriptionParts.push('Tickern matchade inga innehav att uppdatera.');
      }

      const toastTitle = updatedCount > 0
        ? `Pris uppdaterat för ${canonicalSymbol}`
        : `Inget pris uppdaterades för ${canonicalSymbol}`;

      toast({
        title: toastTitle,
        description: descriptionParts.join(' · ') || undefined,
        variant: updatedCount === 0 && (errorCount > 0) ? 'destructive' : 'default',
      });

      await calculatePerformance();

      return {
        updated: updatedCount,
        errors: errorCount,
        unmatched: failedHoldings,
        tickerFound: true,
        requestedTicker: canonicalSymbol,
      };

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Fel vid prisuppdatering',
        description: error instanceof Error ? error.message : 'Kunde inte uppdatera priserna',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return {
    performance,
    holdingsPerformance,
    loading,
    updating,
    updatePrices,
    refetch: calculatePerformance
  };
};
