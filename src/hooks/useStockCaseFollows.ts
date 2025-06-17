
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

      if (countError) {
        console.error('Error fetching follow count:', countError);
        // Don't throw error for follow count - just log it
        setFollowCount(0);
      } else {
        setFollowCount(countData || 0);
      }

      // Check if current user is following (only if authenticated)
      if (user) {
        const { data: followingData, error: followingError } = await supabase
          .rpc('user_follows_case', { case_id: stockCaseId, user_id: user.id });

        if (followingError) {
          console.error('Error checking follow status:', followingError);
          setIsFollowing(false);
        } else {
          setIsFollowing(followingData || false);
        }
      } else {
        // If no user, reset following state
        setIsFollowing(false);
      }
    } catch (error: any) {
      console.error('Error fetching follow data:', error);
      // Security: Don't expose internal errors to user
      setFollowCount(0);
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
        // Unfollow - RLS ensures user can only delete their own follows
        const { error } = await supabase
          .from('stock_case_follows')
          .delete()
          .eq('stock_case_id', stockCaseId)
          .eq('user_id', user.id);

        if (error) {
          // Security: Check for specific error types
          if (error.code === '42501') {
            throw new Error('Du har inte behörighet att utföra denna åtgärd');
          }
          throw error;
        }

        setIsFollowing(false);
        setFollowCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Slutade följa",
          description: "Du följer inte längre detta aktiecase",
        });
      } else {
        // Follow - RLS ensures user can only create follows for themselves
        const { error } = await supabase
          .from('stock_case_follows')
          .insert({
            stock_case_id: stockCaseId,
            user_id: user.id
          });

        if (error) {
          // Security: Check for specific error types
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
        setFollowCount(prev => prev + 1);
        
        toast({
          title: "Följer nu",
          description: "Du följer nu detta aktiecase",
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      
      // Security: Don't expose internal error details
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
      fetchFollowData();
    }
  }, [stockCaseId, user?.id]);

  // Cleanup effect when component unmounts or user changes
  useEffect(() => {
    return () => {
      setFollowCount(0);
      setIsFollowing(false);
      setLoading(false);
    };
  }, [user?.id]);

  return {
    followCount,
    isFollowing,
    loading,
    toggleFollow
  };
};
