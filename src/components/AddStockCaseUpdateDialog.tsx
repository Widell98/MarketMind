import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, PlusCircle } from 'lucide-react';
import { useStockCaseUpdates } from '@/hooks/useStockCaseUpdates';

interface AddStockCaseUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockCaseId: string;
  onSuccess?: () => void;
}

const AddStockCaseUpdateDialog: React.FC<AddStockCaseUpdateDialogProps> = ({ 
  isOpen, 
  onClose, 
  stockCaseId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { createUpdate, isSubmitting } = useStockCaseUpdates(stockCaseId);

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
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
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
    const fileInput = document.getElementById('update-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      return;
    }

    try {
      await createUpdate({
        title: formData.title,
        description: formData.description,
        imageFile
      });

      // Reset form
      setFormData({
        title: '',
        description: ''
      });
      setImageFile(null);
      setImagePreview(null);
      
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: ''
    });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Lägg till uppdatering
          </DialogTitle>
          <DialogDescription>
            Lägg till en ny analys eller uppdatering till ditt aktiecase med bild och beskrivning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-title">Titel för uppdatering *</Label>
            <Input
              id="update-title"
              placeholder="t.ex. Q4 Resultat - Bättre än förväntat"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-description">Analys & Beskrivning *</Label>
            <Textarea
              id="update-description"
              placeholder="Beskriv vad som har hänt sedan senast, nya insikter, resultat eller förändringar i din analys..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-image-upload">Ny bild (valfritt)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="update-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ladda upp en ny bild som visar nuvarande status. Max 5MB.
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title || !formData.description}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Lägger till...' : 'Lägg till uppdatering'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockCaseUpdateDialog;