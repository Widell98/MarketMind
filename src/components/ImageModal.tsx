
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt: string;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
  title
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title || imageAlt}
          </DialogTitle>
        </DialogHeader>
        <div className="relative w-full">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
