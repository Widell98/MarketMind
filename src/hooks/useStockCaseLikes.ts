
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStockCaseLikes = (stockCaseId: string) => {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLikeData = async () => {
    try {
      // Get like count
      const { data: countData, error: countError } = await supabase
        .rpc('get_stock_case_like_count', { case_id: stockCaseId });

      if (countError) {
        console.error('Error fetching like count:', countError);
        // Don't throw error for like count - just log it
        setLikeCount(0);
      } else {
        setLikeCount(countData || 0);
      }

      // Check if current user has liked (only if authenticated)
      if (user) {
        const { data: likedData, error: likedError } = await supabase
          .rpc('user_has_liked_case', { 
            case_id: stockCaseId, 
            user_id: user.id 
          });

        if (likedError) {
          console.error('Error checking like status:', likedError);
          setIsLiked(false);
        } else {
          setIsLiked(likedData || false);
        }
      } else {
        // If no user, reset like state
        setIsLiked(false);
      }
    } catch (error: any) {
      console.error('Error fetching like data:', error);
      // Security: Don't expose internal errors to user
      setLikeCount(0);
      setIsLiked(false);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att gilla aktiecases",
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
      if (isLiked) {
        // Remove like - RLS ensures user can only delete their own likes
        const { error } = await supabase
          .from('stock_case_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_case_id', stockCaseId);

        if (error) {
          // Security: Check for specific error types
          if (error.code === '42501') {
            throw new Error('Du har inte behörighet att utföra denna åtgärd');
          }
          throw error;
        }

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Gillning borttagen",
          description: "Du gillar inte längre detta aktiecase",
        });
      } else {
        // Add like - RLS ensures user can only create likes for themselves
        const { error } = await supabase
          .from('stock_case_likes')
          .insert({
            user_id: user.id,
            stock_case_id: stockCaseId
          });

        if (error) {
          // Security: Check for specific error types
          if (error.code === '42501') {
            throw new Error('Du har inte behörighet att utföra denna åtgärd');
          }
          if (error.code === '23505') {
            // Duplicate entry - user already likes this case
            setIsLiked(true);
            return;
          }
          throw error;
        }

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        
        toast({
          title: "Aktiecase gillat!",
          description: "Du gillar nu detta aktiecase",
        });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // Security: Don't expose internal error details
      const userMessage = error.message?.includes('behörighet') 
        ? error.message 
        : "Kunde inte uppdatera gillning. Försök igen.";
        
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
      fetchLikeData();
    }
  }, [stockCaseId, user?.id]);

  // Cleanup effect when component unmounts or user changes
  useEffect(() => {
    return () => {
      setLikeCount(0);
      setIsLiked(false);
      setLoading(false);
    };
  }, [user?.id]);

  return {
    likeCount,
    isLiked,
    loading,
    toggleLike
  };
};
