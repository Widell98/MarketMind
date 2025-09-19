import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';

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
  const { user, session } = useAuth();
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

        const purchasePrice = parseNumeric(holding.purchase_price) ?? 0;

        const investedValueOriginal = purchasePrice > 0 && quantity > 0
          ? purchasePrice * quantity
          : 0;

        const investedValue = investedValueOriginal > 0
          ? convertToSEK(investedValueOriginal, holding.currency || priceCurrency || 'SEK')
          : 0;

        // Find yesterday's value for this holding
        const yesterdayHolding = yesterdayData?.find(d => d.holding_id === holding.id);
        const yesterdayRawValue = yesterdayHolding
          ? parseNumeric(yesterdayHolding.total_value) ?? currentValue
          : currentValue;
        const yesterdayCurrency = yesterdayHolding?.currency || holding.currency || priceCurrency || 'SEK';
        const yesterdayValue = convertToSEK(yesterdayRawValue, yesterdayCurrency);

        const profit = currentValue - investedValue;
        const profitPercentage = investedValue > 0 ? (profit / investedValue) * 100 : 0;
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

      let accessToken = session?.access_token;
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData.session?.access_token ?? undefined;
      }

      if (!accessToken) {
        throw new Error('Ingen aktiv session hittades. Försök logga in igen.');
      }

      const invokeOptions: { body: { ticker: string }; headers: Record<string, string> } = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { ticker: normalizedTicker },
      };

      const { data, error } = await supabase.functions.invoke('update-portfolio-prices', invokeOptions);

      if (error) {
        throw error;
      }

      const success = data?.success ?? false;
      const updatedCount = typeof data?.updated === 'number' ? data.updated : 0;
      const errorCount = typeof data?.errors === 'number' ? data.errors : 0;
      const unmatched = Array.isArray(data?.unmatched) ? data.unmatched : [];
      const tickerFound = typeof data?.tickerFound === 'boolean' ? data.tickerFound : undefined;
      const responseTicker = typeof data?.requestedTicker === 'string'
        ? data.requestedTicker
        : normalizedTicker;

      if (!success) {
        throw new Error(data?.error || 'Kunde inte uppdatera priserna');
      }

      const descriptionParts: string[] = [];

      if (updatedCount > 0) {
        descriptionParts.push(`${updatedCount} innehav uppdaterades`);
      }

      if (unmatched.length > 0) {
        descriptionParts.push(`${unmatched.length} innehav kunde inte matchas`);
      }

      if (errorCount > 0) {
        descriptionParts.push(`${errorCount} fel uppstod`);
      }

      if (normalizedTicker) {
        if (updatedCount === 0) {
          if (tickerFound === false) {
            descriptionParts.push('Tickern hittades inte i Google Sheets.');
          } else {
            descriptionParts.push('Tickern matchade inga innehav att uppdatera.');
          }
        }
      }

      if (unmatched.length > 0) {
        console.warn('Holdings not matched with Google Sheets data:', unmatched);
      }

      const toastTitle = updatedCount > 0
        ? `Pris uppdaterat för ${responseTicker}`
        : `Inget pris uppdaterades för ${responseTicker}`;

      toast({
        title: toastTitle,
        description: descriptionParts.join(' · ') || 'Inga innehav matchade Google Sheets-datan.',
        variant: updatedCount === 0 && (errorCount > 0 || unmatched.length > 0) ? 'destructive' : 'default',
      });

      await calculatePerformance();

      return {
        updated: updatedCount,
        errors: errorCount,
        unmatched,
        tickerFound,
        requestedTicker: responseTicker,
      };

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: "Fel vid prisuppdatering",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera priserna",
        variant: "destructive",
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
