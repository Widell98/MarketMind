
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StockCaseImageHistory {
  id: string;
  stock_case_id: string;
  image_url: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  is_current: boolean;
}

export const useStockCaseImageHistory = (stockCaseId: string) => {
  const [images, setImages] = useState<StockCaseImageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();

  const fetchImageHistory = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('stock_case_image_history')
        .select('*')
        .eq('stock_case_id', stockCaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setImages(data || []);
      
      // Find current image or default to first
      const currentIndex = data?.findIndex((img: StockCaseImageHistory) => img.is_current) ?? 0;
      setCurrentImageIndex(Math.max(0, currentIndex));
    } catch (error) {
      console.error('Error fetching image history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addImageToHistory = async (imageUrl: string, description?: string, setCurrent = false) => {
    if (!user) return;

    try {
      // If setting as current, first unset all other current flags
      if (setCurrent) {
        await (supabase as any)
          .from('stock_case_image_history')
          .update({ is_current: false })
          .eq('stock_case_id', stockCaseId);
      }

      const { error } = await (supabase as any)
        .from('stock_case_image_history')
        .insert({
          stock_case_id: stockCaseId,
          image_url: imageUrl,
          description: description || null,
          created_by: user.id,
          is_current: setCurrent
        });

      if (error) throw error;

      // Refresh the list
      await fetchImageHistory();
    } catch (error) {
      console.error('Error adding image to history:', error);
    }
  };

  const setCurrentImage = async (imageId: string) => {
    try {
      // Unset all current flags
      await (supabase as any)
        .from('stock_case_image_history')
        .update({ is_current: false })
        .eq('stock_case_id', stockCaseId);

      // Set the selected image as current
      await (supabase as any)
        .from('stock_case_image_history')
        .update({ is_current: true })
        .eq('id', imageId);

      // Refresh the list
      await fetchImageHistory();
    } catch (error) {
      console.error('Error setting current image:', error);
    }
  };

  useEffect(() => {
    if (stockCaseId) {
      fetchImageHistory();
    }
  }, [stockCaseId]);

  return {
    images,
    loading,
    currentImageIndex,
    setCurrentImageIndex,
    addImageToHistory,
    setCurrentImage,
    refetch: fetchImageHistory
  };
};
