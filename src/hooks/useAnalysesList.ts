
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Analysis } from '@/types/analysis';

export const useAnalysesList = (limit = 10) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['analyses', limit, user?.id],
    queryFn: async () => {
      const { data: analysesData, error: analysesError } = await supabase
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

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        throw analysesError;
      }

      if (!analysesData || analysesData.length === 0) {
        return [];
      }

      // Get like counts and user's like status for each analysis
      const analysesWithStats = await Promise.all(
        analysesData.map(async (analysis) => {
          try {
            const [likeCountResult, userLikeResult] = await Promise.all([
              supabase.rpc('get_analysis_like_count', { analysis_id: analysis.id }),
              user ? supabase.rpc('user_has_liked_analysis', { analysis_id: analysis.id, user_id: user.id }) : Promise.resolve({ data: false })
            ]);

            // Safely handle related_holdings
            let relatedHoldings: any[] = [];
            if (analysis.related_holdings) {
              if (Array.isArray(analysis.related_holdings)) {
                relatedHoldings = analysis.related_holdings;
              } else if (typeof analysis.related_holdings === 'object') {
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
          } catch (error) {
            console.error(`Error processing analysis ${analysis.id}:`, error);
            // Return basic analysis if processing fails
            return {
              ...analysis,
              analysis_type: analysis.analysis_type as 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive',
              likes_count: 0,
              isLiked: false,
              related_holdings: [],
              profiles: Array.isArray(analysis.profiles) ? analysis.profiles[0] || null : analysis.profiles
            };
          }
        })
      );

      return analysesWithStats;
    },
    retry: 1,
    retryDelay: 1000,
  });
};
