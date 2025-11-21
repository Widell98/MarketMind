import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'dismissedStockCaseIds';

const buildStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

const readLocalDismissed = (userId?: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(buildStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read dismissed stock cases from localStorage', error);
    return [];
  }
};

const persistLocalDismissed = (ids: string[], userId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(buildStorageKey(userId), JSON.stringify(ids));
  } catch (error) {
    console.error('Could not persist dismissed stock cases to localStorage', error);
  }
};

type DismissedCase = {
  case_id: string;
};

export const useDismissedStockCases = () => {
  const { user } = useAuth();
  const [dismissedCaseIds, setDismissedCaseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupabaseDismissed = useCallback(async (): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error: supabaseError } = await supabase
        .from('dismissed_stock_cases')
        .select('case_id')
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

      return ((data as DismissedCase[]) || []).map((item) => item.case_id);
    } catch (err) {
      console.warn('Falling back to local dismissed cases because Supabase sync failed', err);
      setError('Kunde inte synka avfärdade case mot Supabase. Lokalt sparande används.');
      return [];
    }
  }, [user]);

  const persistSupabaseDismissed = useCallback(
    async (ids: string[]) => {
      if (!user) return;

      try {
        if (ids.length === 0) {
          await supabase.from('dismissed_stock_cases').delete().eq('user_id', user.id);
          return;
        }

        await supabase.from('dismissed_stock_cases').upsert(
          ids.map((caseId) => ({ user_id: user.id, case_id: caseId })),
          { onConflict: 'user_id,case_id' }
        );
      } catch (err) {
        console.warn('Could not persist dismissed cases to Supabase; continuing with local cache', err);
        setError('Kunde inte synka avfärdade case mot Supabase. Lokalt sparande används.');
      }
    },
    [user]
  );

  const persistDismissed = useCallback(
    (ids: string[]) => {
      persistLocalDismissed(ids, user?.id);
      void persistSupabaseDismissed(ids);
    },
    [persistSupabaseDismissed, user?.id]
  );

  useEffect(() => {
    const initializeDismissed = async () => {
      setLoading(true);
      setError(null);
      const localDismissed = readLocalDismissed(user?.id);
      let merged = [...localDismissed];

      if (user) {
        const supabaseDismissed = await fetchSupabaseDismissed();
        if (supabaseDismissed.length > 0) {
          merged = Array.from(new Set([...localDismissed, ...supabaseDismissed]));
        }
      }

      setDismissedCaseIds(merged);
      persistLocalDismissed(merged, user?.id);
      void persistSupabaseDismissed(merged);
      setLoading(false);
    };

    void initializeDismissed();
  }, [fetchSupabaseDismissed, persistSupabaseDismissed, user?.id]);

  const addDismissedCase = useCallback(
    (caseId: string) => {
      setDismissedCaseIds((prev) => {
        if (prev.includes(caseId)) return prev;
        const updated = [...prev, caseId];
        persistDismissed(updated);
        return updated;
      });
    },
    [persistDismissed]
  );

  const removeDismissedCase = useCallback(
    (caseId: string) => {
      setDismissedCaseIds((prev) => {
        const updated = prev.filter((id) => id !== caseId);
        persistDismissed(updated);
        return updated;
      });
    },
    [persistDismissed]
  );

  const resetDismissedCases = useCallback(() => {
    setDismissedCaseIds([]);
    persistDismissed([]);
  }, [persistDismissed]);

  const dismissedCount = useMemo(() => dismissedCaseIds.length, [dismissedCaseIds]);

  return {
    dismissedCaseIds,
    dismissedCount,
    loading,
    error,
    addDismissedCase,
    removeDismissedCase,
    resetDismissedCases,
  };
};

export default useDismissedStockCases;
