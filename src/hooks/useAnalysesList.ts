
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Analysis } from '@/types/analysis';

export const useAnalysesList = (limit = 10) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['analyses', limit, user?.id],
    queryFn: async () => {
      let analysesQuery = supabase
        .from('analyses')
        .select(`
          *,
          stock_cases (company_name, title),
          user_portfolios (portfolio_name),
          profiles!analyses_user_id_fkey (
            username, 
            display_name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: analysesData, error: analysesError } = await analysesQuery;

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        throw analysesError;
      }

      // Get like counts and user's like status for each analysis
      const analysesWithStats = await Promise.all(
        (analysesData || []).map(async (analysis) => {
          const [likeCountResult, userLikeResult] = await Promise.all([
            supabase.rpc('get_analysis_like_count', { analysis_id: analysis.id }),
            user ? supabase.rpc('user_has_liked_analysis', { analysis_id: analysis.id, user_id: user.id }) : null
          ]);

          // Safely handle related_holdings - ensure it's always an array
          let relatedHoldings: any[] = [];
          if (analysis.related_holdings) {
            if (Array.isArray(analysis.related_holdings)) {
              relatedHoldings = analysis.related_holdings;
            } else if (typeof analysis.related_holdings === 'object') {
              // If it's an object, try to convert it to an array
              relatedHoldings = Object.values(analysis.related_holdings);
            }
          }

          const transformedAnalysis: Analysis = {
            ...analysis,
            analysis_type: analysis.analysis_type as 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive',
            likes_count: likeCountResult.data || 0,
            isLiked: userLikeResult?.data || false,
            related_holdings: relatedHoldings,
            profiles: Array.isArray(analysis.profiles) ? analysis.profiles[0] || null : analysis.profiles
          };

          return transformedAnalysis;
        })
      );

      return analysesWithStats;
    },
  });
};
