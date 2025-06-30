
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteAnalysis = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Framgång",
        description: "Analysen har tagits bort",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort analysen: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAdminAnalyses = () => {
  const { toast } = useToast();

  const fetchAllAnalyses = async () => {
    try {
      const { data: analysesData, error } = await supabase
        .from('analyses')
        .select(`
          *,
          profiles (username, display_name),
          stock_cases (company_name, title),
          user_portfolios (portfolio_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return analysesData || [];
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda analyser",
        variant: "destructive",
      });
      return [];
    }
  };

  return { fetchAllAnalyses };
};
