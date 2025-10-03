import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type MarketSnapshot = Tables<'market_snapshots'>;

type MarketSnapshotState = {
  data: MarketSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const mapErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Kunde inte hämta marknadspulsen.';
};

export const useMarketSnapshot = (): MarketSnapshotState => {
  const [data, setData] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const { data: snapshot, error: fetchError } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setData(snapshot);
    } catch (fetchProblem) {
      console.error('Kunde inte hämta marknadspulsen:', fetchProblem);
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
    fetchSnapshot(true);
  }, [fetchSnapshot]);

  const refresh = useCallback(async () => {
    await fetchSnapshot(false);
  }, [fetchSnapshot]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
  };
};
