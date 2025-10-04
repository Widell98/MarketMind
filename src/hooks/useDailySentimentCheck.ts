import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailySentimentInsight {
  symbol: string;
  name: string;
  change: string;
  summary: string;
  ai_insight: string;
  follow_up: string[];
}

export interface DailySentimentResponse {
  generated_at: string;
  results: DailySentimentInsight[];
}

const normalizeInsight = (raw: unknown): DailySentimentInsight | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const symbol = typeof candidate.symbol === 'string' && candidate.symbol.trim() ? candidate.symbol.trim() : null;
  if (!symbol) {
    return null;
  }

  const name = typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : symbol;
  const change = typeof candidate.change === 'string' && candidate.change.trim() ? candidate.change.trim() : '';
  const summary = typeof candidate.summary === 'string' ? candidate.summary.trim() : '';
  const aiInsight = typeof candidate.ai_insight === 'string' ? candidate.ai_insight.trim() : '';
  const followUp = Array.isArray(candidate.follow_up)
    ? candidate.follow_up.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  return {
    symbol,
    name,
    change,
    summary,
    ai_insight: aiInsight,
    follow_up: followUp,
  };
};

const fetchDailySentiment = async (): Promise<DailySentimentResponse> => {
  const { data, error } = await supabase.functions.invoke('daily-sentiment-check', {
    body: { source: 'dashboard' },
  });

  if (error) {
    const message = typeof error === 'string'
      ? error
      : error?.message || 'Kunde inte hämta sentimentdata just nu.';
    throw new Error(message);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Ogiltigt svar från sentimentfunktionen.');
  }

  const raw = data as { generated_at?: unknown; results?: unknown };
  const generatedAt = typeof raw.generated_at === 'string' ? raw.generated_at : new Date().toISOString();
  const results = Array.isArray(raw.results)
    ? raw.results
        .map(normalizeInsight)
        .filter((insight): insight is DailySentimentInsight => insight !== null)
    : [];

  return {
    generated_at: generatedAt,
    results,
  };
};

export const useDailySentimentCheck = (enabled: boolean) =>
  useQuery<DailySentimentResponse>({
    queryKey: ['daily-sentiment-check'],
    queryFn: fetchDailySentiment,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
