import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFollowingAnalyses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following-analyses', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      // First get the users that the current user follows
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        throw followsError;
      }

      if (!follows || follows.length === 0) {
        return [];
      }

      const followedUserIds = follows.map(follow => follow.following_id);

      // Then get analyses from those users
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            created_at
          )
        `)
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false });

      if (analysesError) {
        console.error('Error fetching following analyses:', analysesError);
        throw analysesError;
      }

      // Get like counts and user like status for each analysis
      const transformedAnalyses = await Promise.all(
        (analyses || []).map(async (analysis) => {
          const [likeCountResult, userLikeResult, commentCountResult] = await Promise.all([
            supabase.rpc('get_analysis_like_count', { analysis_id: analysis.id }),
            user ? supabase
              .from('analysis_likes')
              .select('id')
              .eq('analysis_id', analysis.id)
              .eq('user_id', user.id)
              .maybeSingle() : null,
            supabase.rpc('get_analysis_comment_count', { analysis_id: analysis.id })
          ]);

          return {
            ...analysis,
            likes_count: likeCountResult.data || 0,
            comments_count: commentCountResult.data || 0,
            isLiked: !!userLikeResult?.data
          };
        })
      );

      return transformedAnalyses;
    },
    enabled: !!user?.id,
  });
};