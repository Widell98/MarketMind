
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
import useSheetTickers, { SheetTicker } from '@/hooks/useSheetTickers';
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
    purchase_date: string;
    sector: string;
    market: string;
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
    purchase_date: '',
    sector: '',
    market: '',
    currency: 'SEK'
  },
  priceOverridden: false,
  currencyOverridden: false,
  nameOverridden: false,
  lastInitialDataSignature: null,
});

interface AlphaQuote {
  symbol: string;
  price: number;
  currency: string | null;
  changePercent: number | null;
  fetchedAt: string | null;
}

type QuoteState =
  | { status: 'idle'; symbol: null; data: null; error: null }
  | { status: 'loading'; symbol: string; data: null; error: null }
  | { status: 'success'; symbol: string; data: AlphaQuote; error: null }
  | { status: 'error'; symbol: string; data: null; error: string };

interface FetchAlphaQuoteResponse {
  success: boolean;
  symbol?: string;
  quote?: {
    pricePerUnit: number;
    currency: string | null;
    changePercent: number | null;
    fetchedAt?: string;
  };
  error?: string;
}

const AddHoldingDialog: React.FC<AddHoldingDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData
}) => {
  const { tickers, isLoading: tickersLoading, error: tickersError } = useSheetTickers();
  const [dialogState, setDialogState, resetDialogState] = useLocalStorage<AddHoldingFormState>(
    ADD_HOLDING_FORM_STORAGE_KEY,
    createDefaultFormState
  );
  const { formData, priceOverridden, currencyOverridden, nameOverridden } = dialogState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteState, setQuoteState] = useState<QuoteState>({
    status: 'idle',
    symbol: null,
    data: null,
    error: null,
  });

  const normalizedSymbol = useMemo(() => {
    const rawSymbol = formData.symbol?.trim();
    return rawSymbol ? rawSymbol.toUpperCase() : '';
  }, [formData.symbol]);

  const tickerLookup = useMemo(() => {
    const map = new Map<string, SheetTicker>();
    tickers.forEach((ticker) => {
      map.set(ticker.symbol.toUpperCase(), ticker);
    });
    return map;
  }, [tickers]);

  const matchedTicker = normalizedSymbol ? tickerLookup.get(normalizedSymbol) ?? null : null;
  const activeQuote = quoteState.symbol === normalizedSymbol && quoteState.status === 'success'
    ? quoteState.data
    : null;
  const isQuoteLoading = quoteState.symbol === normalizedSymbol && quoteState.status === 'loading';
  const quoteError = quoteState.symbol === normalizedSymbol && quoteState.status === 'error'
    ? quoteState.error
    : null;

  useEffect(() => {
    if (!normalizedSymbol) {
      setQuoteState(prev => {
        if (prev.status === 'idle' && prev.symbol === null) {
          return prev;
        }

        return {
          status: 'idle',
          symbol: null,
          data: null,
          error: null,
        };
      });
      return;
    }

    if (quoteState.symbol === normalizedSymbol && quoteState.status !== 'idle') {
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setQuoteState({ status: 'loading', symbol: normalizedSymbol, data: null, error: null });

      try {
        const { data, error } = await supabase.functions.invoke<FetchAlphaQuoteResponse>('fetch-alpha-quote', {
          body: { symbol: normalizedSymbol },
        });

        if (!isActive) {
          return;
        }

        if (error) {
          console.error('Failed to fetch Alpha Vantage quote:', error);
          setQuoteState({
            status: 'error',
            symbol: normalizedSymbol,
            data: null,
            error: error.message ?? 'Kunde inte hämta pris från Alpha Vantage.',
          });
          return;
        }

        if (!data?.success || !data.quote || typeof data.quote.pricePerUnit !== 'number') {
          setQuoteState({
            status: 'error',
            symbol: normalizedSymbol,
            data: null,
            error: data?.error ?? 'Kunde inte hämta pris från Alpha Vantage.',
          });
          return;
        }

        setQuoteState({
          status: 'success',
          symbol: normalizedSymbol,
          data: {
            symbol: normalizedSymbol,
            price: data.quote.pricePerUnit,
            currency: data.quote.currency ?? null,
            changePercent: typeof data.quote.changePercent === 'number' ? data.quote.changePercent : null,
            fetchedAt: data.quote.fetchedAt ?? null,
          },
          error: null,
        });
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error('Unexpected error fetching Alpha Vantage quote:', err);
        const message = err instanceof Error ? err.message : 'Kunde inte hämta pris från Alpha Vantage.';
        setQuoteState({
          status: 'error',
          symbol: normalizedSymbol,
          data: null,
          error: message,
        });
      }
    }, 400);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedSymbol, quoteState.symbol, quoteState.status]);

  useEffect(() => {
    if (!activeQuote || priceOverridden) {
      return;
    }

    const nextPrice = activeQuote.price.toString();

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
  }, [activeQuote, priceOverridden, setDialogState]);

  useEffect(() => {
    if (!activeQuote?.currency || currencyOverridden) {
      return;
    }

    const normalizedCurrency = activeQuote.currency.toUpperCase();

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
  }, [activeQuote?.currency, currencyOverridden, setDialogState]);

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
          purchase_date: '',
          sector: initialData.sector || '',
          market: initialData.market || '',
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
    if (activeQuote?.currency) {
      return;
    }

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
  }, [activeQuote?.currency, matchedTicker?.currency, currencyOverridden, setDialogState]);
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const formatDisplayPrice = useCallback(
    (price: number) => priceFormatter.format(price),
    [priceFormatter]
  );

  const deferredTickers = useDeferredValue(tickers);

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

  const resolvedQuotePrice = activeQuote?.price ?? null;
  const quoteCurrency = activeQuote?.currency ?? (formData.currency || undefined);

  const quotePriceDisplay = resolvedQuotePrice !== null
    ? `${formatDisplayPrice(resolvedQuotePrice)}${quoteCurrency ? ` ${quoteCurrency}` : ''}`.trim()
    : '';
  const quoteChangePercent = activeQuote && typeof activeQuote.changePercent === 'number' && Number.isFinite(activeQuote.changePercent)
    ? activeQuote.changePercent
    : null;

  const handleInputChange = (field: string, value: string) => {
    if (field === 'symbol') {
      setQuoteState({ status: 'idle', symbol: null, data: null, error: null });
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !normalizedSymbol) return;

    setIsSubmitting(true);

    let quantity = formData.quantity ? parseFloat(formData.quantity) : undefined;
    if (quantity !== undefined && !Number.isFinite(quantity)) {
      quantity = undefined;
    }
    const activePrice = activeQuote?.price ?? null;
    const activeCurrency = activeQuote?.currency ?? null;

    let purchasePrice = formData.purchase_price ? parseFloat(formData.purchase_price) : undefined;
    if (purchasePrice !== undefined && !Number.isFinite(purchasePrice)) {
      purchasePrice = undefined;
    }
    if (activePrice !== null && (!priceOverridden || !Number.isFinite(purchasePrice))) {
      purchasePrice = activePrice;
    }

    const holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      symbol: normalizedSymbol,
      holding_type: formData.holding_type as UserHolding['holding_type'],
      quantity,
      purchase_price: purchasePrice,
      purchase_date: formData.purchase_date || undefined,
      sector: formData.sector.trim() || undefined,
      market: formData.market.trim() || undefined,
      currency: formData.currency || activeCurrency || 'SEK'
    };

    if (quantity !== undefined && purchasePrice !== undefined && Number.isFinite(purchasePrice)) {
      const calculatedValue = Math.round(quantity * purchasePrice * 100) / 100;
      holdingData.current_value = calculatedValue;
    }

    if (activePrice !== null) {
      holdingData.current_price_per_unit = activePrice;
      holdingData.price_currency = activeCurrency ?? holdingData.currency;

      if (quantity !== undefined && typeof holdingData.current_value !== 'number') {
        const computedCurrentValue = Math.round(quantity * activePrice * 100) / 100;
        holdingData.current_value = computedCurrentValue;
      }
    } else if (matchedTicker && typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0) {
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
      setQuoteState({ status: 'idle', symbol: null, data: null, error: null });
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetDialogState();
      setQuoteState({ status: 'idle', symbol: null, data: null, error: null });
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
              <Input
                id="symbol"
                list="ticker-suggestions"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder={tickersLoading ? 'Hämtar förslag...' : 't.ex. VOLV-B'}
                required
              />
              {tickersError && (
                <p className="text-sm text-muted-foreground">{tickersError}</p>
              )}
            </div>
          </div>
          <datalist id="ticker-suggestions">
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
            <Label htmlFor="alpha_price">Aktuellt pris (Alpha Vantage)</Label>
            <Input
              id="alpha_price"
              value={quotePriceDisplay}
              readOnly
              placeholder={isQuoteLoading ? 'Hämtar pris från Alpha Vantage...' : 'Skriv en symbol för att hämta pris'}
            />
            <p className="text-xs text-muted-foreground">
              {isQuoteLoading
                ? 'Hämtar pris från Alpha Vantage baserat på den angivna symbolen...'
                : quotePriceDisplay
                  ? 'Priset hämtas från Alpha Vantage och kan justeras innan du sparar.'
                  : 'Priset hämtas automatiskt från Alpha Vantage när du skriver in en symbol.'}
            </p>
            {quoteChangePercent !== null && (
              <p className="text-xs text-muted-foreground">
                {`Senaste förändring: ${quoteChangePercent.toFixed(2)}%`}
              </p>
            )}
            {quoteError && (
              <p className="text-sm text-destructive">{quoteError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Köpdatum</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sektor</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                placeholder="t.ex. Bilar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="market">Marknad</Label>
            <Input
              id="market"
              value={formData.market}
              onChange={(e) => handleInputChange('market', e.target.value)}
              placeholder="t.ex. NASDAQ Stockholm"
            />
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
