
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Analysis } from '@/types/analysis';

export const useAnalysisDetail = (id: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['analysis', id, user?.id],
    queryFn: async () => {
      const { data: analysisData, error: analysisError } = await supabase
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
        .eq('id', id)
        .single();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
        throw analysisError;
      }

      // Get like count and user's like status
      const [likeCountResult, userLikeResult, commentCountResult] = await Promise.all([
        supabase.rpc('get_analysis_like_count', { analysis_id: id }),
        user ? supabase
          .from('analysis_likes')
          .select('id')
          .eq('analysis_id', id)
          .eq('user_id', user.id)
          .maybeSingle() : null,
        supabase.rpc('get_analysis_comment_count', { analysis_id: id })
      ]);

      // Safely handle related_holdings
      let relatedHoldings: any[] = [];
      if (analysisData.related_holdings) {
        if (Array.isArray(analysisData.related_holdings)) {
          relatedHoldings = analysisData.related_holdings;
        } else if (typeof analysisData.related_holdings === 'object') {
          relatedHoldings = Object.values(analysisData.related_holdings);
        }
      }

      const transformedAnalysis: Analysis = {
        ...analysisData,
        analysis_type: analysisData.analysis_type as 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive',
        likes_count: likeCountResult.data || 0,
        comments_count: commentCountResult.data || 0,
        isLiked: !!userLikeResult?.data,
        related_holdings: relatedHoldings,
        profiles: Array.isArray(analysisData.profiles) ? analysisData.profiles[0] || null : analysisData.profiles
      };

      return transformedAnalysis;
    },
  });
};
