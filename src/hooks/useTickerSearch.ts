import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TickerSearchResult } from '@/types/ticker';

interface TickerSearchResponse {
  results: TickerSearchResult[];
  error?: string;
}

export const useTickerSearch = () => {
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTickers = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke<TickerSearchResponse>('search-stock-symbols', {
        body: { query: trimmedQuery },
      });

      if (error) {
        console.error('Ticker search invoke error:', error);
        setError('Kunde inte söka efter tickers just nu. Försök igen.');
        setResults([]);
        return;
      }

      const payload = data ?? { results: [] };
      setResults(payload.results || []);

      if (payload.error) {
        console.warn('Ticker search returned warning:', payload.error);
      }
    } catch (err) {
      console.error('Ticker search error:', err);
      setError('Kunde inte söka efter tickers just nu. Försök igen.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchTickers,
    clearResults,
  };
};
