import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StockCase } from '@/types/stockCase';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';

// Helper function to ensure proper typing from database
const transformStockCase = (rawCase: any): StockCase => {
  const normalizedTitle = normalizeStockCaseTitle(rawCase.title, rawCase.company_name);

  return {
    ...rawCase,
    title: normalizedTitle,
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

        // Get like counts and recent like activity for each case
        const casesWithMetrics = await Promise.all(
          (data || []).map(async (stockCase) => {
            // Get total like count
            const { data: likeCount } = await supabase
              .rpc('get_stock_case_like_count', { case_id: stockCase.id });
            
            // Get recent likes (last 24 hours) for trending calculation
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentLikes, error: recentLikesError } = await supabase
              .from('stock_case_likes')
              .select('id')
              .eq('stock_case_id', stockCase.id)
              .gte('created_at', twentyFourHoursAgo);

            if (recentLikesError) {
              console.error('Recent likes fetch error:', recentLikesError);
            }

            const profile = profilesData?.find(p => p.id === stockCase.user_id);
            const category = categoriesData?.find(c => c.id === stockCase.category_id);
            
            return {
              ...stockCase,
              likeCount: likeCount || 0,
              recentLikeCount: recentLikes?.length || 0,
              profiles: profile ? { username: profile.username, display_name: profile.display_name } : null,
              case_categories: category ? { name: category.name, color: category.color } : null
            };
          })
        );

        // Define trending criteria: cases with 3+ likes in last 24h OR 10+ total likes
        const trendingCases = casesWithMetrics.filter(c => 
          c.recentLikeCount >= 3 || c.likeCount >= 10
        );
        
        let finalCases;
        if (trendingCases.length > 0) {
          // Sort by trending score: recent activity weighted higher than total likes
          finalCases = trendingCases
            .sort((a, b) => {
              const scoreA = (a.recentLikeCount * 3) + a.likeCount;
              const scoreB = (b.recentLikeCount * 3) + b.likeCount;
              
              if (scoreB !== scoreA) {
                return scoreB - scoreA;
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, limit);
        } else {
          // Fallback: show most liked cases if no trending cases
          finalCases = casesWithMetrics
            .filter(c => c.likeCount > 0)
            .sort((a, b) => {
              if (b.likeCount !== a.likeCount) {
                return b.likeCount - a.likeCount;
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, limit);
        }

        // If still no cases, show recent cases
        if (finalCases.length === 0) {
          finalCases = casesWithMetrics
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
