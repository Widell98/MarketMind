import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveHoldingValue, convertToSEK } from '@/utils/currencyUtils';
import type { SheetTicker } from '@/hooks/useSheetTickers';

type FinnhubPriceResponse = {
  symbol: string;
  price: number;
  currency: string | null;
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeValue = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const stripSymbolPrefix = (symbol?: string | null) => {
  const normalized = normalizeValue(symbol);
  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();
  const parts = upper.split(':');
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate : upper;
};

const getSymbolVariants = (symbol?: string | null) => {
  const variants = new Set<string>();

  const addVariant = (value?: string | null) => {
    const normalized = normalizeValue(value);
    if (!normalized) {
      return;
    }

    const upper = normalized.toUpperCase();
    variants.add(upper);

    const stripped = stripSymbolPrefix(upper);
    if (stripped && stripped !== upper) {
      variants.add(stripped);
    }
  };

  addVariant(symbol);

  const currentVariants = Array.from(variants);
  currentVariants.forEach((variant) => {
    if (variant.endsWith('.ST')) {
      const base = variant.replace(/\.ST$/, '');
      if (base) {
        variants.add(base);
      }
    } else {
      variants.add(`${variant}.ST`);
    }
  });

  return Array.from(variants);
};

const findTickerMatch = (tickers: SheetTicker[], ticker: string): SheetTicker | null => {
  const targetVariants = new Set(getSymbolVariants(ticker));

  for (const candidate of tickers) {
    const candidateVariants = getSymbolVariants(candidate.symbol);
    if (candidateVariants.some((variant) => targetVariants.has(variant))) {
      return candidate;
    }
  }

  return null;
};

const buildTickerVariantLookup = (tickers: SheetTicker[]) => {
  const lookup = new Map<string, SheetTicker>();

  tickers.forEach((ticker) => {
    const variants = getSymbolVariants(ticker.symbol);
    variants.forEach((variant) => {
      lookup.set(variant.toUpperCase(), ticker);
    });

    const canonical = stripSymbolPrefix(ticker.symbol);
    if (canonical) {
      lookup.set(canonical.toUpperCase(), ticker);
    }

    if (ticker.symbol) {
      lookup.set(ticker.symbol.toUpperCase(), ticker);
    }
  });

  return lookup;
};

const normalizeNameKey = (name?: string | null) => {
  if (typeof name !== 'string') {
    return null;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

export interface PerformanceData {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  totalCash: number;
  totalPortfolioValue: number;
  cashPercentage: number;
  investedPercentage: number;
  lastUpdated: string;
}

export interface HoldingPerformance {
  id: string;
  name: string;
  symbol?: string;
  currentValue: number;
  investedValue: number;
  profit: number;
  profitPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  hasPurchasePrice: boolean;
}

interface PriceUpdateSummary {
  updated: number;
  errors: number;
  unmatched: Array<{ symbol?: string; name?: string }>;
  tickerFound?: boolean;
  requestedTicker?: string;
}

interface HoldingRow {
  id: string;
  quantity: number | string | null;
  symbol?: string | null;
  name?: string | null;
  price_currency?: string | null;
  currency?: string | null;
}

export const usePortfolioPerformance = () => {
  const [performance, setPerformance] = useState<PerformanceData>({
    totalValue: 0,
    totalInvested: 0,
    totalReturn: 0,
    totalReturnPercentage: 0,
    dayChange: 0,
    dayChangePercentage: 0,
    totalCash: 0,
    totalPortfolioValue: 0,
    cashPercentage: 0,
    investedPercentage: 0,
    lastUpdated: new Date().toISOString()
  });
  const [holdingsPerformance, setHoldingsPerformance] = useState<HoldingPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      calculatePerformance();
      // Set up realtime updates
      const channel = supabase
        .channel('portfolio-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_holdings',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            calculatePerformance();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'portfolio_performance_history',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            calculatePerformance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const calculatePerformance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all holdings (both securities and cash)
      const { data: allHoldings, error: holdingsError } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', user.id);

      if (holdingsError) {
        console.error('Error fetching holdings:', holdingsError);
        return;
      }

      if (!allHoldings || allHoldings.length === 0) {
        setPerformance({
          totalValue: 0,
          totalInvested: 0,
          totalReturn: 0,
          totalReturnPercentage: 0,
          dayChange: 0,
          dayChangePercentage: 0,
          totalCash: 0,
          totalPortfolioValue: 0,
          cashPercentage: 0,
          investedPercentage: 0,
          lastUpdated: new Date().toISOString()
        });
        setHoldingsPerformance([]);
        return;
      }

      // Separate cash and securities
      const securities = allHoldings.filter(h => !h.is_cash && h.holding_type !== 'recommendation');
      const cashHoldings = allHoldings.filter(h => h.is_cash);

      // Calculate total cash
      const totalCash = cashHoldings.reduce((sum, holding) => {
        const parsedValue = parseNumeric(holding.current_value);
        const cashValue = parsedValue ?? 0;
        const cashCurrency = typeof holding.currency === 'string' ? holding.currency : 'SEK';
        return sum + convertToSEK(cashValue, cashCurrency);
      }, 0);

      // Get yesterday's performance data for day change calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayData } = await supabase
        .from('portfolio_performance_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr);

      // Calculate securities performance
      let totalValue = 0;
      let totalInvested = 0;
      let totalYesterdayValue = 0;
      const holdingsPerf: HoldingPerformance[] = [];

      securities.forEach(holding => {
        const {
          valueInSEK: currentValue,
          quantity,
          priceCurrency,
        } = resolveHoldingValue(holding);

        const parsedPurchasePrice = parseNumeric(holding.purchase_price);
        const hasPurchasePrice = parsedPurchasePrice !== null && parsedPurchasePrice > 0 && quantity > 0;
        const purchasePrice = hasPurchasePrice ? parsedPurchasePrice : 0;

        const investedValue = hasPurchasePrice
          ? convertToSEK(purchasePrice * quantity, holding.currency || priceCurrency || 'SEK')
          : currentValue;

        // Find yesterday's value for this holding
        const yesterdayHolding = yesterdayData?.find(d => d.holding_id === holding.id);
        const yesterdayRawValue = yesterdayHolding
          ? parseNumeric(yesterdayHolding.total_value) ?? currentValue
          : currentValue;
        const yesterdayCurrency = yesterdayHolding?.currency || holding.currency || priceCurrency || 'SEK';
        const yesterdayValue = convertToSEK(yesterdayRawValue, yesterdayCurrency);

        const profit = hasPurchasePrice ? currentValue - investedValue : 0;
        const profitPercentage = hasPurchasePrice && investedValue > 0 ? (profit / investedValue) * 100 : 0;
        const dayChange = currentValue - yesterdayValue;
        const dayChangePercentage = yesterdayValue > 0 ? (dayChange / yesterdayValue) * 100 : 0;

        holdingsPerf.push({
          id: holding.id,
          name: holding.name,
          symbol: holding.symbol,
          currentValue,
          investedValue,
          profit,
          profitPercentage,
          dayChange,
          dayChangePercentage,
          hasPurchasePrice,
        });

        totalValue += currentValue;
        totalInvested += investedValue;
        totalYesterdayValue += yesterdayValue;
      });

      const totalReturn = totalValue - totalInvested;
      const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
      const dayChange = totalValue - totalYesterdayValue;
      const dayChangePercentage = totalYesterdayValue > 0 ? (dayChange / totalYesterdayValue) * 100 : 0;

      // Calculate total portfolio value (securities + cash)
      const totalPortfolioValue = totalValue + totalCash;
      const cashPercentage = totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0;
      const investedPercentage = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;

      setPerformance({
        totalValue: Math.round(totalValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100,
        dayChange: Math.round(dayChange * 100) / 100,
        dayChangePercentage: Math.round(dayChangePercentage * 100) / 100,
        totalCash: Math.round(totalCash * 100) / 100,
        totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
        cashPercentage: Math.round(cashPercentage * 100) / 100,
        investedPercentage: Math.round(investedPercentage * 100) / 100,
        lastUpdated: new Date().toISOString()
      });

      setHoldingsPerformance(holdingsPerf);

    } catch (error) {
      console.error('Error calculating performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAllPrices = async (): Promise<PriceUpdateSummary | null> => {
    if (!user || updating) {
      return null;
    }

    try {
      setUpdating(true);

      const { data: tickerResponse, error: tickerError } = await supabase.functions.invoke('list-sheet-tickers');

      if (tickerError) {
        throw new Error(tickerError.message || 'Kunde inte hämta tickers från Google Sheets.');
      }

      const tickerList = Array.isArray(tickerResponse?.tickers)
        ? (tickerResponse.tickers as SheetTicker[])
        : [];

      if (tickerList.length === 0) {
        throw new Error('Kunde inte hämta tickers från Google Sheets.');
      }

      const { data: holdings, error: holdingsError } = await supabase
        .from('user_holdings')
        .select('id, quantity, symbol, name, holding_type, price_currency, currency')
        .eq('user_id', user.id)
        .neq('holding_type', 'cash')
        .neq('holding_type', 'recommendation');

      if (holdingsError) {
        throw holdingsError;
      }

      if (!holdings || holdings.length === 0) {
        return {
          updated: 0,
          errors: 0,
          unmatched: [],
        };
      }

      const typedHoldings = holdings as HoldingRow[];
      const tickerLookup = buildTickerVariantLookup(tickerList);
      const nameLookup = new Map<string, SheetTicker>();

      tickerList.forEach((ticker) => {
        const key = normalizeNameKey(ticker.name);
        if (key && !nameLookup.has(key)) {
          nameLookup.set(key, ticker);
        }
      });

      const timestamp = new Date().toISOString();
      let updatedCount = 0;
      let errorCount = 0;
      const failedHoldings: Array<{ symbol?: string; name?: string }> = [];
      const unmatchedHoldings: Array<{ symbol?: string; name?: string }> = [];
      let finnhubUpdateCount = 0;
      let sheetUpdateCount = 0;

      const finnhubPriceCache = new Map<string, FinnhubPriceResponse | null>();

      const fetchFinnhubPrice = async (symbol: string): Promise<FinnhubPriceResponse | null> => {
        const normalizedSymbol = symbol.trim().toUpperCase();
        if (normalizedSymbol.length === 0) {
          return null;
        }

        if (finnhubPriceCache.has(normalizedSymbol)) {
          return finnhubPriceCache.get(normalizedSymbol) ?? null;
        }

        try {
          const { data: liveData, error: liveError } = await supabase.functions.invoke<FinnhubPriceResponse>('get-ticker-price', {
            body: { symbol: normalizedSymbol },
          });

          if (liveError) {
            console.warn('Finnhub live price request failed for', normalizedSymbol, liveError);
            finnhubPriceCache.set(normalizedSymbol, null);
            return null;
          }

          if (liveData && typeof liveData.price === 'number' && Number.isFinite(liveData.price) && liveData.price > 0) {
            const currency = typeof liveData.currency === 'string' && liveData.currency.trim().length > 0
              ? liveData.currency.trim().toUpperCase()
              : null;

            const result: FinnhubPriceResponse = {
              symbol: normalizedSymbol,
              price: liveData.price,
              currency,
            };

            finnhubPriceCache.set(normalizedSymbol, result);
            return result;
          }

          finnhubPriceCache.set(normalizedSymbol, null);
          return null;
        } catch (error) {
          console.error('Unexpected error invoking get-ticker-price for', normalizedSymbol, error);
          finnhubPriceCache.set(normalizedSymbol, null);
          return null;
        }
      };

      for (const holding of typedHoldings) {
        const symbolVariants = getSymbolVariants(holding.symbol);
        let matchedTicker: SheetTicker | undefined;

        for (const variant of symbolVariants) {
          matchedTicker = tickerLookup.get(variant.toUpperCase());
          if (matchedTicker) {
            break;
          }
        }

        if (!matchedTicker && holding.symbol) {
          const canonical = stripSymbolPrefix(holding.symbol);
          if (canonical) {
            matchedTicker = tickerLookup.get(canonical.toUpperCase());
          }
        }

        if (!matchedTicker && typeof holding.symbol === 'string') {
          matchedTicker = tickerLookup.get(holding.symbol.toUpperCase());
        }

        if (!matchedTicker) {
          const nameKey = normalizeNameKey(holding.name);
          if (nameKey) {
            matchedTicker = nameLookup.get(nameKey);
          }
        }

        let resolvedPrice: number | null = null;
        let resolvedCurrency: string | null = matchedTicker?.currency ? matchedTicker.currency.toUpperCase() : null;
        let priceSource: 'finnhub' | 'sheet' | null = null;
        const isSheetManagedHolding = Boolean(matchedTicker);

        if (matchedTicker && typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0) {
          resolvedPrice = matchedTicker.price;
          priceSource = 'sheet';
        }

        if (resolvedPrice === null && !isSheetManagedHolding) {
          const candidateSymbols: string[] = [];
          const addCandidate = (value?: string | null) => {
            const normalized = normalizeValue(value);
            if (!normalized) {
              return;
            }
            const upper = normalized.toUpperCase();
            if (!candidateSymbols.includes(upper)) {
              candidateSymbols.push(upper);
            }
          };

          addCandidate(matchedTicker?.symbol);
          addCandidate(holding.symbol);
          addCandidate(stripSymbolPrefix(matchedTicker?.symbol));
          addCandidate(stripSymbolPrefix(holding.symbol));
          getSymbolVariants(matchedTicker?.symbol ?? holding.symbol).forEach(addCandidate);

          for (const candidate of candidateSymbols) {
            const livePrice = await fetchFinnhubPrice(candidate);
            if (livePrice) {
              resolvedPrice = livePrice.price;
              if (livePrice.currency) {
                resolvedCurrency = livePrice.currency;
              }
              priceSource = 'finnhub';
              break;
            }
          }
        }

        if (resolvedPrice === null) {
          if (isSheetManagedHolding) {
            unmatchedHoldings.push({
              symbol: holding.symbol ?? matchedTicker?.symbol ?? undefined,
              name: holding.name ?? matchedTicker?.name ?? undefined,
            });
            continue;
          }
          unmatchedHoldings.push({
            symbol: holding.symbol ?? undefined,
            name: holding.name ?? undefined,
          });
          continue;
        }

        if (!resolvedCurrency) {
          const holdingCurrency = typeof holding.price_currency === 'string' && holding.price_currency.trim().length > 0
            ? holding.price_currency
            : typeof holding.currency === 'string' && holding.currency.trim().length > 0
              ? holding.currency
              : null;

          if (holdingCurrency) {
            resolvedCurrency = holdingCurrency.trim().toUpperCase();
          }
        }

        const effectiveCurrency = resolvedCurrency ? resolvedCurrency.toUpperCase() : 'SEK';
        const pricePerUnit = resolvedPrice;
        const pricePerUnitInSEK = convertToSEK(pricePerUnit, effectiveCurrency);
        const quantity = parseNumeric(holding.quantity) ?? 0;
        const computedValue = Number.isFinite(pricePerUnitInSEK)
          ? quantity > 0
            ? quantity * pricePerUnitInSEK
            : 0
          : null;

        const { error: updateError } = await supabase
          .from('user_holdings')
          .update({
            current_price_per_unit: pricePerUnit,
            price_currency: effectiveCurrency,
            ...(computedValue !== null ? { current_value: computedValue } : {}),
            updated_at: timestamp,
          })
          .eq('id', holding.id);

        if (updateError) {
          errorCount++;
          failedHoldings.push({
            symbol: holding.symbol ?? undefined,
            name: holding.name ?? undefined,
          });
          console.error(`Error updating holding ${holding.id}:`, updateError);
        } else {
          updatedCount++;
          if (priceSource === 'finnhub') {
            finnhubUpdateCount++;
          } else if (priceSource === 'sheet') {
            sheetUpdateCount++;
          }
        }
      }

      const descriptionParts: string[] = [];

      if (updatedCount > 0) {
        descriptionParts.push(`${updatedCount} innehav uppdaterades`);
      }

      if (errorCount > 0) {
        descriptionParts.push(`${errorCount} uppdateringar misslyckades`);
      }

      if (unmatchedHoldings.length > 0) {
        descriptionParts.push(`${unmatchedHoldings.length} innehav saknade prisdata`);
      }

      const toastTitle = updatedCount > 0
        ? 'Portföljpriser uppdaterade'
        : 'Inga portföljpriser uppdaterades';

      if (updatedCount > 0 || errorCount > 0 || unmatchedHoldings.length > 0) {
        toast({
          title: toastTitle,
          description: descriptionParts.join(' · ') || undefined,
          variant: updatedCount === 0 && (errorCount > 0 || unmatchedHoldings.length > 0)
            ? 'destructive'
            : 'default',
        });
      }

      await calculatePerformance();

      return {
        updated: updatedCount,
        errors: errorCount,
        unmatched: [...failedHoldings, ...unmatchedHoldings],
      };
    } catch (error) {
      console.error('Error updating all prices:', error);
      toast({
        title: 'Fel vid prisuppdatering',
        description: error instanceof Error ? error.message : 'Kunde inte uppdatera priserna',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const updatePrices = async (ticker?: string): Promise<PriceUpdateSummary | null> => {
    if (!user || updating) {
      return null;
    }

    const normalizedTicker = ticker?.trim().toUpperCase();

    if (!normalizedTicker) {
      toast({
        title: 'Välj innehav att uppdatera',
        description: 'Klicka på ett innehavs ticker i listan för att uppdatera priset.',
      });
      return null;
    }

    try {
      setUpdating(true);

      let tickerList: SheetTicker[] = [];
      try {
        const { data: tickerResponse, error: tickerError } = await supabase.functions.invoke('list-sheet-tickers');

        if (tickerError) {
          throw new Error(tickerError.message || 'Kunde inte hämta tickers från Google Sheets.');
        }

        tickerList = Array.isArray(tickerResponse?.tickers)
          ? (tickerResponse.tickers as SheetTicker[])
          : [];
      } catch (tickerFetchError) {
        console.warn('Kunde inte hämta tickers från Google Sheets, fortsätter med Finnhub-symbolen:', tickerFetchError);
      }

      const matchedTicker = tickerList.length > 0
        ? findTickerMatch(tickerList, normalizedTicker)
        : null;

      const fallbackSymbol = stripSymbolPrefix(normalizedTicker) ?? normalizedTicker;
      const canonicalSymbol = matchedTicker
        ? stripSymbolPrefix(matchedTicker.symbol) ?? matchedTicker.symbol.toUpperCase()
        : fallbackSymbol;
      const symbolVariantsSource = matchedTicker ? matchedTicker.symbol : normalizedTicker;
      const symbolVariants = getSymbolVariants(symbolVariantsSource);

      const normalizedFinnhubSymbol = normalizedTicker || canonicalSymbol;

      let resolvedPrice: number | null = null;
      let resolvedCurrency = matchedTicker?.currency ? matchedTicker.currency.toUpperCase() : null;
      let priceSource: 'finnhub' | 'sheet' | null = null;
      let livePriceError: string | null = null;
      const isSheetManagedTicker = Boolean(matchedTicker);

      if (isSheetManagedTicker && typeof matchedTicker?.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0) {
        resolvedPrice = matchedTicker.price;
        priceSource = 'sheet';
      }

      if (resolvedPrice === null && !isSheetManagedTicker) {
        try {
          const { data: liveData, error: liveError } = await supabase.functions.invoke<FinnhubPriceResponse>('get-ticker-price', {
            body: { symbol: normalizedFinnhubSymbol },
          });

          if (liveError) {
            livePriceError = liveError.message ?? 'Kunde inte hämta live-pris från Finnhub.';
            console.warn('Finnhub live price request failed:', liveError);
          } else if (liveData && typeof liveData.price === 'number' && Number.isFinite(liveData.price) && liveData.price > 0) {
            resolvedPrice = liveData.price;
            if (typeof liveData.currency === 'string' && liveData.currency.trim().length > 0) {
              resolvedCurrency = liveData.currency.trim().toUpperCase();
            }
            priceSource = 'finnhub';
          }
        } catch (error) {
          livePriceError = error instanceof Error ? error.message : 'Okänt fel vid hämtning av live-pris.';
          console.error('Unexpected error invoking get-ticker-price:', error);
        }
      }

      if (resolvedPrice === null && isSheetManagedTicker) {
        throw new Error(`Tickern ${canonicalSymbol} saknar ett pris i Google Sheets-dokumentet. Uppdatera kalkylarket och försök igen.`);
      }

      if (resolvedPrice === null) {
        throw new Error(`Tickern ${canonicalSymbol} saknar ett giltigt pris just nu.${livePriceError ? ` ${livePriceError}` : ''}`);
      }

      const pricePerUnit = resolvedPrice;

      let holdingsQuery = supabase
        .from('user_holdings')
        .select('id, quantity, symbol, name, holding_type, price_currency, currency')
        .eq('user_id', user.id)
        .neq('holding_type', 'cash');

      const variantSet = new Set<string>();
      symbolVariants.forEach((variant) => {
        const trimmed = variant.trim();
        if (trimmed.length > 0) {
          variantSet.add(trimmed.toUpperCase());
        }
      });

      [canonicalSymbol, normalizedTicker, fallbackSymbol]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .forEach((value) => variantSet.add(value.toUpperCase()));

      const variantFilters = Array.from(variantSet);

      if (variantFilters.length > 1) {
        holdingsQuery = holdingsQuery.or(variantFilters.map((variant) => `symbol.ilike.${variant}`).join(','));
      } else if (variantFilters.length === 1) {
        holdingsQuery = holdingsQuery.ilike('symbol', variantFilters[0]);
      }

      const { data: holdings, error: holdingsError } = await holdingsQuery;

      if (holdingsError) {
        throw holdingsError;
      }

      if (!holdings || holdings.length === 0) {
        toast({
          title: 'Inget innehav att uppdatera',
          description: `Tickern ${canonicalSymbol} finns inte i din portfölj.`,
          variant: 'destructive',
        });
        return {
          updated: 0,
          errors: 0,
          unmatched: [],
          tickerFound: Boolean(matchedTicker),
          requestedTicker: canonicalSymbol,
        };
      }

      const timestamp = new Date().toISOString();
      let updatedCount = 0;
      let errorCount = 0;
      const failedHoldings: Array<{ symbol?: string; name?: string }> = [];

      const typedHoldings = holdings as HoldingRow[];
      const fallbackHoldingCurrency = typedHoldings.find((holding) => {
        const potentialCurrency = typeof holding.price_currency === 'string'
          ? holding.price_currency
          : typeof holding.currency === 'string'
            ? holding.currency
            : null;
        return potentialCurrency && potentialCurrency.trim().length > 0;
      });

      if (!resolvedCurrency && fallbackHoldingCurrency) {
        const currency = typeof fallbackHoldingCurrency.price_currency === 'string' && fallbackHoldingCurrency.price_currency.trim().length > 0
          ? fallbackHoldingCurrency.price_currency
          : typeof fallbackHoldingCurrency.currency === 'string' && fallbackHoldingCurrency.currency.trim().length > 0
            ? fallbackHoldingCurrency.currency
            : null;

        if (currency) {
          resolvedCurrency = currency.trim().toUpperCase();
        }
      }

      const effectivePriceCurrency = resolvedCurrency ? resolvedCurrency : 'SEK';
      const pricePerUnitInSEK = convertToSEK(pricePerUnit, effectivePriceCurrency);

      for (const holding of typedHoldings) {
        const quantity = parseNumeric(holding.quantity) ?? 0;
        const computedValue = Number.isFinite(pricePerUnitInSEK)
          ? quantity > 0
            ? quantity * pricePerUnitInSEK
            : 0
          : null;

        const { error: updateError } = await supabase
          .from('user_holdings')
          .update({
            current_price_per_unit: pricePerUnit,
            price_currency: effectivePriceCurrency,
            ...(computedValue !== null ? { current_value: computedValue } : {}),
            updated_at: timestamp,
          })
          .eq('id', holding.id);

        if (updateError) {
          errorCount++;
          failedHoldings.push({
            symbol: holding.symbol ?? undefined,
            name: holding.name ?? undefined,
          });
          console.error(`Error updating holding ${holding.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      const descriptionParts: string[] = [];

      if (updatedCount > 0) {
        descriptionParts.push(`${updatedCount} innehav uppdaterades`);
      }

      if (errorCount > 0) {
        descriptionParts.push(`${errorCount} uppdateringar misslyckades`);
      }

      if (updatedCount === 0 && errorCount === 0) {
        descriptionParts.push('Tickern matchade inga innehav att uppdatera.');
      }

      const toastTitle = updatedCount > 0
        ? `Pris uppdaterat för ${canonicalSymbol}`
        : `Inget pris uppdaterades för ${canonicalSymbol}`;

      toast({
        title: toastTitle,
        description: descriptionParts.join(' · ') || undefined,
        variant: updatedCount === 0 && (errorCount > 0) ? 'destructive' : 'default',
      });

      await calculatePerformance();

      return {
        updated: updatedCount,
        errors: errorCount,
        unmatched: failedHoldings,
        tickerFound: Boolean(matchedTicker),
        requestedTicker: canonicalSymbol,
      };

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Fel vid prisuppdatering',
        description: error instanceof Error ? error.message : 'Kunde inte uppdatera priserna',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return {
    performance,
    holdingsPerformance,
    loading,
    updating,
    updateAllPrices,
    updatePrices,
    refetch: calculatePerformance
  };
};
