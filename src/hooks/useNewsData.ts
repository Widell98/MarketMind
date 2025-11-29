
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

export type NewsDigestSummary = {
  id: string;
  headline: string;
  overview: string;
  keyHighlights: string[];
  focusToday: string[];
  sentiment: NewsSentiment;
  generatedAt: string;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(/\n|•|-/)
      .map((entry) => entry.replace(/^\s*[-•]\s*/, '').trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const coerceSentiment = (value: unknown): NewsSentiment => {
  if (value === 'bullish' || value === 'bearish' || value === 'neutral') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'bullish' || normalized === 'bearish' || normalized === 'neutral') {
      return normalized;
    }
  }
  return 'neutral';
};

const parseNewsSummary = (payload: unknown): NewsDigestSummary | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const headline = typeof raw.headline === 'string' ? raw.headline.trim() : null;
  const overview = typeof raw.overview === 'string' ? raw.overview.trim() : null;

  if (!headline && !overview) {
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id : 'news_digest',
    headline: headline ?? 'Marknadssvepet',
    overview: overview ?? '',
    keyHighlights: normalizeStringArray(raw.keyHighlights ?? raw.key_highlights),
    focusToday: normalizeStringArray(raw.focusToday ?? raw.focus_today),
    sentiment: coerceSentiment(raw.sentiment),
    generatedAt:
      typeof raw.generatedAt === 'string' && raw.generatedAt.length > 0
        ? raw.generatedAt
        : new Date().toISOString(),
  };
};

const parseNewsResponse = (payload: unknown): { news: NewsItem[]; summary: NewsDigestSummary | null } => {
  if (Array.isArray(payload)) {
    return { news: payload as NewsItem[], summary: null };
  }

  if (payload && typeof payload === 'object') {
    const raw = payload as Record<string, unknown>;
    const news = Array.isArray(raw.news) ? (raw.news as NewsItem[]) : [];
    const summary = parseNewsSummary(raw.summary);
    return { news, summary };
  }

  return { news: [], summary: null };
};

export const useNewsData = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [newsSummary, setNewsSummary] = useState<NewsDigestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('fetch-news-data');

      if (functionError) {
        throw new Error(functionError.message);
      }

      const parsed = parseNewsResponse(data);
      setNewsData(parsed.news);
      setNewsSummary(parsed.summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news data';
      setError(errorMessage);
      console.error('Error fetching news data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();

    // Refresh data every 10 minutes
    const interval = setInterval(fetchNewsData, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { newsData, newsSummary, loading, error, refetch: fetchNewsData };
};
