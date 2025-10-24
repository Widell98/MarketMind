import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { History, Clock, Image as ImageIcon, Trash2, FolderOpen, FileText } from 'lucide-react';
import { useStockCaseUpdates, StockCaseUpdate } from '@/hooks/useStockCaseUpdates';
import { CASE_IMAGE_PLACEHOLDER, getOptimizedCaseImage, handleCaseImageError } from '@/utils/imageUtils';
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
  onVersionSelect?: (version: any) => void;
  compact?: boolean;
}
const StockCaseHistoryViewer: React.FC<StockCaseHistoryViewerProps> = ({
  stockCaseId,
  originalStockCase,
  onVersionSelect,
  compact = false
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
  }))].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const currentItem = timeline[currentIndex];
  const optimizedImageSources = getOptimizedCaseImage(currentItem?.image_url);
  const displayImageSrc = optimizedImageSources?.src ?? currentItem?.image_url ?? CASE_IMAGE_PLACEHOLDER;
  const displayImageSrcSet = optimizedImageSources?.srcSet;
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
    return <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>;
  }
  if (!timeline.length) {
    return <Card>
        <CardContent className="text-center py-8">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Ingen historik tillgänglig</p>
        </CardContent>
      </Card>;
  }
  const handleVersionChange = (value: string) => {
    const index = parseInt(value);
    setCurrentIndex(index);
    if (onVersionSelect) {
      onVersionSelect(timeline[index]);
    }
  };
  if (compact) {
    return <>
        <div className="bg-background/95 backdrop-blur-sm border border-muted/50 rounded-lg shadow-sm">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Versionshistorik</span>
                <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground border-muted">
                  {timeline.length} versioner
                </Badge>
              </div>
              {canDelete && <Button variant="ghost" size="sm" onClick={e => {
                e.preventDefault();
                setUpdateToDelete(currentItem.id);
              }} className="text-red-600 hover:text-red-700 p-1 h-auto">
                <Trash2 className="w-3 h-3" />
              </Button>}
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={currentIndex.toString()} onValueChange={handleVersionChange}>
                <SelectTrigger className="w-48 h-9 text-sm bg-background/50 border-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border shadow-lg">
                  {timeline.map((item, index) => <SelectItem key={item.id} value={index.toString()}>
                      <div className="flex items-center gap-2">
                        {item.isOriginal ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        <span className="text-xs">
                          {item.isOriginal ? 'Original' : `Uppdatering ${index}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.created_at).split(' ')[0]}
                        </span>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Badge variant={currentItem.isOriginal ? "secondary" : "outline"} className="text-xs bg-muted/30 border-muted/50">
                  {currentItem.isOriginal ? 'Original' : 'Uppdatering'}
                </Badge>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(currentItem.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

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
      </>;
  }
  return <>
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
              {canDelete && <Button variant="outline" size="sm" onClick={e => {
              e.preventDefault();
              setUpdateToDelete(currentItem.id);
            }} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Select value={currentIndex.toString()} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-full h-10 min-h-[2.5rem] transition-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border shadow-lg">
              {timeline.map((item, index) => <SelectItem key={item.id} value={index.toString()}>
                  <div className="flex items-center gap-2">
                    {item.isOriginal ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    <span>
                      {item.isOriginal ? 'Original' : `Uppdatering ${index}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* Current content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {currentItem.title}
              </h3>
              
              {currentItem.description && <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {currentItem.description}
                  </p>
                </div>}
            </div>

            {/* Image */}
            {displayImageSrc && <div className="relative">
                <img
                  src={displayImageSrc}
                  srcSet={displayImageSrcSet}
                  alt={`${currentItem.title} - ${formatDate(currentItem.created_at)}`}
                  className="w-full max-h-96 object-cover rounded-lg border"
                  loading="lazy"
                  decoding="async"
                  onError={handleCaseImageError}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {currentItem.isOriginal ? 'Original bild' : 'Uppdaterad bild'}
                  </Badge>
                </div>
              </div>}
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
    </>;
};
export default StockCaseHistoryViewer;
