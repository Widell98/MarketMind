import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMarketMutations } from '@/hooks/useMarketMutations';
import { Sparkles, Loader2 } from 'lucide-react';
import type { PolymarketMarketDetail } from '@/types/polymarket';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EditMarketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  market: PolymarketMarketDetail | null;
}

interface MarketMetadata {
  custom_summary?: string;
  custom_description?: string;
  admin_notes?: string;
}

const EditMarketDialog: React.FC<EditMarketDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  market
}) => {
  const [formData, setFormData] = useState<MarketMetadata>({
    custom_summary: '',
    custom_description: '',
    admin_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { updateMarketMetadata } = useMarketMutations();

  // Fetch existing metadata when market changes
  const { data: existingMetadata, isLoading: isLoadingMetadata } = useQuery({
    queryKey: ['market-metadata', market?.id],
    queryFn: async () => {
      if (!market?.id) return null;
      
      const { data, error } = await supabase
        .from('curated_markets')
        .select('metadata')
        .eq('market_id', market.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error;
      }

      return (data?.metadata as MarketMetadata) || null;
    },
    enabled: !!market?.id && isOpen,
  });

  // Populate form when market or existing metadata changes
  useEffect(() => {
    if (market) {
      if (existingMetadata !== undefined) {
        setFormData({
          custom_summary: existingMetadata?.custom_summary || '',
          custom_description: existingMetadata?.custom_description || '',
          admin_notes: existingMetadata?.admin_notes || '',
        });
      } else {
        // Reset form if no metadata exists
        setFormData({
          custom_summary: '',
          custom_description: '',
          admin_notes: '',
        });
      }
    }
  }, [market, existingMetadata]);

  const handleInputChange = (field: keyof MarketMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!market) return;

    setIsSubmitting(true);

    try {
      await updateMarketMetadata.mutateAsync({
        marketId: market.id,
        metadata: formData,
      });

      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating market:', error);
      // Error toast is handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!market) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Redigera marknad
          </DialogTitle>
          <DialogDescription>
            Redigera AI-analys och metadata för marknaden: {market.question}
          </DialogDescription>
        </DialogHeader>

        {isLoadingMetadata ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="custom_summary">
                AI-Analys: Marknadseffekt (Sammanfattning) *
              </Label>
              <Textarea
                id="custom_summary"
                placeholder="Skriv eller redigera AI-analysens sammanfattning. Detta kommer att visas istället för den automatiska analysen."
                value={formData.custom_summary}
                onChange={(e) => handleInputChange('custom_summary', e.target.value)}
                rows={6}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Denna text visas i MarketImpactAnalysis-komponenten som sammanfattning.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_description">
                Anpassad beskrivning
              </Label>
              <Textarea
                id="custom_description"
                placeholder="Lägg till en anpassad beskrivning eller noteringar om marknaden..."
                value={formData.custom_description}
                onChange={(e) => handleInputChange('custom_description', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Valfritt: Ytterligare information om marknaden.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_notes">
                Admin-anteckningar (internt)
              </Label>
              <Textarea
                id="admin_notes"
                placeholder="Internt anteckningar för administratörer..."
                value={formData.admin_notes}
                onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                rows={3}
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Dessa anteckningar visas endast för administratörer.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  'Spara ändringar'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditMarketDialog;

