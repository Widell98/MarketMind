
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Eye } from 'lucide-react';
import { StockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';
import { useAuth } from '@/contexts/AuthContext';

interface ImageHistoryNavigationProps {
  images: StockCaseImageHistory[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSetCurrent?: (imageId: string) => void;
  canEdit?: boolean;
  caseOwnerId?: string; // Add this prop to identify the case owner
}

const ImageHistoryNavigation: React.FC<ImageHistoryNavigationProps> = ({
  images,
  currentIndex,
  onIndexChange,
  onSetCurrent,
  canEdit = false,
  caseOwnerId
}) => {
  const { user } = useAuth();
  
  if (images.length <= 1) return null;

  const currentImage = images[currentIndex];
  
  // Check if current user is the case owner
  const isOwner = user && caseOwnerId && user.id === caseOwnerId;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  // Component for expandable text
  const ExpandableText = ({ text, maxLength = 80 }: { text: string; maxLength?: number }) => {
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
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
              Image History
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {formatDate(currentImage?.created_at || '')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Badge variant="outline" className="bg-white dark:bg-gray-800 text-xs px-2 py-1">
            {currentIndex + 1}/{images.length}
          </Badge>
          {currentImage?.is_current && (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1 hidden sm:flex">
              <CheckCircle className="w-3 h-3 mr-1" />
              Current
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 sm:px-3"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 text-center px-2 sm:px-4 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-600">
            {currentImage?.description ? (
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                <ExpandableText text={currentImage.description} />
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                No description
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 sm:px-3"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Only show "Mark as current" button if user is the case owner */}
      {isOwner && onSetCurrent && !currentImage?.is_current && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetCurrent(currentImage.id)}
            className="w-full bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 text-xs sm:text-sm"
          >
            Mark as current image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageHistoryNavigation;
