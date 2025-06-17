
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/98 border-none overflow-hidden">
        <DialogTitle className="sr-only">Zoomed image view</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </Button>
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '85vh',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
