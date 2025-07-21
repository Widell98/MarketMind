
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useStockCaseFollows = (stockCaseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get follow count
  const { data: followCountData } = useQuery({
    queryKey: ['stock-case-follow-count', stockCaseId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stock_case_follow_count', {
        case_id: stockCaseId,
      });
      if (error) throw error;
      return data;
    },
  });

  // Check if current user follows this case
  const { data: isFollowingData } = useQuery({
    queryKey: ['stock-case-user-follows', stockCaseId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('user_follows_case', {
        case_id: stockCaseId,
        user_id: user.id,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Toggle follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be authenticated');

      if (isFollowingData) {
        // Unfollow
        const { error } = await supabase
          .from('stock_case_follows')
          .delete()
          .eq('stock_case_id', stockCaseId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('stock_case_follows')
          .insert({
            stock_case_id: stockCaseId,
            user_id: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-case-follow-count', stockCaseId] });
      queryClient.invalidateQueries({ queryKey: ['stock-case-user-follows', stockCaseId, user?.id] });
      
      toast({
        title: isFollowingData ? "Slutat följa" : "Följer nu",
        description: isFollowingData ? "Du följer inte längre detta stock case" : "Du följer nu detta stock case",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    followCount: followCountData || 0,
    isFollowing: isFollowingData || false,
    toggleFollow: followMutation.mutate,
    loading: followMutation.isPending,
  };
};
