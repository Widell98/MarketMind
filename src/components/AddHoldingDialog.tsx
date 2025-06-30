
import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AddHoldingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holdingData: {
    holding_type: string;
    name: string;
    symbol?: string;
    quantity: number;
    current_value: number;
    purchase_price: number;
    purchase_date: string;
    sector?: string;
    currency: string;
  }) => void;
  recommendation?: {
    name: string;
    symbol?: string;
    sector?: string;
  };
}

const AddHoldingDialog: React.FC<AddHoldingDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  recommendation
}) => {
  const [formData, setFormData] = useState({
    holding_type: 'stock',
    name: recommendation?.name || '',
    symbol: recommendation?.symbol || '',
    quantity: '',
    current_value: '',
    purchase_price: '',
    purchase_date: new Date(),
    sector: recommendation?.sector || '',
    currency: 'SEK'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.current_value || !formData.purchase_price) {
      return;
    }

    onAdd({
      holding_type: formData.holding_type,
      name: formData.name,
      symbol: formData.symbol || undefined,
      quantity: parseFloat(formData.quantity),
      current_value: parseFloat(formData.current_value),
      purchase_price: parseFloat(formData.purchase_price),
      purchase_date: formData.purchase_date.toISOString().split('T')[0],
      sector: formData.sector || undefined,
      currency: formData.currency
    });

    // Reset form
    setFormData({
      holding_type: 'stock',
      name: '',
      symbol: '',
      quantity: '',
      current_value: '',
      purchase_price: '',
      purchase_date: new Date(),
      sector: '',
      currency: 'SEK'
    });
    
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      holding_type: 'stock',
      name: recommendation?.name || '',
      symbol: recommendation?.symbol || '',
      quantity: '',
      current_value: '',
      purchase_price: '',
      purchase_date: new Date(),
      sector: recommendation?.sector || '',
      currency: 'SEK'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {recommendation ? 'Lägg till rekommendation som innehav' : 'Lägg till nytt innehav'}
          </DialogTitle>
          <DialogDescription>
            Fyll i uppgifterna för ditt innehav. Alla fält markerade med * är obligatoriska.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holding_type">Typ av innehav *</Label>
            <Select
              value={formData.holding_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, holding_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj typ" />
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
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="t.ex. Apple Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              placeholder="t.ex. AAPL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Antal *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Inköpspris *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">Nuvarande värde *</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inköpsdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.purchase_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.purchase_date ? (
                    format(formData.purchase_date, "PPP", { locale: sv })
                  ) : (
                    <span>Välj datum</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.purchase_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, purchase_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sektor</Label>
            <Input
              id="sector"
              value={formData.sector}
              onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
              placeholder="t.ex. Teknologi"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button type="submit">
              Lägg till innehav
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHoldingDialog;
