import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCase } from '@/types/stockCase';

// Helper function to ensure proper typing from database
const transformStockCase = (rawCase: any): StockCase => {
  return {
    ...rawCase,
    status: (rawCase.status || 'active') as 'active' | 'winner' | 'loser',
    is_public: rawCase.is_public ?? true,
  };
};

// Helper function to enrich stock cases with profiles and categories
const enrichStockCases = async (stockCases: any[]): Promise<StockCase[]> => {
  if (!stockCases || stockCases.length === 0) return [];

  // Get unique user IDs and category IDs
  const userIds = [...new Set(stockCases.map(c => c.user_id).filter(Boolean))];
  const categoryIds = [...new Set(stockCases.map(c => c.category_id).filter(Boolean))];

  // Fetch profiles
  let profilesData = [];
  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);
    
    if (error) {
      console.error('Error fetching profiles in useLatestStockCases:', error);
    } else {
      profilesData = data || [];
    }
  }

  // Fetch categories
  let categoriesData = [];
  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from('case_categories')
      .select('id, name, color')
      .in('id', categoryIds);
    
    if (error) {
      console.error('Error fetching categories in useLatestStockCases:', error);
    } else {
      categoriesData = data || [];
    }
  }

  // Enrich stock cases with profile and category data
  return stockCases.map(stockCase => {
    const profile = profilesData.find(p => p.id === stockCase.user_id);
    const category = categoriesData.find(c => c.id === stockCase.category_id);
    
    return transformStockCase({
      ...stockCase,
      profiles: profile || null,
      case_categories: category || null
    });
  });
};

type LatestStockCasesOptions = {
  limit?: number;
  aiGeneratedOnly?: boolean;
  aiBatchId?: string;
  includePrivate?: boolean;
  enabled?: boolean;
};

export const useLatestStockCases = (limitOrOptions: number | LatestStockCasesOptions = 6) => {
  const options = useMemo<LatestStockCasesOptions>(() => {
    if (typeof limitOrOptions === 'number') {
      return { limit: limitOrOptions };
    }
    return limitOrOptions ?? {};
  }, [limitOrOptions]);

  const {
    limit = 6,
    aiGeneratedOnly = false,
    aiBatchId,
    includePrivate = false,
    enabled = true,
  } = options;

  const [latestCases, setLatestCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled));
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const { toast } = useToast();

  const refetch = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchLatestCases = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('stock_cases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!includePrivate) {
          query = query.eq('is_public', true);
        }

        if (aiGeneratedOnly) {
          query = query.eq('ai_generated', true);
        }

        if (aiBatchId) {
          query = query.eq('ai_batch_id', aiBatchId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error fetching latest cases:', fetchError);
          throw fetchError;
        }

        const enrichedData = await enrichStockCases(data || []);

        if (!isCancelled) {
          setLatestCases(enrichedData);
        }
      } catch (fetchError: any) {
        if (isCancelled) return;

        console.error('Error fetching latest cases:', fetchError);
        setError(fetchError instanceof Error ? fetchError : new Error('Failed to load latest cases'));

        toast({
          title: "Error",
          description: "Failed to load latest cases",
          variant: "destructive",
        });
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchLatestCases();

    return () => {
      isCancelled = true;
    };
  }, [aiBatchId, aiGeneratedOnly, includePrivate, limit, refreshToken, enabled, toast]);

  return {
    latestCases,
    loading,
    error,
    refetch,
  };
};
