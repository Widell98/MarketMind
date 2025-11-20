import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MorningBriefHighlight = {
  id?: string;
  headline?: string;
  title?: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
};

export type MorningBriefPayload = {
  generatedAt?: string;
  headline?: string;
  intro?: string;
  highlights?: MorningBriefHighlight[];
  focusAreas?: string[];
  events?: string;
};

export const useMorningBrief = () => {
  const [brief, setBrief] = useState<MorningBriefPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke('ai-morning-brief');

        if (functionError) {
          throw new Error(functionError.message);
        }

        const payload = (data as MorningBriefPayload | null) ?? null;
        setBrief(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kunde inte hämta morgonrapporten';
        setError(message);
        console.error('Error fetching morning brief:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  return { brief, loading, error, refetch: fetchBrief };
};
