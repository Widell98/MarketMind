
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStockCaseFollows = (stockCaseId: string) => {
  const [followCount, setFollowCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFollowData = async () => {
    try {
      // Get follow count
      const { data: countData, error: countError } = await supabase
        .rpc('get_stock_case_follow_count', { case_id: stockCaseId });

      if (countError) throw countError;
      setFollowCount(countData || 0);

      // Check if current user is following (only if authenticated)
      if (user) {
        const { data: followingData, error: followingError } = await supabase
          .rpc('user_follows_case', { case_id: stockCaseId, user_id: user.id });

        if (followingError) throw followingError;
        setIsFollowing(followingData || false);
      } else {
        // If no user, reset following state
        setIsFollowing(false);
      }
    } catch (error: any) {
      console.error('Error fetching follow data:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att följa aktiecases",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('stock_case_follows')
          .delete()
          .eq('stock_case_id', stockCaseId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsFollowing(false);
        setFollowCount(prev => prev - 1);
        
        toast({
          title: "Slutade följa",
          description: "Du följer inte längre detta aktiecase",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('stock_case_follows')
          .insert({
            stock_case_id: stockCaseId,
            user_id: user.id
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowCount(prev => prev + 1);
        
        toast({
          title: "Följer nu",
          description: "Du följer nu detta aktiecase",
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera följning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockCaseId) {
      fetchFollowData();
    }
  }, [stockCaseId, user?.id]); // Added user?.id as dependency to refetch when user changes

  return {
    followCount,
    isFollowing,
    loading,
    toggleFollow
  };
};
