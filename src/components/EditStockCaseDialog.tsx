import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { Upload, TrendingUp, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface StockCase {
  id: string;
  title: string;
  company_name: string;
  description: string | null;
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  sector: string | null;
  currency: string | null;
  image_url: string | null;
  target_reached: boolean | null;
  stop_loss_hit: boolean | null;
}

interface EditStockCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  stockCase: StockCase | null;
}

const EditStockCaseDialog: React.FC<EditStockCaseDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  stockCase
}) => {
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    sector: '',
    currency: 'SEK'
  });
  const [targetReached, setTargetReached] = useState(false);
  const [stopLossHit, setStopLossHit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateStockCase, uploadImage } = useStockCaseOperations();

  // Populate form when stockCase changes
  useEffect(() => {
    if (stockCase) {
      setFormData({
        title: stockCase.title || '',
        company_name: stockCase.company_name || '',
        description: stockCase.description || '',
        entry_price: stockCase.entry_price?.toString() || '',
        target_price: stockCase.target_price?.toString() || '',
        stop_loss: stockCase.stop_loss?.toString() || '',
        sector: stockCase.sector || '',
        currency: stockCase.currency || 'SEK'
      });
      setTargetReached(stockCase.target_reached || false);
      setStopLossHit(stockCase.stop_loss_hit || false);
      setImagePreview(stockCase.image_url || null);
    }
  }, [stockCase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Fel filtyp",
          description: "Endast JPG, PNG och WebP-filer är tillåtna",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Fil för stor",
          description: "Maximal filstorlek är 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockCase) return;

    if (!formData.title || !formData.company_name || !formData.description) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla obligatoriska fält",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = stockCase.image_url;
      
      // Handle image upload if new file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const updateData = {
        title: formData.title,
        company_name: formData.company_name,
        description: formData.description,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        sector: formData.sector || null,
        currency: formData.currency,
        image_url: imageUrl,
        target_reached: targetReached,
        stop_loss_hit: stopLossHit
      };

      await updateStockCase(stockCase.id, updateData);

      toast({
        title: "Framgång!",
        description: "Ditt aktiecase har uppdaterats framgångsrikt",
      });

      // Reset form
      setImageFile(null);
      
      onClose();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating stock case:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera aktiecase. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setImageFile(null);
    setImagePreview(stockCase?.image_url || null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Redigera aktiecase
          </DialogTitle>
          <DialogDescription>
            Uppdatera ditt aktiecase med ny information, priser eller bilder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                placeholder="t.ex. Bullish på Tesla för Q4"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-company_name">Företag *</Label>
              <Input
                id="edit-company_name"
                placeholder="t.ex. Tesla Inc"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Beskrivning *</Label>
            <Textarea
              id="edit-description"
              placeholder="Beskriv din investeringsanalys och varför du tror på detta case..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-entry_price">Inköpspris</Label>
              <Input
                id="edit-entry_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.entry_price}
                onChange={(e) => handleInputChange('entry_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-target_price">Målpris</Label>
              <Input
                id="edit-target_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.target_price}
                onChange={(e) => handleInputChange('target_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-stop_loss">Stop Loss</Label>
              <Input
                id="edit-stop_loss"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.stop_loss}
                onChange={(e) => handleInputChange('stop_loss', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sector">Sektor</Label>
              <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj sektor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Teknologi</SelectItem>
                  <SelectItem value="healthcare">Hälsovård</SelectItem>
                  <SelectItem value="finance">Finans</SelectItem>
                  <SelectItem value="energy">Energi</SelectItem>
                  <SelectItem value="industrials">Industri</SelectItem>
                  <SelectItem value="consumer">Konsument</SelectItem>
                  <SelectItem value="materials">Material</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="telecom">Telekom</SelectItem>
                  <SelectItem value="real-estate">Fastigheter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">Valuta</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj valuta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK (Svenska kronor)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-image-upload">Uppdatera bild</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="edit-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Stödda format: JPG, PNG, WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Förhandsvisning"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Case Status Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Case Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="target-reached" 
                  checked={targetReached}
                  onCheckedChange={(checked) => {
                    setTargetReached(checked as boolean);
                    if (checked) setStopLossHit(false); // Only one can be true
                  }}
                />
                <Label htmlFor="target-reached" className="text-sm font-medium cursor-pointer">
                  🎯 Målkurs nådd
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="stop-loss-hit" 
                  checked={stopLossHit}
                  onCheckedChange={(checked) => {
                    setStopLossHit(checked as boolean);
                    if (checked) setTargetReached(false); // Only one can be true
                  }}
                />
                <Label htmlFor="stop-loss-hit" className="text-sm font-medium cursor-pointer">
                  ⚠️ Stoploss taget
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Uppdaterar...' : 'Uppdatera Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStockCaseDialog;