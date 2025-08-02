import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAnalysisLikes = (analysisId: string) => {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch like count and user's like status
  const fetchLikeData = async () => {
    if (!analysisId) return;

    try {
      // Get total like count
      const { data: likeCountData, error: countError } = await supabase
        .rpc('get_analysis_like_count', { analysis_id: analysisId });

      if (countError) throw countError;
      setLikeCount(likeCountData || 0);

      // Check if current user has liked this analysis
      if (user) {
        const { data: userLikeData, error: userLikeError } = await supabase
          .rpc('user_has_liked_analysis', { 
            analysis_id: analysisId, 
            user_id: user.id 
          });

        if (userLikeError) throw userLikeError;
        setIsLiked(userLikeData || false);
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikeData();
  }, [analysisId, user]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att gilla analyser",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('analysis_likes')
          .delete()
          .eq('analysis_id', analysisId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase
          .from('analysis_likes')
          .insert([{ analysis_id: analysisId, user_id: user.id }]);

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera gillning",
        variant: "destructive",
      });
    }
  };

  return {
    likeCount,
    isLiked,
    loading,
    toggleLike,
    refetch: fetchLikeData
  };
};