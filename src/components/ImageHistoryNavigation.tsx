
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { StockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';

interface ImageHistoryNavigationProps {
  images: StockCaseImageHistory[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSetCurrent?: (imageId: string) => void;
  canEdit?: boolean;
}

const ImageHistoryNavigation: React.FC<ImageHistoryNavigationProps> = ({
  images,
  currentIndex,
  onIndexChange,
  onSetCurrent,
  canEdit = false
}) => {
  if (images.length <= 1) return null;

  const currentImage = images[currentIndex];

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
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bildhistorik
          </span>
          <Badge variant="outline">
            {currentIndex + 1} av {images.length}
          </Badge>
        </div>
        
        {currentImage?.is_current && (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aktuell
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(currentImage?.created_at || '')}
          </div>
          {currentImage?.description && (
            <div className="text-xs text-gray-500 mt-1">
              {currentImage.description}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {canEdit && onSetCurrent && !currentImage?.is_current && (
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetCurrent(currentImage.id)}
            className="w-full"
          >
            Markera som aktuell bild
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageHistoryNavigation;
