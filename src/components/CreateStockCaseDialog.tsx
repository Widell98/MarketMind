
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { Upload, TrendingUp, X } from 'lucide-react';

interface CreateStockCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateStockCaseDialog: React.FC<CreateStockCaseDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    sector: '',
    currency: 'SEK',
    timeframe: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadImage } = useStockCaseOperations();

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
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa ett case",
        variant: "destructive"
      });
      return;
    }

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
      let imageUrl = null;
      
      // Handle image upload if file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('stock_cases')
        .insert({
          title: formData.title,
          company_name: formData.company_name,
          description: formData.description,
          entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
          target_price: formData.target_price ? parseFloat(formData.target_price) : null,
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
          sector: formData.sector || null,
          currency: formData.currency,
          image_url: imageUrl,
          user_id: user.id,
          is_public: true,
          ai_generated: false,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Framgång!",
        description: "Ditt aktiecase har skapats framgångsrikt",
      });

      // Reset form
      setFormData({
        title: '',
        company_name: '',
        description: '',
        entry_price: '',
        target_price: '',
        stop_loss: '',
        sector: '',
        currency: 'SEK',
        timeframe: ''
      });
      setImageFile(null);
      setImagePreview(null);

      onClose();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating stock case:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa aktiecase. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Skapa nytt aktiecase
          </DialogTitle>
          <DialogDescription>
            Dela dina investeringsidéer med communityn. Fyll i detaljerna nedan för att skapa ditt case.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="t.ex. Bullish på Tesla för Q4"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Företag *</Label>
              <Input
                id="company_name"
                placeholder="t.ex. Tesla Inc"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning *</Label>
            <Textarea
              id="description"
              placeholder="Beskriv din investeringsanalys och varför du tror på detta case..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_price">Inköpspris</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.entry_price}
                onChange={(e) => handleInputChange('entry_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_price">Målpris</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.target_price}
                onChange={(e) => handleInputChange('target_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stop_loss">Stop Loss</Label>
              <Input
                id="stop_loss"
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
              <Label htmlFor="sector">Sektor</Label>
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
              <Label htmlFor="currency">Valuta</Label>
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
              <Label htmlFor="image-upload">Ladda upp bild</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="image-upload"
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

            <div className="space-y-2">
              <Label htmlFor="timeframe">Tidsram</Label>
              <Select value={formData.timeframe} onValueChange={(value) => handleInputChange('timeframe', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj tidsram" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="1M">1M (Månadsvis)</SelectItem>
                  <SelectItem value="1W">1W (Veckovis)</SelectItem>
                  <SelectItem value="1D">1D (Dagligen)</SelectItem>
                  <SelectItem value="4H">4H (4 timmar)</SelectItem>
                  <SelectItem value="2H">2H (2 timmar)</SelectItem>
                  <SelectItem value="1H">1H (60 min)</SelectItem>
                  <SelectItem value="30M">30M (30 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(imagePreview || imageFile) && (
              <div className="relative">
                <img
                  src={imagePreview || ''}
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Skapar...' : 'Skapa Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStockCaseDialog;
