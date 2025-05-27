
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
      const { data, error } = await supabase
        .from('stock_cases')
        .insert([stockCase])
        .select()
        .single();

      if (error) throw error;

      setStockCases(prev => [data, ...prev]);
      toast({
        title: "Framgång",
        description: "Akticase skapat framgångsrikt",
      });

      return data;
    } catch (error: any) {
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('stock-cases')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('stock-cases')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp bild",
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
