import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, TrendingUp } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Analysis } from '@/types/analysis';

interface AddAnalysisToHoldingDialogProps {
  analysis: Analysis;
  children?: React.ReactNode;
}

const AddAnalysisToHoldingDialog: React.FC<AddAnalysisToHoldingDialogProps> = ({
  analysis,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const { user } = useAuth();
  const { actualHoldings } = useUserHoldings();
  const { saveOpportunity } = useSavedOpportunities();
  const { toast } = useToast();

  const handleAddTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
      setCustomTags([...customTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!selectedHoldingId) {
      toast({
        title: "Välj innehav",
        description: "Du måste välja ett innehav att koppla analysen till",
        variant: "destructive",
      });
      return;
    }

    const selectedHolding = actualHoldings.find(h => h.id === selectedHoldingId);
    if (!selectedHolding) return;

    // Create tags that include the holding name and any custom tags
    const tags = [
      selectedHolding.name,
      selectedHolding.symbol || '',
      ...customTags,
      ...analysis.tags
    ].filter(Boolean);

    const success = await saveOpportunity(
      'analysis',
      analysis.id,
      tags,
      notes || `Analys kopplad till ${selectedHolding.name}`
    );

    if (success) {
      toast({
        title: "Analys tillagd",
        description: `Analysen har kopplats till ${selectedHolding.name}`,
      });
      setOpen(false);
      setSelectedHoldingId('');
      setNotes('');
      setCustomTags([]);
    } else {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till analysen",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Button disabled variant="outline" size="sm">
        <Plus className="w-4 h-4 mr-1" />
        Logga in för att spara
      </Button>
    );
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <Plus className="w-4 h-4" />
      Lägg till i portfölj
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Lägg till analys i portfölj
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Analysis Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-1">{analysis.title}</h4>
            <p className="text-xs text-muted-foreground">
              av {analysis.profiles?.display_name || analysis.profiles?.username}
            </p>
          </div>

          {/* Select Holding */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Välj innehav</label>
            <Select value={selectedHoldingId} onValueChange={setSelectedHoldingId}>
              <SelectTrigger>
                <SelectValue placeholder="Välj vilket innehav analysen gäller" />
              </SelectTrigger>
              <SelectContent>
                {actualHoldings.map((holding) => (
                  <SelectItem key={holding.id} value={holding.id}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{holding.name}</span>
                      {holding.symbol && (
                        <span className="text-muted-foreground">({holding.symbol})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actualHoldings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Du har inga innehav ännu. Lägg till innehav i din portfölj först.
              </p>
            )}
          </div>

          {/* Custom Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Egna taggar (valfritt)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Lägg till tagg..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-1 text-sm border rounded-md"
              />
              <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Lägg till
              </Button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-xs hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Anteckningar (valfritt)</label>
            <Textarea
              placeholder="Varför är denna analys relevant för ditt innehav?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedHoldingId}
              className="flex-1"
            >
              Lägg till
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAnalysisToHoldingDialog;