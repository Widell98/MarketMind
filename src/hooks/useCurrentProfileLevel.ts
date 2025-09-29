import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const REQUIRED_STOCK_CASE_LEVELS = ['analyst', 'pro'] as const;
export type StockCaseEligibleLevel = typeof REQUIRED_STOCK_CASE_LEVELS[number];

type ProfileLevel = StockCaseEligibleLevel | string | null;

export const normalizeProfileLevel = (level: string | null | undefined): string | null =>
  typeof level === 'string' ? level.toLowerCase() : null;

export const hasRequiredStockCaseLevel = (
  level: string | null | undefined
): level is StockCaseEligibleLevel => {
  const normalized = normalizeProfileLevel(level);
  return !!normalized && REQUIRED_STOCK_CASE_LEVELS.includes(normalized as StockCaseEligibleLevel);
};

interface UseCurrentProfileLevelReturn {
  level: ProfileLevel;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCurrentProfileLevel = (): UseCurrentProfileLevelReturn => {
  const { user } = useAuth();
  const [level, setLevel] = useState<ProfileLevel>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLevel = useCallback(async () => {
    if (!user?.id) {
      setLevel(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single<{ level: ProfileLevel }>();

      if (queryError) {
        throw queryError;
      }

      setLevel(data?.level ?? null);
    } catch (err: any) {
      console.error('Failed to load profile level:', err);
      setError(err);
      setLevel(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchLevel();
  }, [fetchLevel]);

  return {
    level,
    loading,
    error,
    refetch: fetchLevel,
  };
};
