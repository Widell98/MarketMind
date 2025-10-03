import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MorningBriefItem {
  id: number;
  headline: string;
  summary: string;
  recommendedActions: string[];
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
    const recommendedRaw = item.recommendedActions || item.recommended_actions || [];
    const recommended = Array.isArray(recommendedRaw)
      ? recommendedRaw
          .map(action => action?.toString?.().trim())
          .filter(Boolean)
          .map(action => action?.replace?.(/\s+/g, ' ')?.trim?.() ?? '')
          .filter(Boolean)
          .slice(0, 1) as string[]
      : [];

    return {
      id: typeof item.id === 'number' ? item.id : index + 1,
      headline: item.headline?.toString?.().trim() || `Nyhet ${index + 1}`,
      summary: item.summary?.toString?.().trim() || '',
      recommendedActions: recommended,
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

  const fetchMorningBrief = useCallback(async () => {
    if (!user?.id) {
      setBrief(null);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Misslyckades med att hämta morgonbrevet';
      console.error('Error fetching morning brief:', err);
      setError(errorMessage);
      setBrief(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMorningBrief();
  }, [fetchMorningBrief]);

  const latestItem = useMemo(() => brief?.items?.[0], [brief?.items]);

  return {
    brief,
    latestItem,
    loading,
    error,
    refresh: fetchMorningBrief,
    isAvailable: Boolean(user?.id),
  };
};

