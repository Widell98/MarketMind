
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'reflection' | 'case_analysis' | 'market_insight';
  stock_case_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    bio?: string;
  };
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            display_name,
            bio
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda inlägg",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const createPost = async (postData: {
    title: string;
    content: string;
    post_type: 'reflection' | 'case_analysis' | 'market_insight';
    stock_case_id?: string;
    is_public?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{ ...postData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Inlägg skapat!",
      });
      
      fetchPosts();
      return data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa inlägg",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Inlägg uppdaterat!",
      });
      
      fetchPosts();
      return data;
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inlägg",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Inlägg raderat!",
      });
      
      fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera inlägg",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    refetch: fetchPosts,
  };
};
