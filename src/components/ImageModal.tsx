
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 bg-black/95 border-none overflow-hidden">
        <DialogTitle className="sr-only">Zoomed image view - {altText}</DialogTitle>
        
        {/* Control bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 border border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-white text-sm font-mono min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-white/30 mx-1"></div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 bg-black/70 hover:bg-black/80 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Image container */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-none max-h-none transition-transform duration-200 ease-out select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              maxWidth: zoom === 1 ? '95vw' : 'none',
              maxHeight: zoom === 1 ? '90vh' : 'none',
              width: zoom === 1 ? 'auto' : '90vw',
              height: zoom === 1 ? 'auto' : 'auto',
              imageRendering: 'high-quality',
              imageResolution: 'from-image'
            }}
            draggable={false}
          />
        </div>

        {/* Instructions */}
        {zoom > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg border border-white/20">
            Drag to pan • Scroll to zoom
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
