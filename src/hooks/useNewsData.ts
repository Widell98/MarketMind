
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

type MorningSection = {
  title: string;
  body: string;
};

export type AiMorningBrief = {
  id: string;
  headline: string;
  overview: string;
  keyHighlights: string[];
  focusToday: string[];
  sentiment: NewsSentiment;
  generatedAt: string;
  sections: MorningSection[];
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

const parseMorningBrief = (payload: unknown): AiMorningBrief | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const headline = typeof raw.headline === 'string' ? raw.headline.trim() : null;
  const overview = typeof raw.overview === 'string' ? raw.overview.trim() : null;

  if (!headline && !overview) {
    return null;
  }

  const sections = Array.isArray(raw?.sections)
    ? (raw.sections as unknown[])
        .map((entry) => {
          const record = entry as Record<string, unknown>;
          const sectionTitle = typeof record.title === 'string' ? record.title.trim() : '';
          const sectionBody = typeof record.body === 'string' ? record.body.trim() : '';
          if (!sectionTitle && !sectionBody) {
            return null;
          }
          return { title: sectionTitle, body: sectionBody };
        })
        .filter((entry): entry is MorningSection => !!entry)
    : [];

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
        : typeof raw.generated_at === 'string' && raw.generated_at.length > 0
          ? raw.generated_at
          : new Date().toISOString(),
    sections,
  };
};

const normalizeNewsItem = (item: unknown): NewsItem | null => {
  if (!item || typeof item !== 'object') return null;
  
  const raw = item as Record<string, unknown>;
  
  // Validate required fields
  const headline = typeof raw.headline === 'string' ? raw.headline.trim() : '';
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  
  if (!headline && !summary) {
    console.warn('[normalizeNewsItem] Skipping item without headline or summary:', raw);
    return null;
  }
  
  // Normalize category - handle various formats
  let category = 'global';
  if (typeof raw.category === 'string' && raw.category.trim()) {
    category = raw.category.trim().toLowerCase();
  }
  
  // Normalize publishedAt
  let publishedAt = new Date().toISOString();
  if (typeof raw.publishedAt === 'string' && raw.publishedAt.trim()) {
    const date = new Date(raw.publishedAt);
    if (!Number.isNaN(date.getTime())) {
      publishedAt = date.toISOString();
    }
  } else if (typeof raw.published_at === 'string' && raw.published_at.trim()) {
    const date = new Date(raw.published_at);
    if (!Number.isNaN(date.getTime())) {
      publishedAt = date.toISOString();
    }
  }
  
  // Generate ID if missing
  const id = typeof raw.id === 'string' && raw.id.trim() 
    ? raw.id.trim() 
    : `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    headline: headline || 'Okänd rubrik',
    summary: summary || 'Ingen sammanfattning tillgänglig',
    category,
    source: source || 'Okänd källa',
    publishedAt,
    url: url || '#',
  };
};

const parseNewsResponse = (payload: unknown): { news: NewsItem[]; summary: AiMorningBrief | null } => {
  console.log('[parseNewsResponse] Input payload type:', typeof payload, Array.isArray(payload));
  
  if (Array.isArray(payload)) {
    console.log('[parseNewsResponse] Payload is array, length:', payload.length);
    const news = payload
      .map(normalizeNewsItem)
      .filter((item): item is NewsItem => item !== null);
    console.log('[parseNewsResponse] Normalized news from array:', news.length);
    return { news, summary: null };
  }

  if (payload && typeof payload === 'object') {
    const raw = payload as Record<string, unknown>;
    console.log('[parseNewsResponse] Payload keys:', Object.keys(raw));
    console.log('[parseNewsResponse] morningBrief exists:', 'morningBrief' in raw);
    console.log('[parseNewsResponse] morning_brief exists:', 'morning_brief' in raw);
    console.log('[parseNewsResponse] news exists:', 'news' in raw);
    console.log('[parseNewsResponse] news type:', Array.isArray(raw.news) ? `array[${(raw.news as unknown[]).length}]` : typeof raw.news);
    
    // Normalize news array
    let news: NewsItem[] = [];
    if (Array.isArray(raw.news)) {
      console.log('[parseNewsResponse] Processing news array, length:', raw.news.length);
      news = raw.news
        .map(normalizeNewsItem)
        .filter((item): item is NewsItem => item !== null);
      console.log('[parseNewsResponse] Normalized news items:', news.length);
      if (news.length > 0) {
        console.log('[parseNewsResponse] Sample news item:', {
          headline: news[0].headline,
          category: news[0].category,
          source: news[0].source,
        });
      }
    } else {
      console.warn('[parseNewsResponse] news is not an array:', typeof raw.news, raw.news);
    }
    
    const morningBriefData = raw.morningBrief ?? raw.morning_brief ?? raw.summary ?? raw.brief ?? raw.newsletter;
    console.log('[parseNewsResponse] morningBriefData:', morningBriefData ? {
      hasHeadline: typeof (morningBriefData as any)?.headline === 'string',
      hasOverview: typeof (morningBriefData as any)?.overview === 'string',
      headline: (morningBriefData as any)?.headline,
    } : null);
    
    const summary = parseMorningBrief(morningBriefData);
    console.log('[parseNewsResponse] Parsed summary:', summary ? {
      headline: summary.headline,
      hasOverview: !!summary.overview,
      sentiment: summary.sentiment,
    } : null);
    
    console.log('[parseNewsResponse] Final result:', { newsCount: news.length, hasSummary: !!summary });
    return { news, summary };
  }

  console.log('[parseNewsResponse] Payload is not object or array, returning empty');
  return { news: [], summary: null };
};

export const useNewsData = (forceRefresh = false) => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [morningBrief, setMorningBrief] = useState<AiMorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsData = async (options: { force?: boolean; allowRepeats?: boolean } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const requestBody: Record<string, boolean> = {};
      const shouldForceRefresh = options.force || forceRefresh;

      if (shouldForceRefresh) {
        requestBody.forceRefresh = true;
      }

      if (options.allowRepeats) {
        requestBody.allowRepeats = true;
      }

      const { data, error: functionError } = await supabase.functions.invoke('fetch-news-data', {
        body: requestBody,
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      console.log('[useNewsData] Raw response from backend:', JSON.stringify(data, null, 2));
      const parsed = parseNewsResponse(data);
      console.log('[useNewsData] Parsed response:', { 
        newsCount: parsed.news.length, 
        morningBrief: parsed.summary ? {
          headline: parsed.summary.headline,
          overview: parsed.summary.overview?.substring(0, 100) + '...',
          sentiment: parsed.summary.sentiment,
        } : null
      });
      setNewsData(parsed.news);
      setMorningBrief(parsed.summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news data';
      setError(errorMessage);
      console.error('Error fetching news data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData({ force: forceRefresh });

    // Refresh data every 10 minutes
    const interval = setInterval(() => fetchNewsData(), 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [forceRefresh]);

  return {
    newsData,
    morningBrief,
    loading,
    error,
    refetch: () => fetchNewsData({ force: true, allowRepeats: true }),
    refetchForce: () => fetchNewsData({ force: true, allowRepeats: true }),
  };
};
