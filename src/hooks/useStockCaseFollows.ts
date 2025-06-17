
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
    // If no user, definitely not following
    if (!user) {
      console.log('No user logged in, setting isFollowing to false');
      setIsFollowing(false);
      return;
    }

    // If no stockCaseId, can't determine follow status
    if (!stockCaseId || stockCaseId.trim() === '') {
      console.log('No stockCaseId provided, setting isFollowing to false');
      setIsFollowing(false);
      return;
    }

    try {
      console.log(`Checking follow status for user ${user.id} and case ${stockCaseId}`);
      
      // Use the secure database function which respects RLS policies
      const { data: followingData, error: followingError } = await supabase
        .rpc('user_follows_case', { case_id: stockCaseId, user_id: user.id });

      if (followingError) {
        console.error('Error checking follow status:', followingError);
        // Handle RLS policy errors gracefully
        if (followingError.code === '42501' || followingError.message?.includes('permission')) {
          console.log('RLS policy restricting access - user not following');
          setIsFollowing(false);
        } else {
          setIsFollowing(false);
        }
      } else {
        const followStatus = followingData || false;
        console.log(`Follow status result: ${followStatus}`);
        setIsFollowing(followStatus);
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
        // Unfollow - RLS policy ensures users can only delete their own follows
        console.log(`Unfollowing case ${stockCaseId} for user ${user.id}`);
        
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
        // Follow - RLS policy ensures users can only create follows for themselves
        console.log(`Following case ${stockCaseId} for user ${user.id}`);
        
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
            console.log('User already follows this case, setting state to true');
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
    console.log(`useStockCaseFollows effect triggered - stockCaseId: ${stockCaseId}, user: ${user?.id}`);
    
    if (stockCaseId && stockCaseId.trim() !== '') {
      fetchFollowStatus();
    } else {
      // Reset state if no valid stockCaseId
      setIsFollowing(false);
    }
  }, [stockCaseId, user?.id]);

  // Enhanced cleanup effect when user changes or component unmounts
  useEffect(() => {
    return () => {
      console.log('Cleaning up useStockCaseFollows state');
      setIsFollowing(false);
      setLoading(false);
    };
  }, [user?.id]);

  // Additional effect to handle user logout
  useEffect(() => {
    if (!user) {
      console.log('User logged out, resetting follow state');
      setIsFollowing(false);
      setLoading(false);
    }
  }, [user]);

  return {
    isFollowing,
    loading,
    toggleFollow
  };
};
