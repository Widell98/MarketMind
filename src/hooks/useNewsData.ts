
import { useCallback, useEffect, useState } from 'react';
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

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove query parameters and fragments, keep only protocol, hostname, and pathname
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
};

const areHeadlinesSimilar = (headline1: string, headline2: string): boolean => {
  // Normalize headlines: lowercase, remove extra spaces, remove common punctuation
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  const norm1 = normalize(headline1);
  const norm2 = normalize(headline2);
  
  // Check if headlines are identical after normalization
  if (norm1 === norm2) return true;
  
  // Check if one headline contains the other (for cases like "Stock Market Rises" vs "Stock Market Rises Today")
  if (norm1.length > 10 && norm2.length > 10) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length < norm2.length ? norm2 : norm1;
    // If shorter headline is at least 80% of longer and is contained in longer, consider similar
    if (longer.includes(shorter) && shorter.length / longer.length >= 0.8) {
      return true;
    }
  }
  
  return false;
};

const deduplicateNewsItems = (items: NewsItem[]): NewsItem[] => {
  const seen = new Map<string, NewsItem>();
  
  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url);
    let isDuplicate = false;
    
    // Check if we've seen this normalized URL before
    if (seen.has(normalizedUrl)) {
      isDuplicate = true;
    } else {
      // Check if any existing item has a similar headline
      for (const [url, existingItem] of seen.entries()) {
        if (areHeadlinesSimilar(item.headline, existingItem.headline)) {
          isDuplicate = true;
          break;
        }
      }
    }
    
    // Only add if not a duplicate
    if (!isDuplicate) {
      seen.set(normalizedUrl, item);
    }
  }
  
  return Array.from(seen.values());
};

const parseNewsResponse = (payload: unknown): { news: NewsItem[]; summary: AiMorningBrief | null } => {
  if (Array.isArray(payload)) {
    const news = payload
      .map(normalizeNewsItem)
      .filter((item): item is NewsItem => item !== null);
    const deduplicatedNews = deduplicateNewsItems(news);
    return { news: deduplicatedNews, summary: null };
  }

  if (payload && typeof payload === 'object') {
    const raw = payload as Record<string, unknown>;
    
    // Normalize news array
    let news: NewsItem[] = [];
    if (Array.isArray(raw.news)) {
      news = raw.news
        .map(normalizeNewsItem)
        .filter((item): item is NewsItem => item !== null);
    }
    
    // Deduplicate news items before returning
    const deduplicatedNews = deduplicateNewsItems(news);
    
    const morningBriefData = raw.morningBrief ?? raw.morning_brief ?? raw.summary ?? raw.brief ?? raw.newsletter;
    
    const summary = parseMorningBrief(morningBriefData);
    
    return { news: deduplicatedNews, summary };
  }

  return { news: [], summary: null };
};

export const useNewsData = (forceRefresh = false) => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [morningBrief, setMorningBrief] = useState<AiMorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('fetch-news-data', {
        body: force || forceRefresh ? { forceRefresh: true } : {},
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const parsed = parseNewsResponse(data);
      setNewsData(parsed.news);
      setMorningBrief(parsed.summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news data';
      setError(errorMessage);
      console.error('Error fetching news data:', err);
    } finally {
      setLoading(false);
    }
  }, [forceRefresh]);

  useEffect(() => {
    fetchNewsData(forceRefresh);

    // Refresh data every 10 minutes
    const interval = setInterval(() => fetchNewsData(false), 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNewsData, forceRefresh]);

  useEffect(() => {
    const handleNewsRefreshed = () => {
      fetchNewsData(false);
    };

    window.addEventListener('news-refreshed', handleNewsRefreshed);
    return () => window.removeEventListener('news-refreshed', handleNewsRefreshed);
  }, [fetchNewsData]);

  return { 
    newsData, 
    morningBrief, 
    loading, 
    error, 
    refetch: () => fetchNewsData(false),
    refetchForce: () => fetchNewsData(true),
  };
};
