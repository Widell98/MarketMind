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
      try {
        console.log('Updating market metadata:', { marketId, metadata });

        // Fetch existing record to preserve is_active status
        const { data: existing, error: fetchError } = await supabase
          .from('curated_markets')
          .select('market_id, is_active, metadata')
          .eq('market_id', marketId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected if market doesn't exist
          console.error('Error fetching existing market:', fetchError);
          throw new Error(`Kunde inte hämta befintlig marknad: ${fetchError.message}`);
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

        console.log('Upserting market data:', upsertData);

        // Upsert with metadata stored as JSONB
        const { data: upsertedData, error: upsertError } = await supabase
          .from('curated_markets')
          .upsert(upsertData, {
            onConflict: 'market_id',
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error upserting market metadata:', {
            error: upsertError,
            code: upsertError.code,
            message: upsertError.message,
            details: upsertError.details,
            hint: upsertError.hint,
          });

          // Handle specific error cases
          if (upsertError.code === '42703') {
            // Column does not exist
            throw new Error('Metadata-kolumnen finns inte i databasen. Kontrollera att migrationen har körts.');
          } else if (upsertError.code === '42501') {
            // Insufficient privilege
            throw new Error('Du har inte behörighet att uppdatera marknader. Kontrollera att du är inloggad som admin.');
          } else if (upsertError.code === '23505') {
            // Unique violation (shouldn't happen with onConflict, but handle it)
            throw new Error('Marknaden finns redan i systemet.');
          }

          throw new Error(upsertError.message || 'Ett fel uppstod vid uppdatering av marknad.');
        }

        console.log('Successfully updated market metadata:', upsertedData);
        return { marketId, metadata };
      } catch (error) {
        console.error('Error in updateMarketMetadata mutation:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Ett oväntat fel uppstod vid uppdatering av marknad.');
      }
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
      console.error('Error updating market metadata (onError handler):', error);
      const errorMessage = error.message || 'Ett fel uppstod vid uppdatering.';
      
      toast({
        title: 'Kunde inte uppdatera marknad',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000, // Show error for 5 seconds
      });
    },
  });

  return {
    updateMarketMetadata,
  };
};

