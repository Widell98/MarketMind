import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useStockCaseOperations } from './useStockCaseOperations';

export interface StockCaseUpdate {
  id: string;
  stock_case_id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  update_type: string;
  created_at: string;
  updated_at: string;
}

export const useStockCaseUpdates = (stockCaseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadImage } = useStockCaseOperations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all updates for a stock case
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['stock-case-updates', stockCaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_case_updates')
        .select('*')
        .eq('stock_case_id', stockCaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockCaseUpdate[];
    },
    enabled: !!stockCaseId,
  });

  // Create a new update
  const createUpdate = async (updateData: {
    title: string;
    description: string;
    imageFile?: File | null;
  }) => {
    if (!user || !stockCaseId) {
      throw new Error('User must be logged in and stock case ID is required');
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (updateData.imageFile) {
        imageUrl = await uploadImage(updateData.imageFile);
      }

      const { data, error } = await supabase
        .from('stock_case_updates')
        .insert({
          stock_case_id: stockCaseId,
          user_id: user.id,
          title: updateData.title,
          description: updateData.description,
          image_url: imageUrl,
          update_type: 'analysis_update'
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate and refetch the updates
      queryClient.invalidateQueries({ queryKey: ['stock-case-updates', stockCaseId] });

      toast({
        title: "Framgång!",
        description: "Din uppdatering har lagts till framgångsrikt",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte lägga till uppdatering",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an update
  const deleteUpdate = async (updateId: string) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    try {
      const { error } = await supabase
        .from('stock_case_updates')
        .delete()
        .eq('id', updateId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate and refetch the updates
      queryClient.invalidateQueries({ queryKey: ['stock-case-updates', stockCaseId] });

      toast({
        title: "Framgång!",
        description: "Uppdateringen har tagits bort",
      });
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort uppdatering",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    updates,
    isLoading,
    createUpdate,
    deleteUpdate,
    isSubmitting
  };
};