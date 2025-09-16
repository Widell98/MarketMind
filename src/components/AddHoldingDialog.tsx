
import React, { useState, useEffect } from 'react';
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
};

const useSheetTickers = () => {
  const [tickers, setTickers] = useState<SheetTicker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTickers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('list-sheet-tickers');

        if (!isMounted) {
          return;
        }

        if (invokeError) {
          setError(invokeError.message ?? 'Kunde inte hämta tickers.');
          setTickers([]);
          return;
        }

        const list = Array.isArray(data?.tickers)
          ? (data.tickers as SheetTicker[])
          : [];

        setTickers(
          list.map((item) => ({
            symbol: item.symbol,
            name: item.name ?? item.symbol,
          })),
        );
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Kunde inte hämta tickers.');
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
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'symbol' && symbolError) {
      setSymbolError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const normalizedSymbol = formData.symbol.trim().toUpperCase();
    const symbolMatches = tickers.some((ticker) => ticker.symbol.toUpperCase() === normalizedSymbol);

    if (!normalizedSymbol || !symbolMatches) {
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
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            {tickers.map((ticker) => {
              const label = ticker.name && ticker.name !== ticker.symbol
                ? `${ticker.name} (${ticker.symbol})`
                : ticker.symbol;

              return (
                <option
                  key={ticker.symbol}
                  value={ticker.symbol}
                  label={label}
                />
              );
            })}
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
