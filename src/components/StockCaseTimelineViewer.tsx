import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { History, Clock, Image as ImageIcon, Trash2, FileText, ChevronDown, ChevronUp, Edit3, ArrowLeft } from 'lucide-react';
import { useStockCaseUpdates, StockCaseUpdate } from '@/hooks/useStockCaseUpdates';
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
  const { user } = useAuth();
  const { updates, isLoading, deleteUpdate } = useStockCaseUpdates(stockCaseId);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
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
    ...updates.map(update => ({ ...update, isOriginal: false }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Use selected version or latest version (first in timeline)
  const displayVersion = selectedVersion || timeline[0];
  const isViewingLatest = !selectedVersion || selectedVersion.id === timeline[0]?.id;
  const hasHistory = timeline.length > 1;

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

  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version);
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const handleBackToLatest = () => {
    setSelectedVersion(null);
    if (onVersionSelect) {
      onVersionSelect(timeline[0]);
    }
  };

  const handleDelete = async () => {
    if (updateToDelete) {
      try {
        await deleteUpdate(updateToDelete);
        // If we deleted the currently selected version, go back to latest
        if (selectedVersion && selectedVersion.id === updateToDelete) {
          handleBackToLatest();
        }
        setUpdateToDelete(null);
      } catch (error) {
        console.error('Error deleting update:', error);
      }
    }
  };

  const canDelete = user && displayVersion && !displayVersion.isOriginal && displayVersion.user_id === user.id;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content Area - Focus on Latest/Selected Version */}
      <div className="space-y-4">
        {/* Version Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isViewingLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToLatest}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka till senaste
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={isViewingLatest ? "default" : "secondary"}>
                {displayVersion?.isOriginal ? 'Original version' : 
                 isViewingLatest ? 'Senaste version' : 'Historisk version'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {displayVersion && formatRelativeDate(displayVersion.created_at)}
              </span>
            </div>
          </div>
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUpdateToDelete(displayVersion.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Ta bort
            </Button>
          )}
        </div>

        {/* Main Image */}
        {displayVersion?.image_url && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={displayVersion.image_url}
              alt={displayVersion.title || ''}
              className="w-full h-full object-cover"
            />
            {!isViewingLatest && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/70 text-white">
                  <History className="w-3 h-3 mr-1" />
                  Historisk bild
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Content Description */}
        {displayVersion?.description && (
          <Card>
            <CardContent className="pt-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">
                  {displayVersion.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* History Section */}
      {hasHistory && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Versionshistorik</h3>
              <Badge variant="outline" className="text-xs">
                {timeline.length - 1} tidigare {timeline.length - 1 === 1 ? 'version' : 'versioner'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1"
            >
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showHistory ? 'Dölj historik' : 'Visa historik'}
            </Button>
          </div>

          {/* Compact History Summary */}
          {!showHistory && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {timeline.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id}
                        className="w-8 h-8 rounded-full bg-background border-2 border-background flex items-center justify-center text-xs font-medium"
                      >
                        {item.isOriginal ? <FileText className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      </div>
                    ))}
                    {timeline.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{timeline.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Senast uppdaterad {formatRelativeDate(timeline[0]?.created_at)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                >
                  Utforska historik
                </Button>
              </div>
            </div>
          )}

          {/* Expanded History Timeline */}
          {showHistory && (
            <div className="space-y-4">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border"></div>
                
                {timeline.map((item, index) => {
                  const isSelected = selectedVersion?.id === item.id || (isViewingLatest && index === 0);
                  const canDeleteItem = user && !item.isOriginal && item.user_id === user.id;
                  
                  return (
                    <div key={item.id} className="relative flex gap-4 pb-6">
                      {/* Timeline Dot */}
                      <div className={`relative z-10 w-12 h-12 rounded-full border-4 ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'bg-background border-border'
                      } flex items-center justify-center`}>
                        {item.isOriginal ? (
                          <FileText className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        ) : (
                          <ImageIcon className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        )}
                      </div>

                      {/* Timeline Content Card */}
                      <div
                        className={`flex-1 cursor-pointer transition-all duration-200 ${
                          isSelected ? 'transform scale-[1.02]' : 'hover:transform hover:scale-[1.01]'
                        }`}
                        onClick={() => handleVersionSelect(item)}
                      >
                        <Card className={`${
                          isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={item.isOriginal ? "secondary" : "outline"} className="text-xs">
                                    {item.isOriginal ? 'Original' : `Uppdatering ${timeline.length - index}`}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(item.created_at)}
                                  </span>
                                </div>
                                
                                {item.title && index > 0 && (
                                  <h4 className="font-medium text-sm line-clamp-1">
                                    {item.title}
                                  </h4>
                                )}
                                
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                {item.image_url && (
                                  <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                                    <img
                                      src={item.image_url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                {canDeleteItem && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUpdateToDelete(item.id);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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