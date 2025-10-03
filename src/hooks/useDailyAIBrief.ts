import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from './usePortfolio';
import { DailyBriefPayload, mapDailyBriefRow } from './utils/aiInsights';

export interface DailyAIBrief extends DailyBriefPayload {
  createdAt: Date | null;
  rawCreatedAt: string | null;
}

export const useDailyAIBrief = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();

  const [brief, setBrief] = useState<DailyAIBrief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(async () => {
    if (!user?.id || !activePortfolio?.id) {
      setBrief(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('daily_ai_briefs')
        .select('*')
        .eq('user_id', user.id)
        .eq('portfolio_id', activePortfolio.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Failed to load daily AI brief:', fetchError);
        setError('Kunde inte hämta dagens AI-brief just nu.');
        setBrief(null);
        return;
      }

      const parsed = mapDailyBriefRow(data);

      if (!parsed) {
        setBrief(null);
        return;
      }

      let createdAt: Date | null = null;
      try {
        createdAt = parsed.createdAt ? new Date(parsed.createdAt) : null;
        if (createdAt && Number.isNaN(createdAt.getTime())) {
          createdAt = null;
        }
      } catch {
        createdAt = null;
      }

      setBrief({
        headline: parsed.headline,
        summary: parsed.summary,
        bullets: parsed.bullets,
        ctaLabel: parsed.ctaLabel,
        ctaUrl: parsed.ctaUrl,
        sources: parsed.sources,
        createdAt,
        rawCreatedAt: parsed.createdAt,
      });
    } catch (err) {
      console.error('Unexpected error loading daily AI brief:', err);
      setError('Ett oväntat fel uppstod vid hämtning av AI-briefen.');
      setBrief(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activePortfolio?.id]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  return {
    brief,
    isLoading,
    error,
    refresh: fetchBrief,
  };
};
