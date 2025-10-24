import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { History, Clock, Image as ImageIcon, Trash2, FileText, ChevronLeft, ChevronRight, Edit3, ArrowLeft } from 'lucide-react';
import { useStockCaseUpdates, StockCaseUpdate } from '@/hooks/useStockCaseUpdates';
import { getOptimizedCaseImage } from '@/utils/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
interface StockCaseTimelineViewerProps {
  stockCaseId: string;
  originalStockCase: {
    title: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    user_id: string | null;
  };
  onVersionSelect?: (version: any) => void;
}
const StockCaseTimelineViewer: React.FC<StockCaseTimelineViewerProps> = ({
  stockCaseId,
  originalStockCase,
  onVersionSelect
}) => {
  const {
    user
  } = useAuth();
  const {
    updates,
    isLoading,
    deleteUpdate
  } = useStockCaseUpdates(stockCaseId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);

  // Combine original case with updates for timeline
  const timeline = [{
    id: 'original',
    title: originalStockCase.title,
    description: originalStockCase.description,
    image_url: originalStockCase.image_url,
    created_at: originalStockCase.created_at,
    user_id: originalStockCase.user_id,
    update_type: 'original',
    isOriginal: true
  }, ...updates.map(update => ({
    ...update,
    isOriginal: false
  }))].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Current version based on carousel index
  const currentVersion = timeline[currentIndex];
  const optimizedImageSources = getOptimizedCaseImage(currentVersion?.image_url);
  const hasMultipleVersions = timeline.length > 1;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatRelativeDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: sv
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : timeline.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < timeline.length - 1 ? prev + 1 : 0));
  };

  const goToVersion = (index: number) => {
    setCurrentIndex(index);
    if (onVersionSelect) {
      onVersionSelect(timeline[index]);
    }
  };
  const handleDelete = async () => {
    if (updateToDelete) {
      try {
        await deleteUpdate(updateToDelete);
        // If we deleted the current version, go to latest
        if (currentVersion && currentVersion.id === updateToDelete) {
          setCurrentIndex(0);
        }
        setUpdateToDelete(null);
      } catch (error) {
        console.error('Error deleting update:', error);
      }
    }
  };

  const canDelete = user && currentVersion && !currentVersion.isOriginal && currentVersion.user_id === user.id;
  if (isLoading) {
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with version info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Case innehåll</h2>
          {hasMultipleVersions && (
            <Badge variant="outline" className="text-xs">
              {currentIndex + 1} av {timeline.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={currentIndex === 0 ? "default" : "secondary"}>
              {currentVersion?.isOriginal ? 'Original' : currentIndex === 0 ? 'Senaste version' : 'Historisk version'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentVersion && formatRelativeDate(currentVersion.created_at)}
            </span>
          </div>
          
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setUpdateToDelete(currentVersion.id)} 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Ta bort
            </Button>
          )}
        </div>
      </div>

      {/* Main image carousel */}
      {currentVersion?.image_url && (
        <div className="space-y-3">
          <div className="relative group">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={optimizedImageSources?.src ?? currentVersion.image_url}
                srcSet={optimizedImageSources?.srcSet}
                alt={currentVersion.title || ''}
                className="w-full h-full object-cover transition-all duration-300"
                loading="lazy"
                decoding="async"
              />
              
              {/* Navigation arrows - always visible if multiple versions */}
              {hasMultipleVersions && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToPrevious}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-0 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Version indicator */}
              {currentIndex > 0 && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    <History className="w-3 h-3 mr-1" />
                    Historisk
                  </Badge>
                </div>
              )}

              {/* Version counter */}
              {hasMultipleVersions && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    {currentIndex + 1}/{timeline.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Dots indicator */}
          {hasMultipleVersions && (
            <div className="flex justify-center gap-2">
              {timeline.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToVersion(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentIndex === index 
                      ? 'bg-primary scale-125' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick version selector */}
          {hasMultipleVersions && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {timeline.map((version, index) => (
                <button
                  key={version.id}
                  onClick={() => goToVersion(index)}
                  className={`flex-shrink-0 px-3 py-2 rounded-md text-xs transition-colors ${
                    currentIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {version.isOriginal ? 'Original' : `V${timeline.length - index}`}
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    {formatRelativeDate(version.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content description */}
      {currentVersion?.description && (
        <Card>
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">
                {currentVersion.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default StockCaseTimelineViewer;