import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SheetTicker = {
  name: string;
  symbol: string;
  sheetSymbol?: string | null;
  price: number | null;
  currency: string | null;
};

type RawSheetTicker = {
  symbol?: string | null;
  sheetSymbol?: string | null;
  simpleSymbol?: string | null;
  simpleTicker?: string | null;
  simple_ticker?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

const coerceString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

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

        if (list.length === 0) {
          console.warn('list-sheet-tickers edge function returned an empty list.');
        }

        const sanitizedTickers: SheetTicker[] = list
          .map((item): SheetTicker | null => {
            if (!item) {
              return null;
            }

            const candidateSymbols: Array<string | null> = [
              coerceString(item.simpleSymbol),
              coerceString(item.simpleTicker),
              coerceString(item.simple_ticker),
              coerceString(item.symbol),
              coerceString(item.sheetSymbol),
            ];

            const rawSimpleSymbol = candidateSymbols.find((candidate) => candidate && candidate.length > 0);
            if (!rawSimpleSymbol) {
              return null;
            }

            const normalizedSymbol = rawSimpleSymbol.toUpperCase();
            const resolvedSheetSymbol = coerceString(item.sheetSymbol) ?? coerceString(item.symbol) ?? normalizedSymbol;
            const resolvedName = coerceString(item.name) ?? normalizedSymbol;
            const resolvedPrice = typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0
              ? item.price
              : null;
            const resolvedCurrency = coerceString(item.currency)?.toUpperCase() ?? null;

            return {
              symbol: normalizedSymbol,
              sheetSymbol: resolvedSheetSymbol?.toUpperCase() ?? normalizedSymbol,
              name: resolvedName,
              price: resolvedPrice,
              currency: resolvedCurrency,
            };
          })
          .filter((item): item is SheetTicker => item !== null);

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

  return { tickers, isLoading, error };
};

export default useSheetTickers;
