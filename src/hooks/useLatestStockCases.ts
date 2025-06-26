
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCase } from '@/hooks/useStockCases';

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

export const useLatestStockCases = (limit: number = 6) => {
  const [latestCases, setLatestCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLatestCases = async () => {
      try {
        setLoading(true);
        
        console.log('useLatestStockCases: Fetching latest cases with limit:', limit);
        
        // Get the latest stock cases
        const { data, error } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching latest cases:', error);
          throw error;
        }

        console.log('useLatestStockCases: Raw data from database:', data?.length || 0, 'cases');

        // Enrich the data with profiles and categories
        const enrichedData = await enrichStockCases(data || []);

        console.log('useLatestStockCases: Enriched data:', enrichedData.length, 'cases');
        setLatestCases(enrichedData);
      } catch (error: any) {
        console.error('Error fetching latest cases:', error);
        toast({
          title: "Error",
          description: "Failed to load latest cases",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCases();
  }, [limit, toast]);

  return {
    latestCases,
    loading
  };
};
