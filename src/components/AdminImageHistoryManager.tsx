
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { StockCaseImageHistory, useStockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AdminImageHistoryManagerProps {
  stockCaseId: string;
  canEdit: boolean;
}

const AdminImageHistoryManager: React.FC<AdminImageHistoryManagerProps> = ({
  stockCaseId,
  canEdit
}) => {
  const { images, deleteImage, refetch } = useStockCaseImageHistory(stockCaseId);
  const { toast } = useToast();
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!canEdit) return;

    try {
      setDeletingImageId(imageId);

      await deleteImage(imageId);
      
      // Force a manual refetch to ensure the UI updates
      await refetch();
      
      toast({
        title: "Framgång",
        description: "Bilden har raderats från historiken",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera bilden. Kontrollera att du har behörighet.",
        variant: "destructive",
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  if (!canEdit || images.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Hantera Bildhistorik ({images.length} bilder)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {images.map((image) => (
            <div key={image.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <img
                src={image.image_url}
                alt={image.description || 'Stock case image'}
                className="w-20 h-20 object-cover rounded-md"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">
                    {formatDate(image.created_at)}
                  </span>
                  {image.is_current && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktuell
                    </Badge>
                  )}
                </div>
                
                {image.description && (
                  <p className="text-sm text-gray-700 mb-2">
                    {image.description}
                  </p>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingImageId === image.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Radera bild från historik
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill radera denna bild från historiken? 
                      Denna åtgärd kan inte ångras.
                      {image.is_current && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <strong>Varning:</strong> Detta är den aktuella bilden för caset.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteImage(image.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Radera bild
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminImageHistoryManager;
