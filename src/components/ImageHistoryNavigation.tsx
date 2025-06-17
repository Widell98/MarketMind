
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
  variant?: 'compact' | 'full';
}

const ImageHistoryNavigation: React.FC<ImageHistoryNavigationProps> = ({
  images,
  currentIndex,
  onIndexChange,
  onSetCurrent,
  canEdit = false,
  variant = 'full'
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

  if (variant === 'compact') {
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="text-white hover:bg-white/20 disabled:opacity-50 h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 text-white">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
            {currentIndex + 1} / {images.length}
          </Badge>
          {currentImage?.is_current && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className="text-white hover:bg-white/20 disabled:opacity-50 h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bildhistorik
            </span>
          </div>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
            {currentIndex + 1} av {images.length}
          </Badge>
        </div>
        
        {currentImage?.is_current && (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aktuell bild
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-6">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Föregående
        </Button>

        <div className="flex-1 text-center space-y-2">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(currentImage?.created_at || '')}
          </div>
          {currentImage?.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              {currentImage.description}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          Nästa
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {canEdit && onSetCurrent && !currentImage?.is_current && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onSetCurrent(currentImage.id)}
            className="w-full bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            Markera som aktuell bild
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageHistoryNavigation;
