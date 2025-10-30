import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SheetTickerSource = 'sheet' | 'yahoo' | string;

export type SheetTicker = {
  name: string;
  symbol: string;
  price: number | null;
  currency: string | null;
  source?: SheetTickerSource | null;
};

export type RawSheetTicker = {
  symbol?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
  source?: SheetTickerSource | null;
};

export const sanitizeSheetTickerList = (
  list: RawSheetTicker[],
  defaultSource?: SheetTickerSource | null
): SheetTicker[] =>
  list
    .map((item): SheetTicker | null => {
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
      const resolvedSource = item.source ?? defaultSource ?? null;

      return {
        symbol: normalizedSymbol,
        name: resolvedName,
        price: resolvedPrice,
        currency: resolvedCurrency,
        source: resolvedSource,
      };
    })
    .filter((item): item is SheetTicker => item !== null);

const useSheetTickers = () => {
  const [tickers, setTickers] = useState<SheetTicker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const list = Array.isArray(data?.tickers)
          ? (data.tickers as RawSheetTicker[])
          : [];
        const source = typeof data?.source === 'string' ? data.source : 'sheet';

        if (list.length === 0) {
          console.warn('list-sheet-tickers edge function returned an empty list.');
        }

        setTickers(sanitizeSheetTickerList(list, source));
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

  return { tickers, isLoading, error };
};

export default useSheetTickers;
