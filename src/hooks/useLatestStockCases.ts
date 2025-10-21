import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCase } from '@/types/stockCase';

type RawStockCase = Partial<StockCase> & { id: string };

type ProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
};

type CategoryRecord = {
  id: string;
  name: string;
  color: string | null;
};

// Helper function to enrich stock cases with profiles and categories
const enrichStockCases = async (stockCases: RawStockCase[]): Promise<StockCase[]> => {
  if (!stockCases || stockCases.length === 0) return [];

  // Get unique user IDs and category IDs
  const userIds = [...new Set(stockCases.map(c => c.user_id).filter(Boolean))];
  const categoryIds = [...new Set(stockCases.map(c => c.category_id).filter(Boolean))];

  let profilesData: ProfileRecord[] = [];
  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching profiles in useLatestStockCases:', error);
    } else {
      profilesData = (data ?? []) as ProfileRecord[];
    }
  }

  let categoriesData: CategoryRecord[] = [];
  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from('case_categories')
      .select('id, name, color')
      .in('id', categoryIds);

    if (error) {
      console.error('Error fetching categories in useLatestStockCases:', error);
    } else {
      categoriesData = (data ?? []) as CategoryRecord[];
    }
  }

  return stockCases.map((stockCase) => {
    const profile = profilesData.find(p => p.id === stockCase.user_id);
    const category = categoriesData.find(c => c.id === stockCase.category_id);

    return {
      ...(stockCase as StockCase),
      status: (stockCase.status ?? 'active') as 'active' | 'winner' | 'loser',
      is_public: stockCase.is_public ?? true,
      profiles: profile ? {
        username: profile.username,
        display_name: profile.display_name,
      } : null,
      case_categories: category ? {
        name: category.name,
        color: category.color,
      } : null,
    } as StockCase;
  });
};

interface LatestStockCaseOptions {
  aiGeneratedOnly?: boolean;
  batchId?: string;
  waitForBatchId?: boolean;
}

export const useLatestStockCases = (limit: number = 6, options?: LatestStockCaseOptions) => {
  const [latestCases, setLatestCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const aiGeneratedOnly = options?.aiGeneratedOnly ?? false;
  const batchId = options?.batchId;
  const waitForBatchId = options?.waitForBatchId ?? false;

  useEffect(() => {
    const fetchLatestCases = async () => {
      try {
        setLoading(true);

        console.log('useLatestStockCases: Fetching latest cases with limit:', limit);

        // Get the latest stock cases
        let query = supabase
          .from('stock_cases')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (aiGeneratedOnly) {
          query = query.eq('ai_generated', true);
        }

        if (batchId) {
          query = query.eq('ai_batch_id', batchId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching latest cases:', error);
          throw error;
        }

        console.log('useLatestStockCases: Raw data from database:', data?.length || 0, 'cases');

        // Enrich the data with profiles and categories
        const rawCases = (data ?? []) as RawStockCase[];
        const enrichedData = await enrichStockCases(rawCases);

        console.log('useLatestStockCases: Enriched data:', enrichedData.length, 'cases');
        setLatestCases(enrichedData);
      } catch (error) {
        console.error('Error fetching latest cases:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to load latest cases',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (waitForBatchId && !batchId) {
      setLatestCases([]);
      setLoading(true);
      return;
    }

    fetchLatestCases();
  }, [limit, toast, aiGeneratedOnly, batchId, waitForBatchId]);

  return {
    latestCases,
    loading
  };
};
