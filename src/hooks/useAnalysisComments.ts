
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisComment {
  id: string;
  analysis_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
}

export const useAnalysisComments = (analysisId: string) => {
  return useQuery({
    queryKey: ['analysis-comments', analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_comments')
        .select(`
          *,
          profiles!analysis_comments_user_id_fkey (
            username, 
            display_name
          )
        `)
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching analysis comments:', error);
        throw error;
      }

      return data as AnalysisComment[];
    },
  });
};

export const useCreateAnalysisComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: {
      analysisId: string;
      content: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('analysis_comments')
        .insert({
          analysis_id: commentData.analysisId,
          user_id: user.id,
          content: commentData.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-comments', variables.analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', variables.analysisId] });
      toast({
        title: "Kommentar skapad!",
        description: "Din kommentar har publicerats.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid skapande av kommentar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAnalysisComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: {
      commentId: string;
      content: string;
    }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('analysis_comments')
        .update({
          content: updateData.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updateData.commentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-comments', data.analysis_id] });
      toast({
        title: "Kommentar uppdaterad!",
        description: "Din kommentar har uppdaterats.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid uppdatering av kommentar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAnalysisComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('User must be authenticated');

      // First get the comment to know which analysis to invalidate
      const { data: commentData, error: fetchError } = await supabase
        .from('analysis_comments')
        .select('analysis_id')
        .eq('id', commentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('analysis_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return commentData.analysis_id;
    },
    onSuccess: (analysisId) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-comments', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid radering av kommentar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
