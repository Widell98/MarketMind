
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SaveOpportunityButtonProps {
  itemType: 'stock_case' | 'analysis';
  itemId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const SaveOpportunityButton = ({ 
  itemType, 
  itemId, 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}: SaveOpportunityButtonProps) => {
  const { user } = useAuth();
  const { isItemSaved, saveOpportunity, removeOpportunity } = useSavedOpportunities();
  const [loading, setLoading] = useState(false);

  const isSaved = isItemSaved(itemType, itemId);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Du måste vara inloggad för att spara möjligheter');
      return;
    }

    setLoading(true);
    
    try {
      if (isSaved) {
        // Hitta och ta bort sparad möjlighet
        const { savedItems } = useSavedOpportunities();
        const savedItem = savedItems.find(item => 
          item.item_type === itemType && item.item_id === itemId
        );
        
        if (savedItem) {
          const success = await removeOpportunity(savedItem.id);
          if (success) {
            toast.success('Möjlighet borttagen från sparade');
          }
        }
      } else {
        const success = await saveOpportunity(itemType, itemId);
        if (success) {
          toast.success('Möjlighet sparad!');
        }
      }
    } catch (error) {
      toast.error('Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleSave}
      disabled={loading}
      className={`${className} ${isSaved ? 'text-blue-600' : ''}`}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Sparad</span>
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Spara</span>
        </>
      )}
    </Button>
  );
};

export default SaveOpportunityButton;
