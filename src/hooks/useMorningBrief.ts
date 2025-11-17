import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MorningBriefSentiment = 'bullish' | 'bearish' | 'neutral';

export interface MorningBriefHighlight {
  title: string;
  summary: string;
  source?: string;
  publishedAt?: string;
  url?: string;
}

export interface MorningBriefData {
  id: string;
  generatedAt: string;
  sentiment: MorningBriefSentiment;
  summary: string;
  highlights: MorningBriefHighlight[];
  focusAreas: string[];
  eventsToWatch: string[];
}

interface UseMorningBriefOptions {
  enabled?: boolean;
}

interface RefetchOptions {
  forceRefresh?: boolean;
}

export const useMorningBrief = (options?: UseMorningBriefOptions) => {
  const enabled = options?.enabled ?? true;
  const [brief, setBrief] = useState<MorningBriefData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);

  const fetchBrief = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke('ai-morning-brief', {
          body: { forceRefresh },
        });

        if (error) {
          throw new Error(error.message);
        }

        const normalizedBrief: MorningBriefData | null = data?.brief
          ? {
              id: data.brief.id,
              generatedAt: data.brief.generatedAt,
              sentiment: (['bullish', 'bearish', 'neutral'].includes(data.brief.sentiment)
                ? data.brief.sentiment
                : 'neutral') as MorningBriefSentiment,
              summary: data.brief.summary ?? '',
              highlights: Array.isArray(data.brief.highlights) ? data.brief.highlights : [],
              focusAreas: Array.isArray(data.brief.focusAreas) ? data.brief.focusAreas : [],
              eventsToWatch: Array.isArray(data.brief.eventsToWatch) ? data.brief.eventsToWatch : [],
            }
          : null;

        setBrief(normalizedBrief);
        setFromCache(Boolean(data?.fromCache));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kunde inte hämta morgonrapporten';
        setError(message);
        console.error('useMorningBrief error:', err);
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchBrief();
  }, [enabled, fetchBrief]);

  const refetch = useCallback(
    (options?: RefetchOptions) => {
      return fetchBrief(Boolean(options?.forceRefresh));
    },
    [fetchBrief],
  );

  return { brief, loading, error, refetch, fromCache };
};
