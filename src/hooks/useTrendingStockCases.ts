
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCase } from '@/hooks/useStockCases';

export const useTrendingStockCases = (limit: number = 10) => {
  const [trendingCases, setTrendingCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrendingCases = async () => {
      try {
        setLoading(true);
        
        // Get stock cases with their like counts, ordered by like count
        const { data, error } = await supabase
          .from('stock_cases')
          .select(`
            *,
            profiles:user_id (
              username,
              display_name
            ),
            case_categories (
              name,
              color
            )
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50); // Get more cases first, then we'll sort by likes

        if (error) throw error;

        // Get like counts for each case and sort by popularity
        const casesWithLikes = await Promise.all(
          (data || []).map(async (stockCase) => {
            const { data: likeCount } = await supabase
              .rpc('get_stock_case_like_count', { case_id: stockCase.id });
            
            return {
              ...stockCase,
              likeCount: likeCount || 0
            };
          })
        );

        // Sort by like count (trending), then by creation date
        const sortedCases = casesWithLikes
          .sort((a, b) => {
            if (b.likeCount !== a.likeCount) {
              return b.likeCount - a.likeCount;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, limit);

        setTrendingCases(sortedCases);
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
