
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
import { supabase } from '@/integrations/supabase/client';

type SheetTicker = {
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

interface AddHoldingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  initialData?: any;
}

const AddHoldingDialog: React.FC<AddHoldingDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialData
}) => {
  const { tickers, isLoading: tickersLoading, error: tickersError } = useSheetTickers();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    symbol: initialData?.symbol || '',
    holding_type: initialData?.holding_type === 'recommendation' ? 'stock' : (initialData?.holding_type || 'stock'),
    quantity: '',
    purchase_price: initialData?.purchase_price?.toString() || '',
    purchase_date: '',
    sector: initialData?.sector || '',
    market: initialData?.market || '',
    currency: initialData?.currency || 'SEK'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [priceOverridden, setPriceOverridden] = useState(false);
  const [currencyOverridden, setCurrencyOverridden] = useState(false);
  const [nameOverridden, setNameOverridden] = useState(false);

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

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        symbol: initialData.symbol || '',
        holding_type: initialData.holding_type === 'recommendation' ? 'stock' : (initialData.holding_type || 'stock'),
        quantity: '',
        purchase_price: initialData.purchase_price?.toString() || '',
        purchase_date: '',
        sector: initialData.sector || '',
        market: initialData.market || '',
        currency: initialData.currency || 'SEK'
      });
      setPriceOverridden(Boolean(initialData.purchase_price));
      setCurrencyOverridden(Boolean(initialData.currency));
      setNameOverridden(Boolean(initialData.name));
    } else {
      setPriceOverridden(false);
      setCurrencyOverridden(false);
      setNameOverridden(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!matchedTicker || nameOverridden) {
      return;
    }

    const resolvedName = matchedTicker.name?.trim() || matchedTicker.symbol;

    setFormData((prev) => {
      if (prev.name === resolvedName) {
        return prev;
      }

      return {
        ...prev,
        name: resolvedName,
      };
    });
  }, [matchedTicker, nameOverridden]);

  useEffect(() => {
    if (!matchedTicker || priceOverridden) {
      return;
    }

    if (typeof matchedTicker.price !== 'number' || !Number.isFinite(matchedTicker.price) || matchedTicker.price <= 0) {
      return;
    }

    const nextPrice = matchedTicker.price.toString();

    setFormData((prev) => {
      if (prev.purchase_price === nextPrice) {
        return prev;
      }

      return {
        ...prev,
        purchase_price: nextPrice,
      };
    });
  }, [matchedTicker, priceOverridden]);

  useEffect(() => {
    setPriceOverridden(false);
    setCurrencyOverridden(false);
  }, [matchedTicker?.symbol]);

  useEffect(() => {
    if (!matchedTicker?.currency || currencyOverridden) {
      return;
    }

    const normalizedCurrency = matchedTicker.currency.toUpperCase();
    setFormData((prev) => {
      if (prev.currency === normalizedCurrency) {
        return prev;
      }

      return {
        ...prev,
        currency: normalizedCurrency,
      };
    });
  }, [matchedTicker?.currency, currencyOverridden]);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'name') {
      setNameOverridden(true);
    }
    if (field === 'symbol') {
      if (symbolError) {
        setSymbolError(null);
      }
      setPriceOverridden(false);
      setCurrencyOverridden(false);
      setNameOverridden(false);
    }
    if (field === 'purchase_price') {
      setPriceOverridden(true);
    }
    if (field === 'currency') {
      setCurrencyOverridden(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!normalizedSymbol || !tickerLookup.has(normalizedSymbol)) {
      setSymbolError('Tickern finns inte i Google Sheets. Välj en ticker från listan.');
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
      purchase_date: formData.purchase_date || undefined,
      sector: formData.sector.trim() || undefined,
      market: formData.market.trim() || undefined,
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
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        holding_type: 'stock',
        quantity: '',
        purchase_price: '',
        purchase_date: '',
        sector: '',
        market: '',
        currency: 'SEK'
      });
      setSymbolError(null);
      setPriceOverridden(false);
      setCurrencyOverridden(false);
      setNameOverridden(false);
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        symbol: '',
        holding_type: 'stock',
        quantity: '',
        purchase_price: '',
        purchase_date: '',
        sector: '',
        market: '',
        currency: 'SEK'
      });
      setSymbolError(null);
      setPriceOverridden(false);
      setCurrencyOverridden(false);
      setNameOverridden(false);

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
