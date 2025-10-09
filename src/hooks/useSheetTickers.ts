import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SheetTicker = {
  name: string;
  symbol: string;
  price: number | null;
  currency: string | null;
};

type RawSheetTicker = {
  symbol?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

const sanitizeRawTicker = (item: RawSheetTicker | null | undefined): SheetTicker | null => {
  if (!item || typeof item.symbol !== 'string') {
    return null;
  }

  const trimmedSymbol = item.symbol.trim();
  if (!trimmedSymbol) {
    return null;
  }

  const normalizedSymbol = trimmedSymbol.toUpperCase();
  const resolvedName = typeof item.name === 'string' && item.name.trim().length > 0
    ? item.name.trim()
    : normalizedSymbol;
  const resolvedPrice = typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0
    ? item.price
    : null;
  const resolvedCurrency = typeof item.currency === 'string' && item.currency.trim().length > 0
    ? item.currency.trim().toUpperCase()
    : null;

  return {
    symbol: normalizedSymbol,
    name: resolvedName,
    price: resolvedPrice,
    currency: resolvedCurrency,
  };
};

const sanitizeTickerList = (list: unknown): SheetTicker[] => {
  if (!Array.isArray(list)) {
    return [];
  }

  return (list as RawSheetTicker[])
    .map((item) => sanitizeRawTicker(item))
    .filter((item): item is SheetTicker => item !== null);
};

const useSheetTickers = () => {
  const [tickers, setTickers] = useState<SheetTicker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ensurePromises = useMemo(() => new Map<string, Promise<SheetTicker | null>>(), []);

  const mergeTickers = useCallback((incoming: SheetTicker[]) => {
    if (incoming.length === 0) {
      return;
    }

    setTickers(prev => {
      const next = [...prev];
      const indexLookup = new Map(next.map((ticker, index) => [ticker.symbol, index] as const));
      let hasChanges = false;

      incoming.forEach(ticker => {
        const existingIndex = indexLookup.get(ticker.symbol);
        if (typeof existingIndex === 'number') {
          const existing = next[existingIndex];
          const hasDifference =
            existing.name !== ticker.name ||
            existing.price !== ticker.price ||
            existing.currency !== ticker.currency;

          if (hasDifference) {
            next[existingIndex] = ticker;
            hasChanges = true;
          }
        } else {
          indexLookup.set(ticker.symbol, next.length);
          next.push(ticker);
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setDiagnosticsError = (baseMessage: string) => {
      const guidance = [
        'Kontrollera att edge-funktionen "list-sheet-tickers" körs lokalt via `supabase functions serve list-sheet-tickers` eller är deployad.',
        'Verifiera att miljövariablerna GOOGLE_SERVICE_ACCOUNT och GOOGLE_SHEET_ID är satta i Supabase-projektet.',
        'Bekräfta att Supabase-klienten använder rätt projekt-URL och anon key.',
      ].join(' ');

      setError(`${baseMessage} ${guidance}`);
    };

    const fetchTickers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('list-sheet-tickers');

        if (!isMounted) {
          return;
        }

        if (invokeError) {
          console.error('Failed to reach list-sheet-tickers edge function:', invokeError);
          setDiagnosticsError(invokeError.message ?? 'Kunde inte hämta tickers.');
          setTickers([]);
          return;
        }

        const sanitizedTickers = sanitizeTickerList(data?.tickers);

        if (sanitizedTickers.length === 0) {
          console.warn('list-sheet-tickers edge function returned an empty list.');
        }

        setTickers(sanitizedTickers);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Unexpected error when fetching Google Sheets tickers:', err);
        const baseMessage = err instanceof Error ? err.message : 'Kunde inte hämta tickers.';
        setDiagnosticsError(baseMessage);
        setTickers([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTickers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getTickerFromState = useCallback(
    (symbol: string | null | undefined): SheetTicker | null => {
      if (!symbol) {
        return null;
      }

      const normalized = symbol.trim().toUpperCase();
      if (!normalized) {
        return null;
      }

      return tickers.find(ticker => ticker.symbol === normalized) ?? null;
    },
    [tickers]
  );

  const ensureTicker = useCallback(
    async (symbol: string | null | undefined): Promise<SheetTicker | null> => {
      if (!symbol) {
        return null;
      }

      const normalized = symbol.trim().toUpperCase();
      if (!normalized) {
        return null;
      }

      const existing = getTickerFromState(normalized);
      if (existing) {
        return existing;
      }

      const ongoing = ensurePromises.get(normalized);
      if (ongoing) {
        return ongoing;
      }

      const promise = (async () => {
        try {
          const { data, error: invokeError } = await supabase.functions.invoke('list-sheet-tickers', {
            body: { ticker: normalized },
          });

          if (invokeError) {
            console.error('Failed to ensure ticker via list-sheet-tickers:', invokeError);
            return null;
          }

          const rawData = (data ?? null) as { tickers?: unknown; fallbackTicker?: RawSheetTicker | null } | null;
          const incoming = sanitizeTickerList(rawData?.tickers);
          const fallbackTicker = sanitizeRawTicker(rawData?.fallbackTicker ?? null);

          if (incoming.length > 0) {
            mergeTickers(incoming);
          }

          if (fallbackTicker) {
            mergeTickers([fallbackTicker]);
          }

          const combinedCandidates = fallbackTicker ? [...incoming, fallbackTicker] : incoming;
          const directMatch = combinedCandidates.find((ticker) => ticker.symbol === normalized);
          if (directMatch) {
            return directMatch;
          }

          return getTickerFromState(normalized);
        } catch (err) {
          console.error('Unexpected error ensuring ticker from list-sheet-tickers:', err);
          return null;
        } finally {
          ensurePromises.delete(normalized);
        }
      })();

      ensurePromises.set(normalized, promise);
      return promise;
    },
    [ensurePromises, getTickerFromState, mergeTickers]
  );

  return { tickers, isLoading, error, ensureTicker };
};

export default useSheetTickers;
