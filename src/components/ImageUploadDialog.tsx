
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Plus } from 'lucide-react';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadDialogProps {
  stockCaseId: string;
  onImageAdded: (imageUrl: string, description?: string) => void;
  canEdit: boolean;
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({ 
  stockCaseId, 
  onImageAdded, 
  canEdit 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { uploadImage } = useStockCaseOperations();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(selectedFile);
      onImageAdded(imageUrl, description);
      
      toast({
        title: "Framgång",
        description: "Ny bild har lagts till i historiken",
      });

      // Reset form
      setSelectedFile(null);
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp bilden",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Lägg till bild
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lägg till ny bild i historiken</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Välj bild</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Beskrivning (valfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="T.ex. 'Uppdatering efter Q3 resultat'"
              className="mt-1"
              rows={3}
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vald fil: {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Storlek: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Laddar upp...' : 'Ladda upp'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
