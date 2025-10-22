
import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserHolding } from '@/hooks/useUserHoldings';
import useSheetTickers, { SheetTicker, RawSheetTicker, sanitizeSheetTickerList } from '@/hooks/useSheetTickers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ADD_HOLDING_FORM_STORAGE_KEY } from '@/constants/storageKeys';
import { supabase } from '@/integrations/supabase/client';

interface AddHoldingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  initialData?: any;
}

interface AddHoldingFormState {
  formData: {
    name: string;
    symbol: string;
    holding_type: string;
    quantity: string;
    purchase_price: string;
    currency: string;
  };
  priceOverridden: boolean;
  currencyOverridden: boolean;
  nameOverridden: boolean;
  lastInitialDataSignature: string | null;
}

const createDefaultFormState = (): AddHoldingFormState => ({
  formData: {
    name: '',
    symbol: '',
    holding_type: 'stock',
    quantity: '',
    purchase_price: '',
    currency: 'SEK'
  },
  priceOverridden: false,
  currencyOverridden: false,
  nameOverridden: false,
  lastInitialDataSignature: null,
});

const AddHoldingDialog: React.FC<AddHoldingDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData
}) => {
  const { tickers: sheetTickers, isLoading: tickersLoading, error: tickersError } = useSheetTickers();
  const [dialogState, setDialogState, resetDialogState] = useLocalStorage<AddHoldingFormState>(
    ADD_HOLDING_FORM_STORAGE_KEY,
    createDefaultFormState
  );
  const { formData, priceOverridden, currencyOverridden, nameOverridden } = dialogState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [showTickerList, setShowTickerList] = useState(false);
  const [tickerListManuallyExpanded, setTickerListManuallyExpanded] = useState(false);
  const [yahooTickers, setYahooTickers] = useState<SheetTicker[]>([]);
  const [yahooLoading, setYahooLoading] = useState(false);
  const [yahooError, setYahooError] = useState<string | null>(null);
  const [fetchedPrices, setFetchedPrices] = useState<Record<string, { price: number; currency: string | null }>>({});
  const [priceFetchState, setPriceFetchState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  const normalizedSymbol = useMemo(() => {
    const rawSymbol = formData.symbol?.trim();
    return rawSymbol ? rawSymbol.toUpperCase() : '';
  }, [formData.symbol]);

  const combinedTickers = useMemo(() => {
    const map = new Map<string, SheetTicker>();

    sheetTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });

    yahooTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });

    return Array.from(map.values()).map((ticker) => {
      const fetched = fetchedPrices[ticker.symbol.toUpperCase()];

      if (!fetched) {
        return ticker;
      }

      const resolvedPrice = typeof fetched.price === 'number' && Number.isFinite(fetched.price) && fetched.price > 0
        ? fetched.price
        : ticker.price;
      const resolvedCurrency = typeof fetched.currency === 'string' && fetched.currency.trim().length > 0
        ? fetched.currency.trim().toUpperCase()
        : ticker.currency;

      if (resolvedPrice === ticker.price && resolvedCurrency === ticker.currency) {
        return ticker;
      }

      return {
        ...ticker,
        price: resolvedPrice,
        currency: resolvedCurrency ?? null,
      };
    });
  }, [sheetTickers, yahooTickers, fetchedPrices]);

  const tickerLookup = useMemo(() => {
    const map = new Map<string, SheetTicker>();
    combinedTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });
    return map;
  }, [combinedTickers]);

  const matchedTicker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) ?? null : null;

  useEffect(() => {
    const trimmedSymbol = formData.symbol.trim();

    if (trimmedSymbol.length < 2) {
      setYahooTickers([]);
      setYahooError(null);
      setYahooLoading(false);
      return;
    }

    let isActive = true;
    setYahooLoading(true);
    setYahooError(null);

    const handler = setTimeout(() => {
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke('list-sheet-tickers', {
            body: { query: trimmedSymbol },
          });

          if (!isActive) {
            return;
          }

          if (error) {
            throw new Error(error.message ?? 'Kunde inte hämta tickers från Yahoo Finance.');
          }

          const list = Array.isArray(data?.tickers)
            ? (data.tickers as RawSheetTicker[])
            : [];

          setYahooTickers(sanitizeSheetTickerList(list));
          setYahooError(null);
        } catch (err) {
          if (!isActive) {
            return;
          }

          console.error('Failed to fetch Yahoo Finance tickers:', err);
          const message = err instanceof Error ? err.message : 'Kunde inte hämta tickers från Yahoo Finance.';
          setYahooError(message);
          setYahooTickers([]);
        } finally {
          if (isActive) {
            setYahooLoading(false);
          }
        }
      })();
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(handler);
    };
  }, [formData.symbol]);

  useEffect(() => {
    if (!normalizedSymbol || !matchedTicker) {
      setPriceFetchState((prev) => (prev.loading || prev.error ? { loading: false, error: null } : prev));
      return;
    }

    const hasExistingPrice = typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0;
    const existingFetchedPrice = fetchedPrices[normalizedSymbol];

    if (hasExistingPrice || existingFetchedPrice) {
      setPriceFetchState((prev) => (prev.loading || prev.error ? { loading: false, error: null } : prev));
      return;
    }

    let isActive = true;
    setPriceFetchState({ loading: true, error: null });

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-ticker-price', {
          body: { symbol: normalizedSymbol },
        });

        if (!isActive) {
          return;
        }

        if (error) {
          throw new Error(error.message ?? 'Kunde inte hämta live-priset.');
        }

        const rawPrice = data?.price;
        const rawCurrency = typeof data?.currency === 'string' ? data.currency : null;

        if (typeof rawPrice !== 'number' || !Number.isFinite(rawPrice) || rawPrice <= 0) {
          throw new Error('Inget pris kunde hämtas för den valda tickern.');
        }

        setFetchedPrices((prev) => {
          const normalizedCurrency = rawCurrency ? rawCurrency.trim().toUpperCase() : null;
          const existing = prev[normalizedSymbol];

          if (existing && existing.price === rawPrice && existing.currency === normalizedCurrency) {
            return prev;
          }

          return {
            ...prev,
            [normalizedSymbol]: {
              price: rawPrice,
              currency: normalizedCurrency,
            },
          };
        });

        setPriceFetchState({ loading: false, error: null });
      } catch (err) {
        console.error('Failed to fetch Finnhub price:', err);
        if (!isActive) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Kunde inte hämta live-priset.';
        setPriceFetchState({ loading: false, error: message });
      }
    })();

    return () => {
      isActive = false;
    };
  }, [normalizedSymbol, matchedTicker, fetchedPrices]);

  // Update form data when initialData changes
  useEffect(() => {
    if (!initialData) {
      setDialogState(prev => {
        if (prev.lastInitialDataSignature === null) {
          return prev;
        }

        return {
          ...prev,
          lastInitialDataSignature: null,
        };
      });
      return;
    }

    const signatureParts = [initialData.id, initialData.symbol, initialData.name]
      .filter(Boolean)
      .join('::');

    setDialogState(prev => {
      if (prev.lastInitialDataSignature === signatureParts) {
        return prev;
      }

      return {
        formData: {
          name: initialData.name || '',
          symbol: initialData.symbol || '',
          holding_type: initialData.holding_type === 'recommendation' ? 'stock' : (initialData.holding_type || 'stock'),
          quantity: '',
          purchase_price: initialData.purchase_price?.toString() || '',
          currency: initialData.currency || 'SEK'
        },
        priceOverridden: Boolean(initialData.purchase_price),
        currencyOverridden: Boolean(initialData.currency),
        nameOverridden: Boolean(initialData.name),
        lastInitialDataSignature: signatureParts,
      };
    });
  }, [initialData, setDialogState]);

  useEffect(() => {
    if (!matchedTicker || nameOverridden) {
      return;
    }

    const resolvedName = matchedTicker.name?.trim() || matchedTicker.symbol;

    setDialogState(prev => {
      if (prev.nameOverridden) {
        return prev;
      }

      if (prev.formData.name === resolvedName) {
        return prev;
      }

      return {
        ...prev,
        formData: {
          ...prev.formData,
          name: resolvedName,
        },
      };
    });
  }, [matchedTicker, nameOverridden, setDialogState]);

  useEffect(() => {
    if (!matchedTicker || priceOverridden) {
      return;
    }

    if (typeof matchedTicker.price !== 'number' || !Number.isFinite(matchedTicker.price) || matchedTicker.price <= 0) {
      return;
    }

    const nextPrice = matchedTicker.price.toString();

    setDialogState(prev => {
      if (prev.priceOverridden) {
        return prev;
      }

      if (prev.formData.purchase_price === nextPrice) {
        return prev;
      }

      return {
        ...prev,
        formData: {
          ...prev.formData,
          purchase_price: nextPrice,
        },
      };
    });
  }, [matchedTicker, priceOverridden, setDialogState]);

  useEffect(() => {
    if (!matchedTicker?.symbol) {
      return;
    }

    setDialogState(prev => {
      if (!prev.priceOverridden && !prev.currencyOverridden) {
        return prev;
      }

      return {
        ...prev,
        priceOverridden: false,
        currencyOverridden: false,
      };
    });
  }, [matchedTicker?.symbol, setDialogState]);

  useEffect(() => {
    if (!matchedTicker?.currency || currencyOverridden) {
      return;
    }

    const normalizedCurrency = matchedTicker.currency.toUpperCase();
    setDialogState(prev => {
      if (prev.currencyOverridden) {
        return prev;
      }

      if (prev.formData.currency === normalizedCurrency) {
        return prev;
      }

      return {
        ...prev,
        formData: {
          ...prev.formData,
          currency: normalizedCurrency,
        },
      };
    });
  }, [matchedTicker?.currency, currencyOverridden, setDialogState]);
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const formatDisplayPrice = useCallback(
    (price: number) => priceFormatter.format(price),
    [priceFormatter]
  );

  const deferredTickers = useDeferredValue(combinedTickers);

  const tickerOptions = useMemo(() => deferredTickers.map((ticker) => {
    const label = ticker.name && ticker.name !== ticker.symbol
      ? `${ticker.name} (${ticker.symbol})`
      : ticker.symbol;
    const priceLabel = typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
      ? ` – ${formatDisplayPrice(ticker.price)}${ticker.currency ? ` ${ticker.currency}` : ''}`.trimEnd()
      : '';

    return (
      <option
        key={ticker.symbol}
        value={ticker.symbol}
        label={`${label}${priceLabel}`}
      />
    );
  }), [deferredTickers, formatDisplayPrice]);

  const tickerListSuggestions = useMemo(() => {
    const searchTerm = formData.symbol.trim().toLowerCase();
    const baseTickers = searchTerm
      ? deferredTickers.filter((ticker) => {
        const symbolMatch = ticker.symbol.toLowerCase().includes(searchTerm);
        const nameMatch = ticker.name ? ticker.name.toLowerCase().includes(searchTerm) : false;
        return symbolMatch || nameMatch;
      })
      : deferredTickers;

    return baseTickers.slice(0, 25);
  }, [deferredTickers, formData.symbol]);

  const resolvedSheetPrice = matchedTicker && typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0
    ? matchedTicker.price
    : null;

  const sheetPriceCurrency = matchedTicker?.currency ?? (formData.currency || undefined);

  const sheetPriceDisplay = resolvedSheetPrice !== null
    ? `${formatDisplayPrice(resolvedSheetPrice)}${sheetPriceCurrency ? ` ${sheetPriceCurrency}` : ''}`.trim()
    : '';

  const isLivePriceLoading = priceFetchState.loading;
  const livePriceError = priceFetchState.error;

  const handleInputChange = (field: string, value: string) => {
    const shouldCollapseManualList = field === 'symbol' && !value.trim();

    if (field === 'symbol') {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        setShowTickerList(true);
      } else if (!tickerListManuallyExpanded) {
        setShowTickerList(false);
      }

      if (symbolError) {
        setSymbolError(null);
      }
    }

    setDialogState(prev => {
      const updatedFormData = {
        ...prev.formData,
        [field]: value,
      };

      let priceOverride = prev.priceOverridden;
      let currencyOverride = prev.currencyOverridden;
      let nameOverride = prev.nameOverridden;
      let lastSignature = prev.lastInitialDataSignature;

      if (field === 'name') {
        nameOverride = true;
      }

      if (field === 'symbol') {
        priceOverride = false;
        currencyOverride = false;
        nameOverride = false;
        lastSignature = null;
      }

      if (field === 'purchase_price') {
        priceOverride = true;
      }

      if (field === 'currency') {
        currencyOverride = true;
      }

      const previousValue = prev.formData[field as keyof AddHoldingFormState['formData']];

      if (
        previousValue === value &&
        priceOverride === prev.priceOverridden &&
        currencyOverride === prev.currencyOverridden &&
        nameOverride === prev.nameOverridden &&
        lastSignature === prev.lastInitialDataSignature
      ) {
        return prev;
      }

      return {
        ...prev,
        formData: updatedFormData,
        priceOverridden: priceOverride,
        currencyOverridden: currencyOverride,
        nameOverridden: nameOverride,
        lastInitialDataSignature: lastSignature,
      };
    });

    if (shouldCollapseManualList) {
      setTickerListManuallyExpanded(false);
    }
  };

  const handleTickerListSelect = (ticker: SheetTicker) => {
    handleInputChange('symbol', ticker.symbol);
    setShowTickerList(false);
    setTickerListManuallyExpanded(false);
  };

  const toggleTickerList = () => {
    setTickerListManuallyExpanded((prev) => {
      const next = !prev;
      setShowTickerList(next);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!normalizedSymbol || !tickerLookup.has(normalizedSymbol)) {
      setSymbolError('Tickern finns inte i listan Välj en ticker från listan eller lägg in manuellt.');
      return;
    }

    setIsSubmitting(true);

    const quantity = formData.quantity ? parseFloat(formData.quantity) : undefined;
    const purchasePrice = formData.purchase_price ? parseFloat(formData.purchase_price) : undefined;

    const holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      symbol: normalizedSymbol,
      holding_type: formData.holding_type as UserHolding['holding_type'],
      quantity,
      purchase_price: purchasePrice,
      currency: formData.currency || 'SEK'
    };

    if (quantity !== undefined && purchasePrice !== undefined) {
      const calculatedValue = Math.round(quantity * purchasePrice * 100) / 100;
      holdingData.current_value = calculatedValue;
    }

    if (matchedTicker && typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0) {
      holdingData.current_price_per_unit = matchedTicker.price;
      holdingData.price_currency = matchedTicker.currency ?? holdingData.currency;

      if (quantity !== undefined && typeof holdingData.current_value !== 'number') {
        const computedCurrentValue = Math.round(quantity * matchedTicker.price * 100) / 100;
        holdingData.current_value = computedCurrentValue;
      }
    }

    const success = await onAdd(holdingData);

    if (success) {
      resetDialogState();
      setSymbolError(null);
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetDialogState();
      setSymbolError(null);
      setShowMobileTickerList(false);
      setMobileListManuallyExpanded(false);
      onClose();
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? `Lägg till ${initialData.name}` : 'Lägg till innehav'}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Fyll i dina detaljer för att lägga till denna rekommendation till dina innehav.'
              : 'Lägg till en ny aktie eller fond till din portfölj.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="t.ex. Volvo B"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Input
                    id="symbol"
                    list="sheet-tickers"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    onFocus={() => {
                      if (formData.symbol.trim() || tickerListManuallyExpanded) {
                        setShowTickerList(true);
                      }
                    }}
                    placeholder={(tickersLoading || yahooLoading) ? 'Hämtar tickers...' : 't.ex. VOLV-B'}
                    required
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={toggleTickerList}
                    aria-expanded={showTickerList}
                    aria-controls="ticker-suggestions"
                    className={cn(
                    'inline-flex items-center justify-center gap-1 rounded-full border border-white/40 bg-white/80 px-4 py-2 text-xs font-semibold text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)] backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:shadow-[0_1px_0_rgba(255,255,255,0.08)]',
                    'hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.18)] dark:hover:bg-slate-900',
                    'sm:px-5 sm:py-2.5 sm:text-sm sm:font-medium sm:border-border/60 sm:bg-background/90 sm:text-foreground sm:shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:hover:shadow-[0_22px_48px_rgba(15,23,42,0.2)] sm:dark:border-slate-800 sm:dark:bg-slate-900/80 sm:dark:text-slate-100 sm:dark:shadow-[0_12px_30px_rgba(15,23,42,0.32)] sm:dark:hover:bg-slate-900'
                    )}
                  >
                    tickerlista
                  </button>
                </div>
                {showTickerList && (
                  <div
                    id="ticker-suggestions"
                    className="mt-3 max-h-60 overflow-y-auto rounded-[28px] border border-white/40 bg-white/80 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(15,23,42,0.45)] sm:absolute sm:top-[calc(100%+0.75rem)] sm:left-0 sm:right-auto sm:z-30 sm:w-full sm:min-w-[320px] sm:max-w-[480px] sm:rounded-[32px] sm:border-border/60 sm:bg-background/95 sm:p-3 sm:shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:backdrop-blur-2xl sm:dark:border-slate-800 sm:dark:bg-slate-950/90"
                  >
                    {(tickersLoading || yahooLoading) ? (
                      <p className="px-3 py-2 text-xs font-medium text-muted-foreground sm:text-sm">Hämtar tickers...</p>
                    ) : tickerListSuggestions.length > 0 ? (
                      tickerListSuggestions.map((ticker) => {
                        const displayPrice = typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
                          ? `${formatDisplayPrice(ticker.price)}${ticker.currency ? ` ${ticker.currency}` : ''}`.trim()
                          : null;

                        return (
                          <button
                            key={`ticker-list-${ticker.symbol}`}
                            type="button"
                            onClick={() => handleTickerListSelect(ticker)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3 text-left text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 dark:bg-slate-900/60 dark:text-white dark:shadow-[0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-slate-900 sm:rounded-3xl sm:px-5 sm:py-3.5 sm:text-sm sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_40px_rgba(15,23,42,0.2)]"
                          >
                            <div>
                              <div className="text-sm font-semibold tracking-wide text-foreground dark:text-white sm:text-base">{ticker.symbol}</div>
                              {ticker.name && (
                                <div className="text-xs text-muted-foreground sm:text-sm">{ticker.name}</div>
                              )}
                            </div>
                            {displayPrice && (
                              <div className="text-xs font-semibold text-muted-foreground sm:text-sm">{displayPrice}</div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-xs font-medium text-muted-foreground sm:text-sm">Inga tickers matchar din sökning ännu.</p>
                    )}
                  </div>
                )}
              </div>
              {symbolError && (
                <p className="text-sm text-destructive">{symbolError}</p>
              )}
              {tickersError && (
                <p className="text-sm text-muted-foreground">{tickersError}</p>
              )}
              {yahooError && (
                <p className="text-sm text-muted-foreground">{yahooError}</p>
              )}
            </div>
          </div>
          <datalist id="sheet-tickers">
            {tickerOptions}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holding_type">Typ</Label>
              <Select 
                value={formData.holding_type} 
                onValueChange={(value) => handleInputChange('holding_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Aktie</SelectItem>
                  <SelectItem value="fund">Fond</SelectItem>
                  <SelectItem value="crypto">Krypto</SelectItem>
                  <SelectItem value="bonds">Obligation</SelectItem>
                  <SelectItem value="real_estate">Fastighet</SelectItem>
                  <SelectItem value="other">Övrigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Antal</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="t.ex. 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Köppris</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                placeholder="t.ex. 150.50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheet_price">Aktuellt pris</Label>
            <Input
              id="sheet_price"
              value={sheetPriceDisplay}
              readOnly
              placeholder={(tickersLoading || yahooLoading || isLivePriceLoading) ? 'Hämtar pris...' : 'Välj en ticker för att hämta priset'}
            />
            <p className="text-xs text-muted-foreground">
              {sheetPriceDisplay
                ? 'Priset läggs in som förvalt köppris men kan justeras innan du sparar.'
                : 'Priset hämtas automatiskt när du väljer en ticker från listan.'}
            </p>
            {isLivePriceLoading && (
              <p className="text-xs text-muted-foreground">Hämtar live-pris från Finnhub...</p>
            )}
            {livePriceError && (
              <p className="text-xs text-destructive">{livePriceError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Lägger till...' : 'Lägg till innehav'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHoldingDialog;
