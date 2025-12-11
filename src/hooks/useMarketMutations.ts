import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketMetadata {
  custom_summary?: string;
  custom_description?: string;
  admin_notes?: string;
}

interface UpdateMarketMetadataParams {
  marketId: string;
  metadata: MarketMetadata;
}

export const useMarketMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMarketMetadata = useMutation({
    mutationFn: async ({ marketId, metadata }: UpdateMarketMetadataParams) => {
      // Fetch existing record to preserve is_active status
      const { data: existing, error: fetchError } = await supabase
        .from('curated_markets')
        .select('market_id, is_active')
        .eq('market_id', marketId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if market doesn't exist
        throw fetchError;
      }

      // Prepare upsert data - preserve is_active if it exists, otherwise default to true
      const upsertData: any = {
        market_id: marketId,
        metadata: metadata as any, // Store as JSONB
      };

      // Only set is_active if we have an existing record, otherwise let it default
      if (existing) {
        upsertData.is_active = existing.is_active;
      } else {
        // If market doesn't exist in curated_markets, create it as active by default
        upsertData.is_active = true;
      }

      // Upsert with metadata stored as JSONB
      const { error } = await supabase
        .from('curated_markets')
        .upsert(upsertData, {
          onConflict: 'market_id',
        });

      if (error) throw error;
      return { marketId, metadata };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['market-impact', data.marketId] });
      queryClient.invalidateQueries({ queryKey: ['market-metadata', data.marketId] });
      queryClient.invalidateQueries({ queryKey: ['polymarket-curated-details'] });
      
      toast({
        title: 'Marknad uppdaterad',
        description: 'Marknadsmetadata har sparats framgångsrikt.',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating market metadata:', error);
      toast({
        title: 'Kunde inte uppdatera marknad',
        description: error.message || 'Ett fel uppstod vid uppdatering.',
        variant: 'destructive',
      });
    },
  });

  return {
    updateMarketMetadata,
  };
};

