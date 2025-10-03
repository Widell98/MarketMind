import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DailyCase = Tables<'daily_cases'>;
type VoteDirection = 'up' | 'down';

type DailyCaseState = {
  data: DailyCase | null;
  loading: boolean;
  refreshing: boolean;
  voting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  vote: (direction: VoteDirection) => Promise<void>;
};

const mapErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ett oväntat fel inträffade vid hämtning av dagens case.';
};

export const useDailyCase = (): DailyCaseState => {
  const [data, setData] = useState<DailyCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const { data: dailyCase, error: fetchError } = await supabase
        .from('daily_cases')
        .select('*')
        .order('case_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setData(dailyCase);
    } catch (fetchProblem) {
      console.error('Kunde inte hämta dagens case:', fetchProblem);
      setError(mapErrorMessage(fetchProblem));
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCase(true);
  }, [fetchCase]);

  const refresh = useCallback(async () => {
    await fetchCase(false);
  }, [fetchCase]);

  const vote = useCallback(async (direction: VoteDirection) => {
    if (!data) {
      return;
    }

    try {
      setVoting(true);
      setError(null);

      const { data: updatedCase, error: voteError } = await supabase.rpc('increment_vote', {
        case_id: data.id,
        direction,
      });

      if (voteError) {
        throw voteError;
      }

      if (updatedCase) {
        setData(updatedCase as DailyCase);
      }
    } catch (voteProblem) {
      console.error('Kunde inte registrera röst:', voteProblem);
      setError(mapErrorMessage(voteProblem));
      throw voteProblem;
    } finally {
      setVoting(false);
    }
  }, [data]);

  return {
    data,
    loading,
    refreshing,
    voting,
    error,
    refresh,
    vote,
  };
};
