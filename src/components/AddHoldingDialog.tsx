
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
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { UserHolding } from '@/hooks/useUserHoldings';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';

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
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { validateAndPriceHolding, getCurrentPrice } = useRealTimePricing();

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
  };

  const fetchCurrentPrice = async () => {
    if (!formData.symbol.trim()) return;
    
    setFetchingPrice(true);
    const price = await getCurrentPrice(formData.symbol.trim(), formData.currency);
    setCurrentPrice(price);
    
    if (price && !formData.purchase_price) {
      setFormData(prev => ({
        ...prev,
        purchase_price: price.toString()
      }));
    }
    setFetchingPrice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    
    let holdingData = {
      name: formData.name.trim(),
      symbol: formData.symbol.trim() || undefined,
      holding_type: formData.holding_type as UserHolding['holding_type'],
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
      purchase_date: formData.purchase_date || undefined,
      sector: formData.sector.trim() || undefined,
      market: formData.market.trim() || undefined,
      currency: formData.currency || 'SEK'
    };

    // Get real-time pricing and calculate current value
    const pricedData = await validateAndPriceHolding(holdingData);
    holdingData = { ...holdingData, ...pricedData };

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
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder="t.ex. VOLV-B"
              />
            </div>
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
