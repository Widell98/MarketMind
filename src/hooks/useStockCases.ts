
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useStockCases = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const createStockCase = async (stockCaseData: any) => {
    if (!user) {
      throw new Error('Du måste vara inloggad för att skapa aktiecases');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_cases')
        .insert([stockCaseData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Aktiecase skapat framgångsrikt!",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating stock case:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa aktiecase",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `stock-cases/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('stock-case-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Kunde inte ladda upp bild');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('stock-case-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const deleteStockCase = async (stockCaseId: string) => {
    if (!user) {
      throw new Error('Du måste vara inloggad för att ta bort aktiecases');
    }

    try {
      const { error } = await supabase
        .from('stock_cases')
        .delete()
        .eq('id', stockCaseId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Aktiecase borttaget framgångsrikt!",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['user-stock-cases'] });
      queryClient.invalidateQueries({ queryKey: ['stock-cases'] });
    } catch (error: any) {
      console.error('Error deleting stock case:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort aktiecase",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createStockCase,
    uploadImage,
    deleteStockCase,
    loading,
  };
};
