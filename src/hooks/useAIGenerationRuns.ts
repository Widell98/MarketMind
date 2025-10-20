import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AIGenerationRun = {
  id: string;
  ai_batch_id: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  generated_count: number;
  error_message: string | null;
  triggered_by: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export const useLatestAIGenerationRun = () => {
  const query = useQuery({
    queryKey: ['ai-generation-runs', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generation_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return (data?.[0] as AIGenerationRun | undefined) ?? null;
    },
    refetchInterval: 1000 * 60 * 5,
  });

  return {
    latestRun: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};
