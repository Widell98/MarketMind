import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'swipeLikedCaseIds';

const buildStorageKey = (userId?: string) => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY);

const readLocalLikes = (userId?: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(buildStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read swipe likes from localStorage', error);
    return [];
  }
};

const persistLocalLikes = (ids: string[], userId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(buildStorageKey(userId), JSON.stringify(ids));
  } catch (error) {
    console.error('Could not persist swipe likes to localStorage', error);
  }
};

type SwipeLike = {
  case_id: string;
};

export const useSwipeLikedCases = () => {
  const { user } = useAuth();
  const [likedCaseIds, setLikedCaseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupabaseLikes = useCallback(async (): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error: supabaseError } = await supabase
        .from('swipe_liked_cases')
        .select('case_id')
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

      return ((data as SwipeLike[]) || []).map((item) => item.case_id);
    } catch (err) {
      console.warn('Falling back to local swipe likes because Supabase sync failed', err);
      setError('Kunde inte synka swipe-gillade case mot Supabase. Lokalt sparande används.');
      return [];
    }
  }, [user]);

  const persistSupabaseLikes = useCallback(
    async (ids: string[]) => {
      if (!user) return;

      try {
        if (ids.length === 0) {
          await supabase.from('swipe_liked_cases').delete().eq('user_id', user.id);
          return;
        }

        await supabase.from('swipe_liked_cases').upsert(
          ids.map((caseId) => ({ user_id: user.id, case_id: caseId })),
          { onConflict: 'user_id,case_id' }
        );
      } catch (err) {
        console.warn('Could not persist swipe likes to Supabase; continuing with local cache', err);
        setError('Kunde inte synka swipe-gillade case mot Supabase. Lokalt sparande används.');
      }
    },
    [user]
  );

  const persistLikes = useCallback(
    (ids: string[]) => {
      persistLocalLikes(ids, user?.id);
      void persistSupabaseLikes(ids);
    },
    [persistSupabaseLikes, user?.id]
  );

  useEffect(() => {
    const initializeLikes = async () => {
      setLoading(true);
      setError(null);
      const localLikes = readLocalLikes(user?.id);
      let merged = [...localLikes];

      if (user) {
        const supabaseLikes = await fetchSupabaseLikes();
        if (supabaseLikes.length > 0) {
          merged = Array.from(new Set([...localLikes, ...supabaseLikes]));
        }
      }

      setLikedCaseIds(merged);
      persistLocalLikes(merged, user?.id);
      setLoading(false);
    };

    void initializeLikes();
  }, [fetchSupabaseLikes, user?.id]);

  const likeCase = useCallback(
    (caseId: string) => {
      setLikedCaseIds((prev) => {
        if (prev.includes(caseId)) return prev;
        const updated = [...prev, caseId];
        persistLikes(updated);
        return updated;
      });
    },
    [persistLikes]
  );

  const removeLikedCase = useCallback(
    (caseId: string) => {
      setLikedCaseIds((prev) => {
        const updated = prev.filter((id) => id !== caseId);
        persistLikes(updated);
        return updated;
      });
    },
    [persistLikes]
  );

  const clearLikedCases = useCallback(() => {
    setLikedCaseIds([]);
    persistLikes([]);
  }, [persistLikes]);

  const isCaseLiked = useCallback(
    (caseId: string) => likedCaseIds.includes(caseId),
    [likedCaseIds]
  );

  const likedCount = useMemo(() => likedCaseIds.length, [likedCaseIds]);

  return {
    likedCaseIds,
    likedCount,
    loading,
    error,
    likeCase,
    removeLikedCase,
    clearLikedCases,
    isCaseLiked,
  };
};
