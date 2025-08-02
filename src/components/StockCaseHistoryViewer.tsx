import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { History, Clock, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStockCaseUpdates, StockCaseUpdate } from '@/hooks/useStockCaseUpdates';
import { useAuth } from '@/contexts/AuthContext';

interface StockCaseHistoryViewerProps {
  stockCaseId: string;
  originalStockCase: {
    title: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    user_id: string | null;
  };
}

const StockCaseHistoryViewer: React.FC<StockCaseHistoryViewerProps> = ({
  stockCaseId,
  originalStockCase
}) => {
  const { user } = useAuth();
  const { updates, isLoading, deleteUpdate } = useStockCaseUpdates(stockCaseId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);

  // Combine original case with updates for timeline
  const timeline = [
    {
      id: 'original',
      title: originalStockCase.title,
      description: originalStockCase.description,
      image_url: originalStockCase.image_url,
      created_at: originalStockCase.created_at,
      user_id: originalStockCase.user_id,
      update_type: 'original',
      isOriginal: true
    },
    ...updates.map(update => ({
      ...update,
      isOriginal: false
    }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const currentItem = timeline[currentIndex];
  const canDelete = user && currentItem && !currentItem.isOriginal && currentItem.user_id === user.id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < timeline.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDelete = async () => {
    if (updateToDelete && !currentItem?.isOriginal) {
      try {
        await deleteUpdate(updateToDelete);
        // Adjust index if we deleted the current item
        if (currentIndex >= timeline.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
        setUpdateToDelete(null);
      } catch (error) {
        console.error('Error deleting update:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline.length) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Ingen historik tillgänglig</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historik
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentIndex + 1} av {timeline.length}
              </Badge>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUpdateToDelete(currentItem.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Tidigare
            </Button>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(currentItem.created_at)}
              </span>
              {currentItem.isOriginal && (
                <Badge variant="secondary" className="ml-2">
                  Original
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex === timeline.length - 1}
            >
              Senare
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Current content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {currentItem.title}
              </h3>
              
              {currentItem.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {currentItem.description}
                  </p>
                </div>
              )}
            </div>

            {/* Image */}
            {currentItem.image_url && (
              <div className="relative">
                <img
                  src={currentItem.image_url}
                  alt={`${currentItem.title} - ${formatDate(currentItem.created_at)}`}
                  className="w-full max-h-96 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {currentItem.isOriginal ? 'Original bild' : 'Uppdaterad bild'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Timeline indicators */}
          <div className="flex items-center justify-center space-x-2 pt-4">
            {timeline.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-blue-600' 
                    : index < currentIndex 
                      ? 'bg-blue-300' 
                      : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!updateToDelete} onOpenChange={() => setUpdateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort uppdatering</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna uppdatering? Denna åtgärd kan inte ångras.
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

export default StockCaseHistoryViewer;