
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

const AddHoldingDialog: React.FC<AddHoldingDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData
}) => {
  const { tickers, isLoading: tickersLoading, error: tickersError, ensureTicker } = useSheetTickers();
  const [dialogState, setDialogState, resetDialogState] = useLocalStorage<AddHoldingFormState>(
    ADD_HOLDING_FORM_STORAGE_KEY,
    createDefaultFormState
  );
  const { formData, priceOverridden, currencyOverridden, nameOverridden } = dialogState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!normalizedSymbol || matchedTicker) {
      return;
    }

    void ensureTicker(normalizedSymbol);
  }, [ensureTicker, matchedTicker, normalizedSymbol]);

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

  const resolvedSheetPrice = matchedTicker && typeof matchedTicker.price === 'number' && Number.isFinite(matchedTicker.price) && matchedTicker.price > 0
    ? matchedTicker.price
    : null;

  const sheetPriceCurrency = matchedTicker?.currency ?? (formData.currency || undefined);

  const sheetPriceDisplay = resolvedSheetPrice !== null
    ? `${formatDisplayPrice(resolvedSheetPrice)}${sheetPriceCurrency ? ` ${sheetPriceCurrency}` : ''}`.trim()
    : '';

  const handleInputChange = (field: string, value: string) => {
    if (field === 'symbol' && symbolError) {
      setSymbolError(null);
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
    if (!formData.name.trim()) return;

    setIsSubmitting(true);

    let resolvedTicker = matchedTicker;

    if (!resolvedTicker && normalizedSymbol) {
      resolvedTicker = await ensureTicker(normalizedSymbol);
    }

    if (!normalizedSymbol || !resolvedTicker) {
      setSymbolError('Tickern kunde inte hittas i Google Sheets eller Alpha Vantage. Kontrollera symbolen och försök igen.');
      setIsSubmitting(false);
      return;
    }

    const quantity = formData.quantity ? parseFloat(formData.quantity) : undefined;
    const purchasePrice = formData.purchase_price ? parseFloat(formData.purchase_price) : undefined;

    const holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      symbol: normalizedSymbol,
      holding_type: formData.holding_type as UserHolding['holding_type'],
      quantity,
      purchase_price: purchasePrice,
      purchase_date: formData.purchase_date || undefined,
      sector: formData.sector.trim() || undefined,
      market: formData.market.trim() || undefined,
      currency: formData.currency || 'SEK'
    };

    if (quantity !== undefined && purchasePrice !== undefined) {
      const calculatedValue = Math.round(quantity * purchasePrice * 100) / 100;
      holdingData.current_value = calculatedValue;
    }

    if (resolvedTicker && typeof resolvedTicker.price === 'number' && Number.isFinite(resolvedTicker.price) && resolvedTicker.price > 0) {
      holdingData.current_price_per_unit = resolvedTicker.price;
      holdingData.price_currency = resolvedTicker.currency ?? holdingData.currency;

      if (quantity !== undefined && typeof holdingData.current_value !== 'number') {
        const computedCurrentValue = Math.round(quantity * resolvedTicker.price * 100) / 100;
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
                list="sheet-tickers"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder={tickersLoading ? 'Hämtar tickers...' : 't.ex. VOLV-B'}
                required
              />
              {symbolError && (
                <p className="text-sm text-destructive">{symbolError}</p>
              )}
              {tickersError && (
                <p className="text-sm text-muted-foreground">{tickersError}</p>
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
            <Label htmlFor="sheet_price">Aktuellt pris (Google Sheets)</Label>
            <Input
              id="sheet_price"
              value={sheetPriceDisplay}
              readOnly
              placeholder={tickersLoading ? 'Hämtar pris...' : 'Välj en ticker för att hämta priset'}
            />
            <p className="text-xs text-muted-foreground">
              {sheetPriceDisplay
                ? 'Priset läggs in som förvalt köppris men kan justeras innan du sparar.'
                : 'Priset hämtas automatiskt när du väljer en ticker från listan.'}
            </p>
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
