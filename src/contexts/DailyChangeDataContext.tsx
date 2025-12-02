import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSheetChangeData } from '@/utils/sheetChangeData';

type DailyChangeDataContextValue = {
  data: Map<string, number> | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refetch: (options?: { force?: boolean }) => Promise<Map<string, number> | null>;
  getChangeForTicker: (ticker?: string | null) => number | null;
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const DailyChangeDataContext = createContext<DailyChangeDataContextValue | undefined>(undefined);

const normalizeTickerVariants = (ticker: string | null | undefined): string[] => {
  if (!ticker) return [];

  const trimmed = ticker.trim().toUpperCase();
  if (!trimmed) return [];

  const variants: string[] = [trimmed];
  const parts = trimmed.split(':');

  if (parts.length > 1) {
    const symbol = parts[parts.length - 1]?.trim();
    if (symbol) {
      variants.push(symbol);
      if (!trimmed.startsWith('STO:')) {
        variants.push(`STO:${symbol}`);
      }
    }
  } else {
    variants.push(`STO:${trimmed}`);
  }

  return variants;
};

export const DailyChangeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Map<string, number> | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();

    if (!options?.force && data && lastFetched && now - lastFetched < CACHE_DURATION_MS) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchSheetChangeData();
      setData(fetched);
      setLastFetched(Date.now());
      return fetched;
    } catch (err) {
      console.error('Failed to fetch daily change data', err);
      setError(err instanceof Error ? err.message : 'Okänt fel vid hämtning av kursdata');
      return data;
    } finally {
      setLoading(false);
    }
  }, [data, lastFetched]);

  useEffect(() => {
    if (!data || !lastFetched || Date.now() - lastFetched > CACHE_DURATION_MS) {
      void refetch();
    }
  }, [data, lastFetched, refetch]);

  const getChangeForTicker = useCallback((ticker?: string | null) => {
    if (!ticker || !data) return null;

    const variants = normalizeTickerVariants(ticker);
    for (const variant of variants) {
      if (data.has(variant)) {
        return data.get(variant) ?? null;
      }
    }

    return null;
  }, [data]);

  const value = useMemo(() => ({
    data,
    loading,
    error,
    lastFetched,
    refetch,
    getChangeForTicker,
  }), [data, loading, error, lastFetched, refetch, getChangeForTicker]);

  return (
    <DailyChangeDataContext.Provider value={value}>
      {children}
    </DailyChangeDataContext.Provider>
  );
};

export const useDailyChangeData = () => {
  const context = useContext(DailyChangeDataContext);
  if (!context) {
    throw new Error('useDailyChangeData must be used within a DailyChangeDataProvider');
  }
  return context;
};

export default DailyChangeDataContext;
