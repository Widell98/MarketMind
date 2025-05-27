
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
  created_at: string;
  updated_at: string;
};

export const useStockCases = () => {
  const [stockCases, setStockCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStockCases = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_cases')
        .select('*')
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

  useEffect(() => {
    fetchStockCases();
  }, []);

  const createStockCase = async (stockCase: Omit<StockCase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating stock case with data:', stockCase);
      
      // Check current user and their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      console.log('Current user:', user?.id);
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user?.id)
        .single();
        
      console.log('User profile:', profile);
      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Kunde inte hämta användarprofil');
      }

      const { data, error } = await supabase
        .from('stock_cases')
        .insert([stockCase])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

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
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Endast JPG, PNG och WebP-filer är tillåtna');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Filen är för stor. Maximal storlek är 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('Uploading to storage with filename:', fileName);
      
      const { data, error } = await supabase.storage
        .from('stock-cases')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('stock-cases')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
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
    refetch: fetchStockCases,
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
          .select('*')
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
