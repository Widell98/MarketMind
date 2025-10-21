
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useStockCaseOperations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const createStockCase = async (stockCaseData: any) => {
    if (!user) {
      throw new Error('Du måste vara inloggad för att skapa aktiecases');
    }


    const { data, error } = await supabase
      .from('stock_cases')
      .insert([{
        ...stockCaseData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating stock case:', error);
      throw error;
    }


    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['stock-cases'] });
    queryClient.invalidateQueries({ queryKey: ['user-stock-cases'] });

    toast({
      title: "Framgång",
      description: "Aktiecase skapat framgångsrikt!",
    });

    return data;
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Ogiltigt filformat. Endast JPG, PNG och WebP är tillåtna.');
      }

      // Validate file size (5MB limit)
      if (file.size > 5242880) {
        throw new Error('Filen är för stor. Maximal storlek är 5MB.');
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user?.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;
      

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stock-case-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Uppladdningsfel: ${uploadError.message}`);
      }


      const { data: { publicUrl } } = supabase.storage
        .from('stock-case-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };

  const deleteStockCase = async (stockCaseId: string) => {
    if (!user) {
      throw new Error('Du måste vara inloggad för att ta bort aktiecases');
    }

    try {
      // Check if user is admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => role.role === 'admin');

      // Build the delete query - admins can delete any case, users only their own
      let deleteQuery = supabase
        .from('stock_cases')
        .delete()
        .eq('id', stockCaseId);

      // If not admin, add user_id filter
      if (!isAdmin) {
        deleteQuery = deleteQuery.eq('user_id', user.id);
      }

      const { error } = await deleteQuery;

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

  const updateStockCase = async (caseId: string, caseData: any) => {
    if (!user) {
      throw new Error('Du måste vara inloggad för att uppdatera aktiecases');
    }


    const { data, error } = await supabase
      .from('stock_cases')
      .update(caseData)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stock case:', error);
      throw error;
    }


    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['stock-cases'] });
    queryClient.invalidateQueries({ queryKey: ['user-stock-cases'] });

    toast({
      title: "Framgång",
      description: "Aktiecase uppdaterat framgångsrikt!",
    });

    return data;
  };

  return {
    createStockCase,
    updateStockCase,
    uploadImage,
    deleteStockCase,
    loading,
  };
};
