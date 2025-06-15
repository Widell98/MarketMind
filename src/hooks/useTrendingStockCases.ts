
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

export const useTrendingStockCases = (limit: number = 10) => {
  const [trendingCases, setTrendingCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrendingCases = async () => {
      try {
        setLoading(true);
        
        // Get stock cases with their profiles and categories
        const { data, error } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50); // Get more cases first, then we'll sort by likes

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

        // Get like counts for each case and sort by popularity
        const casesWithLikes = await Promise.all(
          (data || []).map(async (stockCase) => {
            const { data: likeCount } = await supabase
              .rpc('get_stock_case_like_count', { case_id: stockCase.id });
            
            const profile = profilesData?.find(p => p.id === stockCase.user_id);
            const category = categoriesData?.find(c => c.id === stockCase.category_id);
            
            return {
              ...stockCase,
              likeCount: likeCount || 0,
              profiles: profile ? { username: profile.username, display_name: profile.display_name } : null,
              case_categories: category ? { name: category.name, color: category.color } : null
            };
          })
        );

        // First try to get trending cases (cases with likes > 0)
        const actualTrendingCases = casesWithLikes.filter(c => c.likeCount > 0);
        
        let finalCases;
        if (actualTrendingCases.length > 0) {
          // If we have cases with likes, sort by like count
          finalCases = actualTrendingCases
            .sort((a, b) => {
              if (b.likeCount !== a.likeCount) {
                return b.likeCount - a.likeCount;
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, limit);
        } else {
          // If no cases have likes, show recent cases instead
          finalCases = casesWithLikes
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
        }

        const transformedCases = finalCases.map(stockCase => transformStockCase(stockCase));
        setTrendingCases(transformedCases);
      } catch (error: any) {
        console.error('Error fetching trending cases:', error);
        toast({
          title: "Error",
          description: "Failed to load trending cases",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingCases();
  }, [limit, toast]);

  return {
    trendingCases,
    loading
  };
};
