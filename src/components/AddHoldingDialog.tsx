
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
import { ADD_HOLDING_FORM_STORAGE_KEY, ADD_HOLDING_MANUAL_TICKERS_STORAGE_KEY } from '@/constants/storageKeys';
import { supabase } from '@/integrations/supabase/client';

async function fetchYahooQuote(symbol: string) {
  const res = await fetch(
    `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(symbol)}`,
    {
      headers: {
        'User-Agent': navigator.userAgent,
        Accept: 'application/json',
        Referer: 'https://finance.yahoo.com/',
      },
    }
  );

  if (!res.ok) {
    console.warn('Yahoo quote fetch failed:', res.status, res.statusText);
    return null;
  }

  const json = await res.json();
  const quote = json?.quoteResponse?.result?.[0];
  if (!quote) return null;

  return {
    symbol: quote.symbol as string | undefined,
    price: (quote.regularMarketPrice ?? null) as number | null,
    currency: (quote.currency ?? null) as string | null,
    name: (quote.shortName ?? quote.longName ?? quote.symbol) as string | undefined,
  };
}

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
  const [manualTickers, setManualTickers] = useLocalStorage<SheetTicker[]>(
    ADD_HOLDING_MANUAL_TICKERS_STORAGE_KEY,
    []
  );
  const { formData, priceOverridden, currencyOverridden, nameOverridden } = dialogState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [showMobileTickerList, setShowMobileTickerList] = useState(false);
  const [mobileListManuallyExpanded, setMobileListManuallyExpanded] = useState(false);
  const [yahooTickers, setYahooTickers] = useState<SheetTicker[]>([]);
  const [yahooLoading, setYahooLoading] = useState(false);
  const [yahooError, setYahooError] = useState<string | null>(null);

  const upsertManualTicker = useCallback(
    (incoming: { symbol: string; name?: string | null; price?: number | null | undefined; currency?: string | null | undefined }) => {
      const normalizedSymbol = typeof incoming.symbol === 'string' ? incoming.symbol.trim().toUpperCase() : '';
      if (!normalizedSymbol) {
        return;
      }

      const normalizedName =
        typeof incoming.name === 'string' && incoming.name.trim().length > 0
          ? incoming.name.trim()
          : normalizedSymbol;

      const normalizedCurrency =
        typeof incoming.currency === 'string' && incoming.currency.trim().length > 0
          ? incoming.currency.trim().toUpperCase()
          : null;

      const normalizedPrice =
        typeof incoming.price === 'number' && Number.isFinite(incoming.price) && incoming.price > 0
          ? incoming.price
          : null;

      setManualTickers((prevTickers) => {
        const previous = Array.isArray(prevTickers) ? prevTickers : [];
        const existingIndex = previous.findIndex(
          (ticker) => ticker.symbol.toUpperCase() === normalizedSymbol
        );

        if (existingIndex === -1) {
          const nextList = [
            ...previous,
            {
              symbol: normalizedSymbol,
              name: normalizedName,
              price: normalizedPrice,
              currency: normalizedCurrency,
            },
          ];

          if (nextList.length > 50) {
            return nextList.slice(nextList.length - 50);
          }

          return nextList;
        }

        const existing = previous[existingIndex];
        const merged: SheetTicker = {
          symbol: normalizedSymbol,
          name: normalizedName || existing.name || normalizedSymbol,
          price: normalizedPrice ?? existing.price ?? null,
          currency: normalizedCurrency ?? existing.currency ?? null,
        };

        if (
          existing.name === merged.name &&
          existing.price === merged.price &&
          existing.currency === merged.currency
        ) {
          return prevTickers;
        }

        const nextList = [...previous];
        nextList[existingIndex] = merged;
        return nextList;
      });
    },
    [setManualTickers]
  );

  const normalizedSymbol = useMemo(() => {
    const rawSymbol = formData.symbol?.trim();
    return rawSymbol ? rawSymbol.toUpperCase() : '';
  }, [formData.symbol]);

  const combinedTickers = useMemo(() => {
    const map = new Map<string, SheetTicker>();

    manualTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });

    sheetTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });

    yahooTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });

    return Array.from(map.values());
  }, [manualTickers, sheetTickers, yahooTickers]);

  const tickerLookup = useMemo(() => {
    const map = new Map<string, SheetTicker>();
    combinedTickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });
    return map;
  }, [combinedTickers]);

  const matchedTicker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) ?? null : null;

  useEffect(() => {
    const symbol = formData.symbol?.trim();
    if (!symbol) {
      return;
    }

    let isActive = true;

    (async () => {
      const quote = await fetchYahooQuote(symbol);
      if (!quote || !isActive) {
        return;
      }

      if (quote.symbol || symbol) {
        upsertManualTicker({
          symbol: quote.symbol ?? symbol,
          name: quote.name ?? quote.symbol ?? symbol,
          price: quote.price ?? null,
          currency: quote.currency ?? null,
        });
      }

      setDialogState((prev) => {
        const prevSymbol = prev.formData.symbol?.trim().toUpperCase();
        if (prevSymbol !== symbol.toUpperCase()) {
          return prev;
        }

        let updated = false;
        const nextFormData = { ...prev.formData };

        if (!prev.priceOverridden && typeof quote.price === 'number' && Number.isFinite(quote.price) && quote.price > 0) {
          const priceString = quote.price.toString();
          if (nextFormData.purchase_price !== priceString) {
            nextFormData.purchase_price = priceString;
            updated = true;
          }
        }

        if (quote.currency && !prev.currencyOverridden) {
          const currency = quote.currency.toUpperCase();
          if (nextFormData.currency !== currency) {
            nextFormData.currency = currency;
            updated = true;
          }
        }

        return updated ? { ...prev, formData: nextFormData } : prev;
      });
    })();

    return () => {
      isActive = false;
    };
  }, [formData.symbol, setDialogState, upsertManualTicker]);

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

  const mobileTickerSuggestions = useMemo(() => {
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

  const handleInputChange = (field: string, value: string) => {
    const shouldCollapseManualList = field === 'symbol' && !value.trim();

    if (field === 'symbol') {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        setShowMobileTickerList(true);
      } else if (!mobileListManuallyExpanded) {
        setShowMobileTickerList(false);
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
      setMobileListManuallyExpanded(false);
    }
  };

  const handleMobileTickerSelect = (ticker: SheetTicker) => {
    handleInputChange('symbol', ticker.symbol);
    setShowMobileTickerList(false);
    setMobileListManuallyExpanded(false);
  };

  const toggleMobileTickerList = () => {
    setMobileListManuallyExpanded((prev) => {
      const next = !prev;
      setShowMobileTickerList(next);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!normalizedSymbol) {
      setSymbolError('Ange en ticker.');
      return;
    }

    setSymbolError(null);

    const quantity = formData.quantity ? parseFloat(formData.quantity) : undefined;
    const purchasePrice = formData.purchase_price ? parseFloat(formData.purchase_price) : undefined;

    if (!tickerLookup.has(normalizedSymbol)) {
      upsertManualTicker({
        symbol: normalizedSymbol,
        name: formData.name,
        price: purchasePrice,
        currency: formData.currency,
      });
    }

    setIsSubmitting(true);

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
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="symbol">Symbol</Label>
                <button
                  type="button"
                  onClick={toggleMobileTickerList}
                  aria-expanded={showMobileTickerList}
                  aria-controls="mobile-ticker-suggestions"
                  className="sm:hidden rounded-md bg-muted px-3 py-1 text-xs font-medium text-primary transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  tickerlista
                </button>
              </div>
              <Input
                id="symbol"
                list="sheet-tickers"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                onFocus={() => {
                  if (formData.symbol.trim() || mobileListManuallyExpanded) {
                    setShowMobileTickerList(true);
                  }
                }}
                placeholder={(tickersLoading || yahooLoading) ? 'Hämtar tickers...' : 't.ex. VOLV-B'}
                required
              />
              {symbolError && (
                <p className="text-sm text-destructive">{symbolError}</p>
              )}
              {tickersError && (
                <p className="text-sm text-muted-foreground">{tickersError}</p>
              )}
              {yahooError && (
                <p className="text-sm text-muted-foreground">{yahooError}</p>
              )}
              {!symbolError && !yahooError && (
                <p className="text-xs text-muted-foreground">
                  Du kan också skriva in en ticker manuellt om den inte finns i listan.
                </p>
              )}
            </div>
          </div>
          <datalist id="sheet-tickers">
            {tickerOptions}
          </datalist>
          <div className="sm:hidden space-y-2">
            {showMobileTickerList && (
              <div
                id="mobile-ticker-suggestions"
                className="max-h-56 overflow-y-auto rounded-2xl border border-border/60 bg-muted/50 p-1 shadow-sm"
              >
                {(tickersLoading || yahooLoading) ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Hämtar tickers...</p>
                ) : mobileTickerSuggestions.length > 0 ? (
                  mobileTickerSuggestions.map((ticker) => {
                    const displayPrice = typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0
                      ? `${formatDisplayPrice(ticker.price)}${ticker.currency ? ` ${ticker.currency}` : ''}`.trim()
                      : null;

                    return (
                      <button
                        key={`mobile-ticker-${ticker.symbol}`}
                        type="button"
                        onClick={() => handleMobileTickerSelect(ticker)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div>
                          <div className="text-sm font-semibold text-foreground">{ticker.symbol}</div>
                          {ticker.name && (
                            <div className="text-xs text-muted-foreground">{ticker.name}</div>
                          )}
                        </div>
                        {displayPrice && (
                          <div className="text-xs font-medium text-muted-foreground">{displayPrice}</div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Inga tickers matchar din sökning ännu.</p>
                )}
              </div>
            )}
          </div>

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
              placeholder={(tickersLoading || yahooLoading) ? 'Hämtar pris...' : 'Välj en ticker för att hämta priset'}
            />
            <p className="text-xs text-muted-foreground">
              {sheetPriceDisplay
                ? 'Priset läggs in som förvalt köppris men kan justeras innan du sparar.'
                : 'Priset hämtas automatiskt när du väljer en ticker från listan.'}
            </p>
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
