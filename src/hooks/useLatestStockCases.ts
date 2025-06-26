
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

export const useLatestStockCases = (limit: number = 6) => {
  const [latestCases, setLatestCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLatestCases = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching latest cases...');
        
        // Get the latest stock cases
        const { data, error } = await supabase
          .from('stock_cases')
          .select(`
            *,
            case_categories (
              id,
              name,
              color
            ),
            profiles (
              id,
              display_name,
              username
            )
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching latest cases:', error);
          throw error;
        }

        console.log('Raw data from database:', data);

        // Transform the data to ensure proper typing
        const transformedData = (data || []).map(stockCase => {
          return transformStockCase({
            ...stockCase,
            profiles: Array.isArray(stockCase.profiles) ? stockCase.profiles[0] : stockCase.profiles,
            case_categories: Array.isArray(stockCase.case_categories) ? stockCase.case_categories[0] : stockCase.case_categories
          });
        });

        console.log('Transformed data:', transformedData);
        setLatestCases(transformedData);
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
