import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMarketMutations } from '@/hooks/useMarketMutations';
import { Sparkles, Loader2, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import type { PolymarketMarketDetail } from '@/types/polymarket';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EditMarketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  market: PolymarketMarketDetail | null;
}

interface ImpactItem {
  name: string;
  ticker?: string;
  reason: string;
}

interface MarketMetadata {
  custom_summary?: string;
  custom_description?: string;
  admin_notes?: string;
  custom_positive?: ImpactItem[];
  custom_negative?: ImpactItem[];
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
    custom_positive: [],
    custom_negative: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { updateMarketMetadata } = useMarketMutations();

  // Fetch existing metadata when market changes
  const { data: existingMetadata, isLoading: isLoadingMetadata, error: metadataError } = useQuery({
    queryKey: ['market-metadata', market?.id],
    queryFn: async () => {
      if (!market?.id) {
        console.log('No market ID provided');
        return null;
      }
      
      console.log('Fetching metadata for market:', market.id);
      
      try {
        const { data, error } = await supabase
          .from('curated_markets')
          .select('metadata')
          .eq('market_id', market.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // PGRST116 is "not found" error - this is expected if market doesn't exist yet
            console.log('Market not found in curated_markets, returning null');
            return null;
          } else {
            // Other errors should be logged and thrown
            console.error('Error fetching market metadata:', {
              error,
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            });
            throw error;
          }
        }

        console.log('Fetched metadata:', data?.metadata);
        
        // Parse metadata if it exists
        if (data?.metadata) {
          const parsed = data.metadata as MarketMetadata;
          console.log('Parsed metadata:', parsed);
          return parsed;
        }

        return null;
      } catch (error) {
        console.error('Exception in metadata query:', error);
        throw error;
      }
    },
    enabled: !!market?.id && isOpen,
    retry: 1, // Retry once on failure
    staleTime: 0, // Always refetch when dialog opens
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts (dialog opens)
  });

  // Fetch AI-generated analysis to show current text if no custom summary exists
  const { data: aiAnalysis } = useQuery({
    queryKey: ['market-impact', market?.id],
    queryFn: async () => {
      if (!market) return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('analyze-prediction-impact', {
          body: {
            question: market.question,
            description: market.description,
            marketId: market.id 
          }
        });

        if (error) {
          console.error('Error fetching AI analysis:', error);
          return null;
        }
        return data as { summary?: string; positive?: ImpactItem[]; negative?: ImpactItem[] };
      } catch (error) {
        console.error('Exception fetching AI analysis:', error);
        return null;
      }
    },
    enabled: !!market?.id && isOpen,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  // Reset form when dialog opens/closes or market changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setFormData({
        custom_summary: '',
        custom_description: '',
        admin_notes: '',
        custom_positive: [],
        custom_negative: [],
      });
      return;
    }

    if (!market) return;

    // When dialog opens, wait for metadata to load
    if (isLoadingMetadata) {
      return;
    }

    console.log('Updating form data with metadata:', existingMetadata);
    console.log('AI Analysis:', aiAnalysis);
    
    // Populate form with existing metadata or use AI-generated data
    if (existingMetadata !== undefined && existingMetadata !== null) {
      // Metadata exists, populate form
      // Use custom values if they exist, otherwise use AI-generated values
      const summaryToShow = existingMetadata.custom_summary || aiAnalysis?.summary || '';
      const positiveToShow = existingMetadata.custom_positive || aiAnalysis?.positive || [];
      const negativeToShow = existingMetadata.custom_negative || aiAnalysis?.negative || [];
      
      const newFormData = {
        custom_summary: summaryToShow,
        custom_description: existingMetadata.custom_description || '',
        admin_notes: existingMetadata.admin_notes || '',
        custom_positive: positiveToShow,
        custom_negative: negativeToShow,
      };
      console.log('Setting form data from existing metadata:', newFormData);
      setFormData(newFormData);
    } else {
      // No metadata exists, use AI-generated data if available
      const summaryToShow = aiAnalysis?.summary || '';
      const positiveToShow = aiAnalysis?.positive || [];
      const negativeToShow = aiAnalysis?.negative || [];
      console.log('No existing metadata, using AI data');
      setFormData({
        custom_summary: summaryToShow,
        custom_description: '',
        admin_notes: '',
        custom_positive: positiveToShow,
        custom_negative: negativeToShow,
      });
    }
  }, [market, existingMetadata, isLoadingMetadata, isOpen, aiAnalysis]);

  const handleInputChange = (field: keyof MarketMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddImpactItem = (type: 'positive' | 'negative') => {
    const newItem: ImpactItem = { name: '', ticker: '', reason: '' };
    setFormData(prev => ({
      ...prev,
      [`custom_${type}`]: [...(prev[`custom_${type}`] || []), newItem]
    }));
  };

  const handleRemoveImpactItem = (type: 'positive' | 'negative', index: number) => {
    setFormData(prev => {
      const items = prev[`custom_${type}`] || [];
      return {
        ...prev,
        [`custom_${type}`]: items.filter((_, i) => i !== index)
      };
    });
  };

  const handleUpdateImpactItem = (type: 'positive' | 'negative', index: number, field: keyof ImpactItem, value: string) => {
    setFormData(prev => {
      const items = [...(prev[`custom_${type}`] || [])];
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        [`custom_${type}`]: items
      };
    });
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
    <Dialog open={isOpen} onOpenChange={handleClose} key={market?.id}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-900 dark:text-blue-400" />
            Redigera marknad
          </DialogTitle>
          <DialogDescription>
            Redigera AI-analys och metadata för marknaden: {market.question}
          </DialogDescription>
        </DialogHeader>

        {isLoadingMetadata ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Laddar metadata...</span>
          </div>
        ) : metadataError ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-destructive text-sm">
              <p className="font-medium">Kunde inte ladda metadata</p>
              <p className="text-xs mt-1 opacity-80">
                {metadataError instanceof Error ? metadataError.message : 'Ett fel uppstod'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Retry by invalidating the query
                window.location.reload();
              }}
            >
              Försök igen
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                Debug: custom_summary length: {formData.custom_summary?.length || 0}, 
                existingMetadata: {existingMetadata ? 'exists' : 'null'}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="custom_summary">
                AI-Analys: Marknadseffekt (Sammanfattning) *
              </Label>
              <Textarea
                id="custom_summary"
                placeholder="Skriv eller redigera AI-analysens sammanfattning. Detta kommer att visas istället för den automatiska analysen."
                value={formData.custom_summary || ''}
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
                value={formData.custom_description || ''}
                onChange={(e) => handleInputChange('custom_description', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Valfritt: Ytterligare information om marknaden.
              </p>
            </div>

            {/* Positiva påverkningar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Positiva påverkningar
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddImpactItem('positive')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.custom_positive || []).map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-green-50/50 dark:bg-green-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Positiv påverkan #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImpactItem('positive', index)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`positive-name-${index}`} className="text-xs">Företag/Bolag *</Label>
                        <Input
                          id={`positive-name-${index}`}
                          placeholder="t.ex. Tesla Inc"
                          value={item.name}
                          onChange={(e) => handleUpdateImpactItem('positive', index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`positive-ticker-${index}`} className="text-xs">Ticker (valfritt)</Label>
                        <Input
                          id={`positive-ticker-${index}`}
                          placeholder="t.ex. TSLA"
                          value={item.ticker || ''}
                          onChange={(e) => handleUpdateImpactItem('positive', index, 'ticker', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`positive-reason-${index}`} className="text-xs">Anledning *</Label>
                      <Textarea
                        id={`positive-reason-${index}`}
                        placeholder="Beskriv varför detta bolag påverkas positivt..."
                        value={item.reason}
                        onChange={(e) => handleUpdateImpactItem('positive', index, 'reason', e.target.value)}
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                ))}
                {(!formData.custom_positive || formData.custom_positive.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Inga positiva påverkningar tillagda ännu
                  </p>
                )}
              </div>
            </div>

            {/* Negativa påverkningar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Negativa påverkningar
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddImpactItem('negative')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.custom_negative || []).map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-red-50/50 dark:bg-red-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        Negativ påverkan #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImpactItem('negative', index)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`negative-name-${index}`} className="text-xs">Företag/Bolag *</Label>
                        <Input
                          id={`negative-name-${index}`}
                          placeholder="t.ex. Meta Platforms"
                          value={item.name}
                          onChange={(e) => handleUpdateImpactItem('negative', index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`negative-ticker-${index}`} className="text-xs">Ticker (valfritt)</Label>
                        <Input
                          id={`negative-ticker-${index}`}
                          placeholder="t.ex. META"
                          value={item.ticker || ''}
                          onChange={(e) => handleUpdateImpactItem('negative', index, 'ticker', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`negative-reason-${index}`} className="text-xs">Anledning *</Label>
                      <Textarea
                        id={`negative-reason-${index}`}
                        placeholder="Beskriv varför detta bolag påverkas negativt..."
                        value={item.reason}
                        onChange={(e) => handleUpdateImpactItem('negative', index, 'reason', e.target.value)}
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                ))}
                {(!formData.custom_negative || formData.custom_negative.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Inga negativa påverkningar tillagda ännu
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_notes">
                Admin-anteckningar (internt)
              </Label>
              <Textarea
                id="admin_notes"
                placeholder="Internt anteckningar för administratörer..."
                value={formData.admin_notes || ''}
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

