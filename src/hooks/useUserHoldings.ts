import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDailyChangeData } from '@/hooks/useDailyChangeData';
import { resolveHoldingValue } from '@/utils/currencyUtils';

export interface UserHolding {
  id: string;
  user_id: string;
  holding_type: 'stock' | 'fund' | 'crypto' | 'real_estate' | 'bonds' | 'other' | 'recommendation';
  name: string;
  symbol?: string;
  quantity?: number;
  current_value?: number;
  current_price_per_unit?: number;
  price_currency?: string;
  daily_change_pct?: number | null;
  purchase_price?: number;
  purchase_date?: string;
  sector?: string;
  market?: string;
  currency: string;
  created_at: string;
  updated_at: string;
  allocation?: number;
  dailyChangePercent?: number | null;
  dailyChangeValueSEK?: number | null;
}

export const useUserHoldings = () => {
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [actualHoldings, setActualHoldings] = useState<UserHolding[]>([]);
  const [recommendations, setRecommendations] = useState<UserHolding[]>([]);
  const [baseActualHoldings, setBaseActualHoldings] = useState<UserHolding[]>([]);
  const [baseRecommendations, setBaseRecommendations] = useState<UserHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getChangeForTicker } = useDailyChangeData();

  const enrichHoldingsWithChangeData = useCallback((items: UserHolding[]): UserHolding[] => {
    return items.map((holding) => {
      if (holding.holding_type === 'recommendation') {
        return {
          ...holding,
          dailyChangePercent: null,
          dailyChangeValueSEK: null,
        };
      }

      const changePercent = getChangeForTicker(holding.symbol ?? undefined) ?? holding.daily_change_pct ?? null;
      const { valueInSEK } = resolveHoldingValue(holding);
      const dailyChangeValueSEK = changePercent !== null ? (valueInSEK * changePercent) / 100 : null;

      return {
        ...holding,
        dailyChangePercent: changePercent,
        dailyChangeValueSEK,
      };
    });
  }, [getChangeForTicker]);

  useEffect(() => {
    if (user) {
      fetchHoldings();
    }
  }, [user]);

  const fetchHoldings = async (options?: { silent?: boolean }) => {
    if (!user) {
      if (!options?.silent) {
        setLoading(false);
      }
      return;
    }

    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching holdings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch holdings",
          variant: "destructive",
        });
        return;
      }

      // Type cast the data properly and handle duplicates
      const typedData: UserHolding[] = (data || []).map(item => {
        const holding: UserHolding = {
          id: item.id,
          user_id: item.user_id,
          holding_type: item.holding_type as UserHolding['holding_type'],
          name: item.name,
          symbol: item.symbol,
          quantity: item.quantity,
          current_value: item.current_value,
          current_price_per_unit: item.current_price_per_unit ?? undefined,
          price_currency: item.price_currency ?? undefined,
          daily_change_pct: item.daily_change_pct ?? null,
          purchase_price: item.purchase_price,
          purchase_date: item.purchase_date,
          sector: item.sector,
          market: item.market,
          currency: item.currency,
          created_at: item.created_at,
          updated_at: item.updated_at,
          allocation: item.allocation ? Number(item.allocation) : undefined
        };

        return holding;
      });

      // Helper function to normalize company names for comparison
      const normalizeCompanyName = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/\s+(inc|ab|corp|ltd|etf|gaming)$/i, '') // Remove common suffixes
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      // Helper function to check if a name is a valid stock/fund name
      const isValidStockOrFund = (name: string): boolean => {
        // Filter out strategy/concept names that are not actual stocks/funds
        const invalidPatterns = [
          'skatteoptimering',
          'månadssparande',
          'rebalanseringsstrategi',
          'total allokering',
          'investera',
          'diversifiering',
          'riskhantering',
          'portföljstrategi',
          'allokeringsstrategi',
          'investeringsstrategi',
          'strategi',
          'optimering',
          'sparande',
          'plan',
          'metod',
          'teknik',
          'approach',
          'strategy'
        ];
        
        const lowerName = name.toLowerCase();
        
        // Check if it matches any invalid pattern
        if (invalidPatterns.some(pattern => lowerName.includes(pattern))) {
          return false;
        }

        // Must have reasonable length (not too short, not too long)
        if (name.length < 2 || name.length > 60) {
          return false;
        }
        
        return true;
      };

      // Remove duplicates from recommendations based on normalized name
      const seenRecommendations = new Set<string>();
      const uniqueRecommendations = typedData
        .filter(h => h.holding_type === 'recommendation')
        .filter(recommendation => {
          // Skip invalid recommendations (strategy names, not actual stocks/funds)
          if (!isValidStockOrFund(recommendation.name)) {
            return false;
          }
          
          // Create a unique key based on normalized name
          const normalizedName = normalizeCompanyName(recommendation.name);
          
          if (seenRecommendations.has(normalizedName)) {
            return false; // Skip duplicate
          }
          
          seenRecommendations.add(normalizedName);
          return true;
        })
        // Sort by created_at to keep the most recent version
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Use actual allocation data if available, otherwise add mock allocation data for display purposes
      const recommendationsWithAllocation = uniqueRecommendations.map((rec, index) => {
        // If allocation is already set, use it, otherwise provide default allocations
        if (rec.allocation) {
          return rec;
        }
        
        const allocations = [25, 20, 20, 15, 10, 10]; // Example allocations that sum to 100%
        return {
          ...rec,
          allocation: allocations[index % allocations.length]
        };
      });

      // Separate actual holdings (no duplicates needed here since they're user-entered)
      const actualHoldingsData = typedData.filter(h => h.holding_type !== 'recommendation');

      const enrichedActualHoldings = enrichHoldingsWithChangeData(actualHoldingsData);
      const enrichedRecommendations = enrichHoldingsWithChangeData(recommendationsWithAllocation);

      setBaseActualHoldings(actualHoldingsData);
      setBaseRecommendations(recommendationsWithAllocation);
      setHoldings([...enrichedActualHoldings, ...enrichedRecommendations]);
      setActualHoldings(enrichedActualHoldings);
      setRecommendations(enrichedRecommendations);
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (baseActualHoldings.length === 0 && baseRecommendations.length === 0) {
      return;
    }

    const enrichedActual = enrichHoldingsWithChangeData(baseActualHoldings);
    const enrichedRecommendations = enrichHoldingsWithChangeData(baseRecommendations);

    setActualHoldings(enrichedActual);
    setRecommendations(enrichedRecommendations);
    setHoldings([...enrichedActual, ...enrichedRecommendations]);
  }, [baseActualHoldings, baseRecommendations, enrichHoldingsWithChangeData]);

  const addHolding = async (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .insert({
          user_id: user.id,
          ...holdingData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding holding:', error);
        toast({
          title: "Error",
          description: "Failed to add holding",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        const typedData: UserHolding = {
          ...data,
          holding_type: data.holding_type as UserHolding['holding_type'],
          allocation: data.allocation ? Number(data.allocation) : undefined
        };

        const enrichedHolding = enrichHoldingsWithChangeData([typedData])[0];

        // Record initial performance entry for actual holdings
        if (typedData.holding_type !== 'recommendation' && typedData.current_value && typedData.purchase_price && typedData.quantity) {
          try {
            await supabase
              .from('portfolio_performance_history')
              .insert({
                user_id: user.id,
                holding_id: typedData.id,
                date: new Date().toISOString().split('T')[0],
                price_per_unit: typedData.purchase_price,
                total_value: typedData.current_value,
                currency: typedData.currency
              });
          } catch (error) {
            console.error('Error recording initial performance:', error);
          }
        }

        if (typedData.holding_type === 'recommendation') {
          setBaseRecommendations(prev => [typedData, ...prev]);
          setRecommendations(prev => [enrichedHolding, ...prev]);
        } else {
          setBaseActualHoldings(prev => [typedData, ...prev]);
          setActualHoldings(prev => [enrichedHolding, ...prev]);
        }

        setHoldings(prev => [enrichedHolding, ...prev]);

        toast({
          title: "Success",
          description: "Holding added successfully",
        });
        return true;
      }
    } catch (error) {
      console.error('Error adding holding:', error);
      return false;
    }
  };

  const updateHolding = async (id: string, updates: Partial<UserHolding>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating holding:', error);
        toast({
          title: "Error",
          description: "Failed to update holding",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        const typedData: UserHolding = {
          ...data,
          holding_type: data.holding_type as UserHolding['holding_type'],
          allocation: data.allocation ? Number(data.allocation) : undefined
        };
        const enrichedHolding = enrichHoldingsWithChangeData([typedData])[0];

        setHoldings(prev => prev.map(h => h.id === id ? enrichedHolding : h));

        if (typedData.holding_type === 'recommendation') {
          setBaseRecommendations(prev => prev.map(h => h.id === id ? typedData : h));
          setRecommendations(prev => prev.map(h => h.id === id ? enrichedHolding : h));
        } else {
          setBaseActualHoldings(prev => prev.map(h => h.id === id ? typedData : h));
          setActualHoldings(prev => prev.map(h => h.id === id ? enrichedHolding : h));
        }
        
        toast({
          title: "Success",
          description: "Holding updated successfully",
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating holding:', error);
      return false;
    }
  };

  const deleteHolding = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_holdings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting holding:', error);
        toast({
          title: "Error",
          description: "Failed to delete holding",
          variant: "destructive",
        });
        return false;
      }

      setBaseActualHoldings(prev => prev.filter(h => h.id !== id));
      setBaseRecommendations(prev => prev.filter(h => h.id !== id));
      setHoldings(prev => prev.filter(h => h.id !== id));
      setActualHoldings(prev => prev.filter(h => h.id !== id));
      setRecommendations(prev => prev.filter(h => h.id !== id));
      
      toast({
        title: "Success",
        description: "Holding deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting holding:', error);
      return false;
    }
  };

  const clearRecommendations = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('holding_type', 'recommendation');

      if (error) {
        console.error('Error clearing recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to clear AI recommendations",
          variant: "destructive",
        });
        return false;
      }

      setHoldings(prev => prev.filter(h => h.holding_type !== 'recommendation'));
      setBaseRecommendations([]);
      setRecommendations([]);

      toast({
        title: "Klart",
        description: "Alla AI-rekommendationer har raderats.",
      });
      return true;
    } catch (error) {
      console.error('Error clearing recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to clear AI recommendations",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    holdings,
    actualHoldings,
    recommendations,
    loading,
    addHolding,
    updateHolding,
    deleteHolding,
    clearRecommendations,
    refetch: fetchHoldings
  };
};
