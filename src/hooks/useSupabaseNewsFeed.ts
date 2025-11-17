import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SupabaseNewsFeedType = 'news' | 'momentum' | 'calendar';

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface MomentumItem {
  id: string;
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  timeframe: string;
  sentiment?: string;
}

export interface FinancialEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category: 'earnings' | 'economic' | 'dividend' | 'other';
  company?: string;
  date?: string;
  dayOfWeek?: string;
}

interface UseSupabaseNewsFeedOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

type FeedDataMap = {
  news: NewsItem[];
  momentum: MomentumItem[];
  calendar: FinancialEvent[];
};

export const useSupabaseNewsFeed = <T extends SupabaseNewsFeedType>(type: T, options?: UseSupabaseNewsFeedOptions) => {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<FeedDataMap[T]>([] as FeedDataMap[T]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshInterval = options?.refreshInterval;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('fetch-news-data', {
        body: { type }
      });

      if (error) {
        throw new Error(error.message);
      }

      setData((Array.isArray(data) ? data : []) as FeedDataMap[T]);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news feed';
      setError(errorMessage);
      console.error('Error fetching Supabase news feed:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, type]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchData();

    if (!refreshInterval) {
      return;
    }

    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
};
