
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

interface SaveOpportunityButtonProps {
  itemType: 'stock_case' | 'analysis';
  itemId: string;
  itemTitle?: string;
  compact?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
  onSaveSuccess?: () => void;
}

const SaveOpportunityButton: React.FC<SaveOpportunityButtonProps> = ({
  itemType,
  itemId,
  itemTitle = '',
  compact = false,
  variant = 'outline',
  size = 'default',
  showText = true,
  className = '',
  onSaveSuccess
}) => {
  const { savedItems, saveOpportunity, removeOpportunity, isItemSaved } = useSavedOpportunities();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSaved = isItemSaved(itemType, itemId);

  const predefinedTags = [
    'Hög potential', 
    'Teknologi', 
    'Utdelning', 
    'Tillväxt', 
    'Värde', 
    'Defensiv',
    'Volatil',
    'Långsiktig',
    'Kortsiktig',
    'ESG'
  ];

  const handleSave = async () => {
    if (isSaved) {
      // Remove from saved
      const savedItem = savedItems.find(
        item => item.item_id === itemId && item.item_type === itemType
      );
      if (savedItem) {
        await removeOpportunity(savedItem.id);
        toast({
          title: "Borttagen från sparade",
          description: `${itemTitle} har tagits bort från dina sparade ${itemType === 'stock_case' ? 'stock cases' : 'analyser'}.`,
        });
      }
    } else {
      // Open dialog for saving with tags and notes
      setShowDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    try {
      await saveOpportunity(itemType, itemId, tags, notes);
      
      toast({
        title: "Sparad!",
        description: `${itemTitle} har sparats till dina ${itemType === 'stock_case' ? 'stock cases' : 'analyser'}.`,
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

  return (
    <>
      <Button
        variant={isSaved ? "default" : variant}
        size={size}
        onClick={handleSave}
        className={`flex items-center gap-2 ${compact ? 'h-8 px-3' : ''} ${className}`}
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
            <DialogTitle>Spara till portfölj</DialogTitle>
            <DialogDescription>
              Lägg till taggar och anteckningar för att enkelt hitta denna {itemType === 'stock_case' ? 'stock case' : 'analys'} senare.
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
                placeholder="Varför är detta intressant? Dina tankar..."
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

export default SaveOpportunityButton;
