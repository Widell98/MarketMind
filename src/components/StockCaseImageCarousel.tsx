import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Eye, History, Trash2 } from 'lucide-react';
import { useStockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StockCaseImageCarouselProps {
  stockCaseId: string;
  currentImageUrl?: string | null;
  onImageChange?: (imageUrl: string) => void;
  caseOwnerId?: string;
}

const StockCaseImageCarousel: React.FC<StockCaseImageCarouselProps> = ({
  stockCaseId,
  currentImageUrl,
  onImageChange,
  caseOwnerId
}) => {
  const { user } = useAuth();
  const { images, loading, currentImageIndex, setCurrentImageIndex, setCurrentImage, deleteImage, refetch } = useStockCaseImageHistory(stockCaseId);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const isOwner = user && caseOwnerId && user.id === caseOwnerId;

  // Update parent when current image changes
  useEffect(() => {
    if (images.length > 0 && onImageChange) {
      const currentImage = images[currentImageIndex];
      if (currentImage && currentImage.image_url !== currentImageUrl) {
        onImageChange(currentImage.image_url);
      }
    }
  }, [currentImageIndex, images, onImageChange, currentImageUrl]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleSetAsCurrent = async () => {
    const currentImage = images[currentImageIndex];
    if (currentImage && setCurrentImage) {
      await setCurrentImage(currentImage.id);
    }
  };

  const handleDelete = async () => {
    if (imageToDelete) {
      try {
        await deleteImage(imageToDelete);
        setImageToDelete(null);
        await refetch();
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const ExpandableText = ({ text, maxLength = 100 }: { text: string; maxLength?: number }) => {
    if (text.length <= maxLength) {
      return <span>{text}</span>;
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {text.substring(0, maxLength)}...{' '}
            <span className="text-blue-600 dark:text-blue-400 underline inline-flex items-center">
              <Eye className="w-3 h-3 ml-1" />
              Läs mer
            </span>
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fullständig beskrivning</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Show carousel even with just one image to display history info
  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentImageIndex];

  return (
    <>
      <Card className="bg-background/95 backdrop-blur-sm border-muted/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bildhistorik</span>
                <Badge variant="secondary" className="text-xs">
                  {images.length} bilder
                </Badge>
              </div>
              
              {/* Delete button for owners */}
              {isOwner && currentImage && !currentImage.is_current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageToDelete(currentImage.id)}
                  className="text-red-600 hover:text-red-700 p-1 h-auto"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Navigation Controls - only show if more than one image */}
            {images.length > 1 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentImageIndex === 0}
                  className="px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1 min-w-0">
                  <div className="bg-muted/30 rounded-lg p-3 border border-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(currentImage?.created_at || '')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {currentImageIndex + 1}/{images.length}
                        </Badge>
                        {currentImage?.is_current && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Nuvarande
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {currentImage?.description ? (
                      <div className="text-sm text-muted-foreground">
                        <ExpandableText text={currentImage.description} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Ingen beskrivning
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentImageIndex === images.length - 1}
                  className="px-3"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Single image info for when there's only one image */}
            {images.length === 1 && (
              <div className="bg-muted/30 rounded-lg p-3 border border-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(currentImage?.created_at || '')}
                    </span>
                  </div>
                  
                  {currentImage?.is_current && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Nuvarande
                    </Badge>
                  )}
                </div>
                
                {currentImage?.description ? (
                  <div className="text-sm text-muted-foreground">
                    <ExpandableText text={currentImage.description} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Ingen beskrivning
                  </p>
                )}
              </div>
            )}

            {/* Set as current button for owners */}
            {isOwner && currentImage && !currentImage.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetAsCurrent}
                className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              >
                Markera som nuvarande bild
              </Button>
            )}

            {/* Thumbnail strip - only show if more than one image */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary shadow-md' 
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`Historisk bild ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.is_current && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort bild</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna bild från historiken? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StockCaseImageCarousel;