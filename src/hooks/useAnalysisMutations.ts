
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreateAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisData: {
      title: string;
      content: string;
      analysis_type: 'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive';
      stock_case_id?: string;
      portfolio_id?: string;
      tags?: string[];
      is_public?: boolean;
      related_holdings?: any[];
      ai_generated?: boolean;
      shared_from_insight_id?: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('analyses')
        .insert({
          ...analysisData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Analys skapad!",
        description: "Din analys har publicerats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid skapande av analys",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateSharedPortfolioAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareData: {
      portfolio_id: string;
      analysis_id: string;
      share_type: 'insight' | 'recommendation' | 'performance';
      original_data?: any;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('shared_portfolio_analyses')
        .insert({
          ...shareData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Analys delad!",
        description: "Din portföljanalys har delats med communityn.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid delning av analys",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useToggleAnalysisLike = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, isLiked }: { analysisId: string; isLiked: boolean }) => {
      if (!user) throw new Error('User must be authenticated');

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('analysis_likes')
          .delete()
          .eq('analysis_id', analysisId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('analysis_likes')
          .insert({
            analysis_id: analysisId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid uppdatering av gilla",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
