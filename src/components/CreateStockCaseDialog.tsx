
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
import { Upload, TrendingUp } from 'lucide-react';

interface CreateStockCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateStockCaseDialog: React.FC<CreateStockCaseDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    sector: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          image_url: formData.image_url || null,
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
        image_url: ''
      });

      onClose();
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
              <Label htmlFor="entry_price">Inköpspris (SEK)</Label>
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
              <Label htmlFor="target_price">Målpris (SEK)</Label>
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
              <Label htmlFor="stop_loss">Stop Loss (SEK)</Label>
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
              <Label htmlFor="image_url">Bild URL</Label>
              <Input
                id="image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
              />
            </div>
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
