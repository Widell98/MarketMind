import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  profiles?: {
    username: string;
    display_name: string | null;
  };
  case_categories?: {
    name: string;
    color: string;
  };
};

export const useStockCases = () => {
  const [stockCases, setStockCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStockCases = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_cases')
        .select(`
          *,
          profiles:user_id (username, display_name),
          case_categories (name, color)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStockCases(data || []);
    } catch (error: any) {
      console.error('Error fetching stock cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedStockCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStockCases([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('stock_cases')
        .select(`
          *,
          profiles:user_id (username, display_name),
          case_categories (name, color)
        `)
        .in('user_id', [
          user.id,
          ...await getFollowedUserIds(user.id)
        ])
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStockCases(data || []);
    } catch (error: any) {
      console.error('Error fetching followed stock cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFollowedUserIds = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    if (error) return [];
    return data.map(follow => follow.following_id);
  };

  useEffect(() => {
    fetchFollowedStockCases();
  }, []);

  const createStockCase = async (stockCase: Omit<StockCase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('Du måste vara inloggad för att skapa aktiecase');
      }

      const caseData = {
        ...stockCase,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('stock_cases')
        .insert([caseData])
        .select(`
          *,
          profiles:user_id (username, display_name),
          case_categories (name, color)
        `)
        .single();

      if (error) throw error;

      setStockCases(prev => [data, ...prev]);
      toast({
        title: "Framgång",
        description: "Akticase skapat framgångsrikt",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating stock case:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa akticase",
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadImage = async (file: File) => {
    try {
      console.log('Starting image upload:', file.name, file.type, file.size);
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Endast JPG, PNG och WebP-filer är tillåtna');
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Filen är för stor. Maximal storlek är 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('stock-cases')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('stock-cases')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ladda upp bild",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    stockCases,
    loading,
    createStockCase,
    uploadImage,
    refetch: fetchFollowedStockCases,
  };
};

export const useStockCase = (id: string) => {
  const [stockCase, setStockCase] = useState<StockCase | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStockCase = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_cases')
          .select(`
            *,
            profiles:user_id (username, display_name),
            case_categories (name, color)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setStockCase(data);
      } catch (error: any) {
        console.error('Error fetching stock case:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda akticase",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStockCase();
    }
  }, [id, toast]);

  return { stockCase, loading };
};
