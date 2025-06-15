
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

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        // Get like count
        const { data: countData, error: countError } = await supabase
          .rpc('get_stock_case_like_count', { case_id: stockCaseId });

        if (countError) throw countError;
        setLikeCount(countData || 0);

        // Check if user has liked (only if authenticated)
        if (user) {
          const { data: likedData, error: likedError } = await supabase
            .rpc('user_has_liked_case', { 
              case_id: stockCaseId, 
              user_id: user.id 
            });

          if (likedError) throw likedError;
          setIsLiked(likedData || false);
        }
      } catch (error: any) {
        console.error('Error fetching like data:', error);
      }
    };

    if (stockCaseId) {
      fetchLikeData();
    }
  }, [stockCaseId, user]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Logga in",
        description: "Du måste vara inloggad för att gilla cases",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('stock_case_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_case_id', stockCaseId);

        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Add like
        const { error } = await supabase
          .from('stock_case_likes')
          .insert({
            user_id: user.id,
            stock_case_id: stockCaseId
          });

        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera gillning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    likeCount,
    isLiked,
    loading,
    toggleLike
  };
};
