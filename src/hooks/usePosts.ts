
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  title: string;
  content: string;
  post_type: 'reflection' | 'case_analysis' | 'market_insight' | 'portfolio_share';
  created_at: string;
  updated_at: string;
  user_id: string;
  stock_case_id?: string;
  portfolio_id?: string;
  is_public: boolean;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  stock_cases?: {
    company_name: string;
    title: string;
  } | null;
  user_portfolios?: {
    portfolio_name: string;
    asset_allocation: any;
    recommended_stocks: any[];
    expected_return: number | null;
    risk_score: number | null;
  } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export const usePosts = (limit = 10, followedOnly = false) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['posts', limit, followedOnly, user?.id],
    queryFn: async () => {
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          stock_cases (company_name, title),
          user_portfolios (portfolio_name, asset_allocation, recommended_stocks, expected_return, risk_score)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      // If followedOnly is true and user is authenticated, filter by followed users
      if (followedOnly && user) {
        // First get the list of users that the current user follows
        const { data: followedUsers, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followError) {
          console.error('Error fetching followed users:', followError);
          throw followError;
        }

        const followedUserIds = followedUsers?.map(f => f.following_id) || [];
        
        // If user doesn't follow anyone, include their own posts
        if (followedUserIds.length === 0) {
          followedUserIds.push(user.id);
        } else {
          // Also include user's own posts
          followedUserIds.push(user.id);
        }

        postsQuery = postsQuery.in('user_id', followedUserIds);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      // Then get profiles for all users
      const userIds = postsData?.map(post => post.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Merge posts with profiles
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || null
      })) || [];

      // Get like counts, comment counts, and user's like status for each post
      const postsWithStats = await Promise.all(
        postsWithProfiles.map(async (post) => {
          const [likeCountResult, commentCountResult, userLikeResult] = await Promise.all([
            supabase.rpc('get_post_like_count', { post_id: post.id }),
            supabase.rpc('get_post_comment_count', { post_id: post.id }),
            user ? supabase.rpc('user_has_liked_post', { post_id: post.id, user_id: user.id }) : null
          ]);

          // Transform the post data to match our Post interface
          const transformedPost: Post = {
            ...post,
            post_type: post.post_type as 'reflection' | 'case_analysis' | 'market_insight' | 'portfolio_share',
            likeCount: likeCountResult.data || 0,
            commentCount: commentCountResult.data || 0,
            isLiked: userLikeResult?.data || false,
            user_portfolios: post.user_portfolios ? {
              ...post.user_portfolios,
              recommended_stocks: Array.isArray(post.user_portfolios.recommended_stocks) 
                ? post.user_portfolios.recommended_stocks 
                : []
            } : null
          };

          return transformedPost;
        })
      );

      return postsWithStats;
    },
  });
};

export const useCreatePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: {
      title: string;
      content: string;
      post_type: 'reflection' | 'case_analysis' | 'market_insight' | 'portfolio_share';
      stock_case_id?: string;
      portfolio_id?: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...postData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useTogglePostLike = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('User must be authenticated');

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating like",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
