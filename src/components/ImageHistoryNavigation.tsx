
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
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Bildhistorik
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(currentImage?.created_at || '')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white dark:bg-gray-800">
            {currentIndex + 1} av {images.length}
          </Badge>
          {currentImage?.is_current && (
            <Badge className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Aktuell
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 text-center px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            {currentImage?.description ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {currentImage.description}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Ingen beskrivning
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {canEdit && onSetCurrent && !currentImage?.is_current && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetCurrent(currentImage.id)}
            className="w-full bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Markera som aktuell bild
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageHistoryNavigation;
