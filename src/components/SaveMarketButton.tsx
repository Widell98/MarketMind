import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  X,
  Tag,
  Save
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface SaveMarketButtonProps {
  marketId: string;
  marketTitle?: string;
  compact?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
  onSaveSuccess?: () => void;
}

const SaveMarketButton: React.FC<SaveMarketButtonProps> = ({
  marketId,
  marketTitle = '',
  compact = false,
  variant = 'outline',
  size = 'sm',
  showText = false,
  className = '',
  onSaveSuccess
}) => {
  const { user } = useAuth();
  const { savedItems, saveOpportunity, removeOpportunity, isItemSaved, refetch } = useSavedOpportunities();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSaved = isItemSaved('prediction_market', marketId);

  const predefinedTags = [
    'Politik', 
    'Ekonomi', 
    'Teknologi', 
    'Sport', 
    'Krypto', 
    'Val', 
    'Räntor',
    'Aktiemarknad',
    'Kortsiktig',
    'Långsiktig'
  ];

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att spara marknader.",
        variant: "destructive",
      });
      return;
    }

    if (isSaved) {
      // Remove from saved
      const savedItem = savedItems.find(
        item => item.item_id === marketId && item.item_type === 'prediction_market'
      );
      if (savedItem) {
        setIsLoading(true);
        try {
          await removeOpportunity(savedItem.id);
          await refetch();
          queryClient.invalidateQueries({ queryKey: ['saved-prediction-markets'] });
          toast({
            title: "Borttagen från sparade",
            description: `${marketTitle || 'Marknaden'} har tagits bort från dina sparade marknader.`,
          });
          if (onSaveSuccess) {
            onSaveSuccess();
          }
        } catch (error) {
          toast({
            title: "Fel",
            description: "Kunde inte ta bort. Försök igen.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Open dialog for saving with tags and notes
      setShowDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    try {
      await saveOpportunity('prediction_market', marketId, tags, notes || null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['saved-prediction-markets'] });
      
      toast({
        title: "Sparad!",
        description: `${marketTitle || 'Marknaden'} har sparats till dina marknader.`,
      });
      
      setShowDialog(false);
      setTags([]);
      setNewTag('');
      setNotes('');
      
      // Call the success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag(newTag.trim());
    }
  };

  if (!user) {
    return null; // Don't show save button if not logged in
  }

  return (
    <>
      <Button
        variant={isSaved ? "default" : variant}
        size={size}
        onClick={handleSave}
        disabled={isLoading}
        className={`flex items-center gap-1.5 ${compact ? 'h-8 px-3' : ''} ${className}`}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4" />
            {showText && !compact && "Sparad"}
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            {showText && !compact && "Spara"}
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spara marknad</DialogTitle>
            <DialogDescription>
              Lägg till taggar och anteckningar för att enkelt hitta denna marknad senare.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Predefined tags */}
            <div>
              <Label className="text-sm font-medium">Snabba taggar</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {predefinedTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={tags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    className="h-7 text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom tag input */}
            <div>
              <Label htmlFor="new-tag" className="text-sm font-medium">Lägg till egen tagg</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="new-tag"
                  placeholder="Skriv en tagg..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => addTag(newTag.trim())}
                  disabled={!newTag.trim() || tags.includes(newTag.trim())}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selected tags */}
            {tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Valda taggar</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Anteckningar (valfritt)</Label>
              <Textarea
                id="notes"
                placeholder="Varför är denna marknad intressant? Dina tankar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleConfirmSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaveMarketButton;

