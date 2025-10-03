import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_PREFIX = 'marketmind:morning-brief:';

const getStorageKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

const isSameDay = (firstIso: string | null | undefined, secondIso: string | null | undefined) => {
  if (!firstIso || !secondIso) return false;

  const firstDate = new Date(firstIso);
  const secondDate = new Date(secondIso);

  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) {
    return false;
  }

  return (
    firstDate.getUTCFullYear() === secondDate.getUTCFullYear() &&
    firstDate.getUTCMonth() === secondDate.getUTCMonth() &&
    firstDate.getUTCDate() === secondDate.getUTCDate()
  );
};

export interface MorningBriefItem {
  id: number;
  headline: string;
  summary: string;
  reflection?: string;
  sourceUrl?: string;
  publishedAt?: string;
}

export interface MorningBriefData {
  generatedAt: string;
  marketOverview?: string;
  portfolioHighlights: string[];
  items: MorningBriefItem[];
}

interface MorningBriefResponse {
  success?: boolean;
  brief?: {
    generatedAt?: string;
    generated_at?: string;
    marketOverview?: string;
    market_overview?: string;
    portfolioHighlights?: string[];
    portfolio_highlights?: string[];
    items?: Array<{
      id?: number;
      headline?: string;
      summary?: string;
      recommendedActions?: string[];
      recommended_actions?: string[];
      reflection?: string;
      reflections?: string[];
      sourceUrl?: string;
      source_url?: string;
      publishedAt?: string;
      published_at?: string;
    }>;
  };
}

const normalizeMorningBrief = (payload: MorningBriefResponse['brief']): MorningBriefData | null => {
  if (!payload) {
    return null;
  }

  const generatedAt = payload.generatedAt || payload.generated_at || new Date().toISOString();
  const marketOverview = payload.marketOverview || payload.market_overview;
  const portfolioHighlightsRaw = payload.portfolioHighlights || payload.portfolio_highlights || [];
  const portfolioHighlights = Array.isArray(portfolioHighlightsRaw)
    ? portfolioHighlightsRaw.map(item => item?.toString?.().trim()).filter(Boolean) as string[]
    : [];

  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
  const items: MorningBriefItem[] = itemsRaw.map((item, index) => {
    const reflections: string[] = [];

    if (typeof item.reflection === 'string') {
      reflections.push(item.reflection.trim());
    }

    if (Array.isArray(item.reflections)) {
      reflections.push(
        ...item.reflections
          .map(reflection => reflection?.toString?.().trim())
          .filter(Boolean) as string[],
      );
    }

    const recommendedRaw = item.recommendedActions || item.recommended_actions || [];
    if (Array.isArray(recommendedRaw)) {
      reflections.push(
        ...recommendedRaw
          .map(action => action?.toString?.().trim())
          .filter(Boolean) as string[],
      );
    }

    const reflection = reflections
      .map(entry => entry?.replace?.(/\s+/g, ' ')?.trim?.() ?? '')
      .filter(Boolean)[0];

    return {
      id: typeof item.id === 'number' ? item.id : index + 1,
      headline: item.headline?.toString?.().trim() || `Nyhet ${index + 1}`,
      summary: item.summary?.toString?.().trim() || '',
      reflection: reflection
        ? reflection
        : 'Fundera på hur detta kan påverka din portfölj på kort och lång sikt.',
      sourceUrl: item.sourceUrl?.toString?.().trim() || item.source_url?.toString?.().trim(),
      publishedAt: item.publishedAt?.toString?.().trim() || item.published_at?.toString?.().trim(),
    };
  });

  return {
    generatedAt,
    marketOverview: marketOverview?.toString?.().trim() || undefined,
    portfolioHighlights,
    items,
  };
};

export const useMorningBrief = () => {
  const { user } = useAuth();
  const [brief, setBrief] = useState<MorningBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const cacheBrief = useCallback((userId: string, data: MorningBriefData) => {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = getStorageKey(userId);
      window.localStorage.setItem(storageKey, JSON.stringify({ brief: data }));
    } catch (storageError) {
      console.warn('Kunde inte spara morgonbrevet i cache:', storageError);
    }
  }, []);

  const loadCachedBrief = useCallback((userId: string): MorningBriefData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const storageKey = getStorageKey(userId);
      const cachedRaw = window.localStorage.getItem(storageKey);
      if (!cachedRaw) return null;

      const cached = JSON.parse(cachedRaw) as { brief?: MorningBriefData } | null;
      if (cached?.brief) {
        return cached.brief;
      }
    } catch (storageError) {
      console.warn('Kunde inte läsa morgonbrevet från cache:', storageError);
    }

    return null;
  }, []);

  const fetchMorningBrief = useCallback(async (options?: { force?: boolean }) => {
    if (!user?.id) {
      setBrief(null);
      setLoading(false);
      return;
    }

    const todayIso = new Date().toISOString();
    if (!options?.force && lastGeneratedAt && isSameDay(lastGeneratedAt, todayIso)) {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke<MorningBriefResponse>('portfolio-ai-chat', {
        body: {
          analysisType: 'morning_brief',
          userId: user.id,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Misslyckades med att hämta morgonbrevet');
      }

      const normalized = normalizeMorningBrief(data?.brief);

      if (!normalized) {
        throw new Error('Kunde inte tolka morgonbrevet');
      }

      setBrief(normalized);
      setLastGeneratedAt(normalized.generatedAt);
      cacheBrief(user.id, normalized);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Misslyckades med att hämta morgonbrevet';
      console.error('Error fetching morning brief:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, lastGeneratedAt, cacheBrief]);

  useEffect(() => {
    if (!user?.id) {
      setBrief(null);
      setLastGeneratedAt(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cachedBrief = loadCachedBrief(user.id);
    const todayIso = new Date().toISOString();
    let hasFreshCache = false;

    if (cachedBrief) {
      setBrief(cachedBrief);
      setLastGeneratedAt(cachedBrief.generatedAt);
      hasFreshCache = isSameDay(cachedBrief.generatedAt, todayIso);
      setError(null);
    }

    if (!hasFreshCache) {
      fetchMorningBrief({ force: true }).catch((err) => {
        console.error('Failed to fetch morning brief on init:', err);
      });
    }
  }, [user?.id, fetchMorningBrief, loadCachedBrief]);

  const latestItem = useMemo(() => brief?.items?.[0], [brief?.items]);

  const isFreshToday = useMemo(() => isSameDay(lastGeneratedAt, new Date().toISOString()), [lastGeneratedAt]);

  return {
    brief,
    latestItem,
    loading,
    error,
    refresh: () => fetchMorningBrief(),
    isAvailable: Boolean(user?.id),
    isFreshToday,
  };
};

