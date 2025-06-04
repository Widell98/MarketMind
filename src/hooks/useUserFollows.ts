
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type UserFollow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export const useUserFollows = () => {
  const [follows, setFollows] = useState<UserFollow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFollows = async () => {
    if (!user) {
      setFollows([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id);

      if (error) throw error;
      setFollows(data || []);
    } catch (error: any) {
      console.error('Error fetching follows:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda följningar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollows();
  }, [user]);

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert([{ follower_id: user.id, following_id: userId }]);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Du följer nu denna användare",
      });
      
      fetchFollows();
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte följa användare",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Du följer inte längre denna användare",
      });
      
      fetchFollows();
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Fel",
        description: "Kunde inte sluta följa användare",
        variant: "destructive",
      });
    }
  };

  const isFollowing = (userId: string) => {
    return follows.some(follow => follow.following_id === userId);
  };

  return {
    follows,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    refetch: fetchFollows,
  };
};
