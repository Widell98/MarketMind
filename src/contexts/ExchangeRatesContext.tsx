import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { updateExchangeRates, initializeExchangeRates, getExchangeRates, type ExchangeRates } from '@/utils/currencyUtils';

type ExchangeRatesContextValue = {
  rates: ExchangeRates;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refetch: () => Promise<ExchangeRates>;
};

const ExchangeRatesContext = createContext<ExchangeRatesContextValue | undefined>(undefined);

export const ExchangeRatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<ExchangeRates>(() => initializeExchangeRates());
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await updateExchangeRates();
      setRates(fetched);
      setLastFetched(Date.now());
      return fetched;
    } catch (err) {
      console.error('Failed to fetch exchange rates', err);
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel vid hämtning av valutakurser';
      setError(errorMessage);
      
      // Fallback to current rates (which may be cached or static)
      const currentRates = getExchangeRates();
      setRates(currentRates);
      return currentRates;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch exchange rates on mount
    void refetch();
  }, [refetch]);

  const value = useMemo(() => ({
    rates,
    loading,
    error,
    lastFetched,
    refetch,
  }), [rates, loading, error, lastFetched, refetch]);

  return (
    <ExchangeRatesContext.Provider value={value}>
      {children}
    </ExchangeRatesContext.Provider>
  );
};

export const useExchangeRates = () => {
  const context = useContext(ExchangeRatesContext);
  if (!context) {
    throw new Error('useExchangeRates must be used within an ExchangeRatesProvider');
  }
  return context;
};

export default ExchangeRatesContext;

