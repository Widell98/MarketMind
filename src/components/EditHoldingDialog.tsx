
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface EditHoldingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holdingData: Partial<UserHolding>) => void;
  holding: UserHolding | null;
}

type HoldingType = 'stock' | 'fund' | 'crypto' | 'bonds' | 'real_estate' | 'other' | 'recommendation';

const EditHoldingDialog: React.FC<EditHoldingDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  holding
}) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    quantity: '',
    purchase_price: '',
    purchase_date: '',
    sector: '',
    market: '',
    currency: 'SEK',
    holding_type: 'stock' as HoldingType
  });

  useEffect(() => {
    if (holding) {
      setFormData({
        name: holding.name || '',
        symbol: holding.symbol || '',
        quantity: holding.quantity?.toString() || '',
        purchase_price: holding.purchase_price?.toString() || '',
        purchase_date: holding.purchase_date || '',
        sector: holding.sector || '',
        market: holding.market || '',
        currency: holding.currency || 'SEK',
        holding_type: (holding.holding_type as HoldingType) || 'stock'
      });
    }
  }, [holding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const holdingData: Partial<UserHolding> = {
      name: formData.name.trim(),
      symbol: formData.symbol.trim() || undefined,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
      purchase_date: formData.purchase_date || undefined,
      sector: formData.sector.trim() || undefined,
      market: formData.market.trim() || undefined,
      currency: formData.currency,
      holding_type: formData.holding_type
    };

    onSave(holdingData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redigera innehav</DialogTitle>
          <DialogDescription>
            Uppdatera informationen för ditt innehav
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Företagsnamn"
                required
              />
            </div>
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="AAPL"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="holding_type">Typ</Label>
              <Select value={formData.holding_type} onValueChange={(value: HoldingType) => setFormData({ ...formData, holding_type: value })}>
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
            <div>
              <Label htmlFor="currency">Valuta</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
            <div>
              <Label htmlFor="quantity">Antal</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="purchase_price">Inköpspris</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_date">Inköpsdatum</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sector">Sektor</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="Teknologi"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="market">Marknad</Label>
            <Input
              id="market"
              value={formData.market}
              onChange={(e) => setFormData({ ...formData, market: e.target.value })}
              placeholder="Stockholm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button type="submit">
              Spara ändringar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditHoldingDialog;
