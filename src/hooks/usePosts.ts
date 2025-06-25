
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  title: string;
  content: string;
  post_type: 'reflection' | 'case_analysis' | 'market_insight';
  created_at: string;
  updated_at: string;
  user_id: string;
  stock_case_id?: string;
  is_public: boolean;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  stock_cases?: {
    company_name: string;
    title: string;
  } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export const usePosts = (limit = 10) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, display_name),
          stock_cases (company_name, title)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get like counts, comment counts, and user's like status for each post
      const postsWithStats = await Promise.all(
        (data || []).map(async (post) => {
          const [likeCountResult, commentCountResult, userLikeResult] = await Promise.all([
            supabase.rpc('get_post_like_count', { post_id: post.id }),
            supabase.rpc('get_post_comment_count', { post_id: post.id }),
            user ? supabase.rpc('user_has_liked_post', { post_id: post.id, user_id: user.id }) : null
          ]);

          return {
            ...post,
            post_type: post.post_type as 'reflection' | 'case_analysis' | 'market_insight',
            likeCount: likeCountResult.data || 0,
            commentCount: commentCountResult.data || 0,
            isLiked: userLikeResult?.data || false
          };
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
      post_type: 'reflection' | 'case_analysis' | 'market_insight';
      stock_case_id?: string;
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
