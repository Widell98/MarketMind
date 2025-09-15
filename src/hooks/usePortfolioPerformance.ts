import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { convertCurrency } from '@/utils/currencyUtils';

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
      const totalCash = cashHoldings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);

      // Get yesterday's performance data for day change calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('portfolio_performance_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr);

      const yesterdayValueMap = new Map<string, number>();
      yesterdayData?.forEach(entry => {
        if (entry?.holding_id) {
          const entryValue = typeof entry.total_value === 'number' ? entry.total_value : 0;
          yesterdayValueMap.set(entry.holding_id, entryValue);
        }
      });

      const holdingsResults = await Promise.all(
        securities.map(async holding => {
          const quantity = Number(holding.quantity) || 0;
          const purchasePrice = Number(holding.purchase_price) || 0;
          const investedValue = purchasePrice * quantity;
          const fallbackValue = typeof holding.current_value === 'number'
            ? holding.current_value
            : investedValue;

          let currentValue = fallbackValue || 0;

          if (holding.symbol && quantity > 0) {
            try {
              const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
                body: { symbol: holding.symbol }
              });

              if (!error && data && typeof data.price === 'number') {
                const quote = data as { price?: number; currency?: string; hasValidPrice?: boolean };

                if (quote.hasValidPrice !== false && typeof quote.price === 'number') {
                  const quoteCurrency = (quote.currency || holding.currency || 'SEK').toUpperCase();
                  const targetCurrency = (holding.currency || quoteCurrency).toUpperCase();

                  let normalizedPrice = quote.price;

                  if (quoteCurrency !== targetCurrency) {
                    normalizedPrice = convertCurrency(quote.price, quoteCurrency, targetCurrency);
                  }

                  currentValue = normalizedPrice * quantity;
                }
              }
            } catch (priceError) {
              console.error(`Error fetching price for ${holding.symbol}:`, priceError);
            }
          }

          if (!Number.isFinite(currentValue)) {
            currentValue = typeof fallbackValue === 'number' ? fallbackValue : 0;
          }

          currentValue = Math.round(currentValue * 100) / 100;

          const yesterdayValue = yesterdayValueMap.get(holding.id) ?? currentValue;
          const profit = currentValue - investedValue;
          const profitPercentage = investedValue > 0 ? (profit / investedValue) * 100 : 0;
          const dayChange = currentValue - yesterdayValue;
          const dayChangePercentage = yesterdayValue > 0 ? (dayChange / yesterdayValue) * 100 : 0;

          return {
            performance: {
              id: holding.id,
              name: holding.name,
              symbol: holding.symbol,
              currentValue,
              investedValue,
              profit,
              profitPercentage,
              dayChange,
              dayChangePercentage
            } as HoldingPerformance,
            totals: {
              currentValue,
              investedValue,
              yesterdayValue
            }
          };
        })
      );

      let totalValue = 0;
      let totalInvested = 0;
      let totalYesterdayValue = 0;
      const holdingsPerf: HoldingPerformance[] = [];

      holdingsResults.forEach(result => {
        holdingsPerf.push(result.performance);
        totalValue += result.totals.currentValue;
        totalInvested += result.totals.investedValue;
        totalYesterdayValue += result.totals.yesterdayValue;
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

  const updatePrices = async () => {
    if (!user || updating) return;

    try {
      setUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-portfolio-prices');
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Priser uppdaterade",
          description: `${data.updated} innehav uppdaterades`,
        });
        
        // Recalculate performance after update
        await calculatePerformance();
      } else {
        throw new Error(data?.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: "Fel vid prisuppdatering",
        description: "Kunde inte uppdatera priserna",
        variant: "destructive",
      });
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
