
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';

export type SavedOpportunity = {
  id: string;
  user_id: string;
  item_type: 'stock_case' | 'analysis' | 'prediction_market';
  item_id: string;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  stock_cases?: any;
  analyses?: any;
  prediction_markets?: any;
};

export const useSavedOpportunities = () => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First get the saved opportunities
      const { data: savedOpportunities, error } = await supabase
        .from('saved_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then fetch related stock cases and analyses
      const itemsWithDetails = await Promise.all(
        (savedOpportunities || []).map(async (item) => {
          let relatedData = null;
          
          if (item.item_type === 'stock_case') {
            const { data } = await supabase
              .from('stock_cases')
              .select('*')
              .eq('id', item.item_id)
              .single();
            relatedData = {
              stock_cases: data
                ? {
                    ...data,
                    title: normalizeStockCaseTitle(data.title, data.company_name),
                  }
                : null,
            };
          } else if (item.item_type === 'analysis') {
            const { data } = await supabase
              .from('analyses')
              .select('*')
              .eq('id', item.item_id)
              .single();
            relatedData = { analyses: data };
          } else if (item.item_type === 'prediction_market') {
            // Prediction markets are stored by their Polymarket ID (string)
            // We don't fetch details here - that's handled by useSavedPredictionMarkets
            relatedData = { prediction_markets: { id: item.item_id } };
          }

          return {
            ...item,
            ...relatedData
          };
        })
      );

      setSavedItems(itemsWithDetails);
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems();
  }, [user]);

  const saveOpportunity = async (
    itemType: 'stock_case' | 'analysis' | 'prediction_market',
    itemId: string,
    tags: string[] = [],
    notes: string | null = null
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          tags,
          notes
        });

      if (error) throw error;
      await fetchSavedItems();
      return true;
    } catch (error) {
      console.error('Error saving opportunity:', error);
      return false;
    }
  };

  const removeOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSavedItems();
      return true;
    } catch (error) {
      console.error('Error removing opportunity:', error);
      return false;
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchSavedItems();
      return true;
    } catch (error) {
      console.error('Error updating tags:', error);
      return false;
    }
  };

  const isItemSaved = (itemType: 'stock_case' | 'analysis' | 'prediction_market', itemId: string) => {
    return savedItems.some(item => item.item_type === itemType && item.item_id === itemId);
  };

  return {
    savedItems,
    loading,
    saveOpportunity,
    removeOpportunity,
    updateTags,
    isItemSaved,
    refetch: fetchSavedItems
  };
};
