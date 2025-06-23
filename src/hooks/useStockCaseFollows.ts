
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStockCaseFollows = (stockCaseId: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFollowStatus = async () => {
    if (!user) {
      setIsFollowing(false);
      return;
    }

    if (!stockCaseId || stockCaseId.trim() === '') {
      setIsFollowing(false);
      return;
    }

    try {
      // Check if current user follows this case
      const { data: followData, error: followError } = await supabase
        .from('stock_case_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('stock_case_id', stockCaseId)
        .maybeSingle();

      if (followError) {
        console.error('Error checking follow status:', followError);
        setIsFollowing(false);
      } else {
        setIsFollowing(!!followData);
      }
    } catch (error: any) {
      console.error('Error fetching follow status:', error);
      setIsFollowing(false);
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

    if (!stockCaseId || stockCaseId.trim() === '') {
      toast({
        title: "Fel",
        description: "Ogiltigt aktiecase ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow - remove the follow
        const { error } = await supabase
          .from('stock_case_follows')
          .delete()
          .eq('stock_case_id', stockCaseId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setIsFollowing(false);
        
        toast({
          title: "Slutade följa",
          description: "Du följer inte längre detta aktiecase",
        });
      } else {
        // Follow - add the follow
        const { error } = await supabase
          .from('stock_case_follows')
          .insert({
            stock_case_id: stockCaseId,
            user_id: user.id
          });

        if (error) {
          if (error.code === '23505') {
            // Duplicate entry - user already follows this case
            setIsFollowing(true);
            return;
          }
          throw error;
        }

        setIsFollowing(true);
        
        toast({
          title: "Följer nu",
          description: "Du följer nu detta aktiecase",
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera följning. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockCaseId && stockCaseId.trim() !== '') {
      fetchFollowStatus();
    } else {
      setIsFollowing(false);
    }
  }, [stockCaseId, user?.id]);

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setIsFollowing(false);
      setLoading(false);
    } else {
      // Refetch when user changes
      if (stockCaseId && stockCaseId.trim() !== '') {
        fetchFollowStatus();
      }
    }
  }, [user?.id]);

  return {
    isFollowing,
    loading,
    toggleFollow
  };
};
