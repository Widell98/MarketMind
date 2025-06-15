
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
        
        // Get the latest stock cases
        const { data, error } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Get unique user IDs
        const userIds = [...new Set(data?.map(c => c.user_id).filter(Boolean) || [])];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
        }

        // Get unique category IDs
        const categoryIds = [...new Set(data?.map(c => c.category_id).filter(Boolean) || [])];
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('case_categories')
          .select('id, name, color')
          .in('id', categoryIds);

        if (categoriesError) {
          console.error('Categories fetch error:', categoriesError);
        }

        // Combine the data manually
        const transformedData = (data || []).map(stockCase => {
          const profile = profilesData?.find(p => p.id === stockCase.user_id);
          const category = categoriesData?.find(c => c.id === stockCase.category_id);
          
          return transformStockCase({
            ...stockCase,
            profiles: profile ? { username: profile.username, display_name: profile.display_name } : null,
            case_categories: category ? { name: category.name, color: category.color } : null
          });
        });

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
