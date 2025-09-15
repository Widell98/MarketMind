
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { convertToSEK } from '@/utils/currencyUtils';

export interface CashHolding {
  id: string;
  name: string;
  current_value: number;
  currency: string;
  valueSek: number;
  created_at: string;
  updated_at: string;
}

export const useCashHoldings = () => {
  const [cashHoldings, setCashHoldings] = useState<CashHolding[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCashHoldings();
    }
  }, [user]);

  const fetchCashHoldings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_cash', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cash holdings:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta kassainnehav",
          variant: "destructive",
        });
        return;
      }

      const cashData = (data || []).map(item => {
        const value = item.current_value || 0;
        const currency = item.currency || 'SEK';
        const valueSek = convertToSEK(value, currency);

        return {
          id: item.id,
          name: item.name,
          current_value: value,
          currency,
          valueSek,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });

      setCashHoldings(cashData);

      // Calculate total cash in SEK
      const total = cashData.reduce((sum, holding) => sum + holding.valueSek, 0);
      setTotalCash(total);
      
    } catch (error) {
      console.error('Error fetching cash holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCashHolding = async (name: string, amount: number, currency: string = 'SEK') => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .insert({
          user_id: user.id,
          name: name,
          current_value: amount,
          currency: currency,
          holding_type: 'cash',
          is_cash: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding cash holding:', error);
        toast({
          title: "Fel",
          description: "Kunde inte lägga till kassainnehav",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        await fetchCashHoldings(); // Refresh the list
        toast({
          title: "Framgång",
          description: "Kassainnehav tillagt",
        });
        return true;
      }
    } catch (error) {
      console.error('Error adding cash holding:', error);
      return false;
    }
  };

  const updateCashHolding = async (id: string, amount: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_holdings')
        .update({
          current_value: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating cash holding:', error);
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera kassainnehav",
          variant: "destructive",
        });
        return false;
      }

      await fetchCashHoldings(); // Refresh the list
      toast({
        title: "Framgång",
        description: "Kassainnehav uppdaterat",
      });
      return true;
    } catch (error) {
      console.error('Error updating cash holding:', error);
      return false;
    }
  };

  const deleteCashHolding = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_holdings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting cash holding:', error);
        toast({
          title: "Fel",
          description: "Kunde inte radera kassainnehav",
          variant: "destructive",
        });
        return false;
      }

      await fetchCashHoldings(); // Refresh the list
      toast({
        title: "Framgång",
        description: "Kassainnehav raderat",
      });
      return true;
    } catch (error) {
      console.error('Error deleting cash holding:', error);
      return false;
    }
  };

  return {
    cashHoldings,
    totalCash,
    loading,
    addCashHolding,
    updateCashHolding,
    deleteCashHolding,
    refetch: fetchCashHoldings
  };
};
