
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type StockCase = {
  id: string;
  title: string;
  company_name: string;
  image_url: string | null;
  sector: string | null;
  market_cap: string | null;
  pe_ratio: string | null;
  dividend_yield: string | null;
  description: string | null;
  admin_comment: string | null;
  user_id: string | null;
  status: 'active' | 'winner' | 'loser';
  entry_price: number | null;
  current_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  performance_percentage: number | null;
  closed_at: string | null;
  is_public: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  case_categories?: {
    id: string;
    name: string;
    color: string;
  };
  profiles?: {
    id: string;
    display_name: string | null;
    username: string;
  };
};

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

// Hook for fetching stock cases with filters
export const useStockCasesList = (filters?: {
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['stock-cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_cases')
        .select(`
          *,
          case_categories (
            id,
            name,
            color
          ),
          profiles (
            id,
            display_name,
            username
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockCase[];
    },
  });
};

// Hook for fetching a single stock case
export const useStockCase = (id: string) => {
  return useQuery({
    queryKey: ['stock-case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_cases')
        .select(`
          *,
          case_categories (
            id,
            name,
            color
          ),
          profiles (
            id,
            display_name,
            username
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as StockCase;
    },
    enabled: !!id,
  });
};
