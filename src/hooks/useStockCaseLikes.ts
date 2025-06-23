
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
      // Get total like count for this case
      const { data: countData, error: countError } = await supabase
        .rpc('get_stock_case_like_count', { case_id: stockCaseId });

      if (countError) {
        console.error('Error fetching like count:', countError);
        setLikeCount(0);
      } else {
        setLikeCount(countData || 0);
      }

      // Check if current user has liked this case (only if authenticated)
      if (user) {
        const { data: likedData, error: likedError } = await supabase
          .from('stock_case_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('stock_case_id', stockCaseId)
          .maybeSingle();

        if (likedError) {
          console.error('Error checking like status:', likedError);
          setIsLiked(false);
        } else {
          setIsLiked(!!likedData);
        }
      } else {
        setIsLiked(false);
      }
    } catch (error: any) {
      console.error('Error fetching like data:', error);
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
        // Unlike - remove the like
        const { error } = await supabase
          .from('stock_case_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_case_id', stockCaseId);

        if (error) {
          throw error;
        }

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Gillning borttagen",
          description: "Du gillar inte längre detta aktiecase",
        });
      } else {
        // Like - add the like
        const { error } = await supabase
          .from('stock_case_likes')
          .insert({
            user_id: user.id,
            stock_case_id: stockCaseId
          });

        if (error) {
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
      
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera gillning. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stockCaseId && stockCaseId.trim() !== '') {
      fetchLikeData();
    } else {
      setLikeCount(0);
      setIsLiked(false);
    }
  }, [stockCaseId, user?.id]);

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      setLoading(false);
    } else {
      // Refetch when user changes
      if (stockCaseId && stockCaseId.trim() !== '') {
        fetchLikeData();
      }
    }
  }, [user?.id]);

  return {
    likeCount,
    isLiked,
    loading,
    toggleLike
  };
};
