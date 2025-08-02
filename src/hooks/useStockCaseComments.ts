import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StockCaseComment {
  id: string;
  stock_case_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

export const useStockCaseComments = (stockCaseId: string) => {
  return useQuery({
    queryKey: ['stock-case-comments', stockCaseId],
    queryFn: async () => {
      // First get comments
      const { data: comments, error: commentsError } = await supabase
        .from('stock_case_comments')
        .select('*')
        .eq('stock_case_id', stockCaseId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Then get profiles for each comment
      const commentsWithProfiles = await Promise.all(
        comments.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || { username: 'Anonym', display_name: null }
          };
        })
      );

      return commentsWithProfiles as StockCaseComment[];
    },
    enabled: !!stockCaseId,
  });
};

export const useCreateStockCaseComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stockCaseId, content }: { stockCaseId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('stock_case_comments')
        .insert({
          stock_case_id: stockCaseId,
          user_id: user.id,
          content: content.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['stock-case-comments', variables.stockCaseId] 
      });
      toast({
        title: "Kommentar tillagd",
        description: "Din kommentar har publicerats",
      });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kommentar",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStockCaseComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('stock_case_comments')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['stock-case-comments', data.stock_case_id] 
      });
      toast({
        title: "Kommentar uppdaterad",
        description: "Din kommentar har uppdaterats",
      });
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera kommentar",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStockCaseComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('stock_case_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return commentId;
    },
    onSuccess: (_, commentId) => {
      // We need to get the stock case ID from the cache to invalidate the right query
      queryClient.invalidateQueries({ 
        queryKey: ['stock-case-comments'] 
      });
      toast({
        title: "Kommentar borttagen",
        description: "Kommentaren har tagits bort",
      });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort kommentar",
        variant: "destructive",
      });
    },
  });
};