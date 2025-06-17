
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
    // If no user, not following
    if (!user) {
      setIsFollowing(false);
      return;
    }

    try {
      const { data: followingData, error: followingError } = await supabase
        .rpc('user_follows_case', { case_id: stockCaseId, user_id: user.id });

      if (followingError) {
        console.error('Error checking follow status:', followingError);
        setIsFollowing(false);
      } else {
        setIsFollowing(followingData || false);
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

    // Security: Validate stockCaseId
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
        // Unfollow
        const { error } = await supabase
          .from('stock_case_follows')
          .delete()
          .eq('stock_case_id', stockCaseId)
          .eq('user_id', user.id);

        if (error) {
          if (error.code === '42501') {
            throw new Error('Du har inte behörighet att utföra denna åtgärd');
          }
          throw error;
        }

        setIsFollowing(false);
        
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

        if (error) {
          if (error.code === '42501') {
            throw new Error('Du har inte behörighet att utföra denna åtgärd');
          }
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
      
      const userMessage = error.message?.includes('behörighet') 
        ? error.message 
        : "Kunde inte uppdatera följning. Försök igen.";
        
      toast({
        title: "Fel",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockCaseId && stockCaseId.trim() !== '') {
      fetchFollowStatus();
    }
  }, [stockCaseId, user?.id]);

  // Cleanup effect when component unmounts or user changes
  useEffect(() => {
    return () => {
      setIsFollowing(false);
      setLoading(false);
    };
  }, [user?.id]);

  return {
    isFollowing,
    loading,
    toggleFollow
  };
};
