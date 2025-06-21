
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserHolding {
  id: string;
  user_id: string;
  holding_type: 'stock' | 'fund' | 'crypto' | 'real_estate' | 'bonds' | 'other';
  name: string;
  symbol?: string;
  quantity?: number;
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  sector?: string;
  market?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const useUserHoldings = () => {
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHoldings();
    }
  }, [user]);

  const fetchHoldings = async () => {
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching holdings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch holdings",
          variant: "destructive",
        });
        return;
      }

      // Type cast the data properly
      const typedData: UserHolding[] = (data || []).map(item => ({
        ...item,
        holding_type: item.holding_type as UserHolding['holding_type']
      }));

      setHoldings(typedData);
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .insert({
          user_id: user.id,
          ...holdingData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding holding:', error);
        toast({
          title: "Error",
          description: "Failed to add holding",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        const typedData: UserHolding = {
          ...data,
          holding_type: data.holding_type as UserHolding['holding_type']
        };
        setHoldings(prev => [typedData, ...prev]);
        toast({
          title: "Success",
          description: "Holding added successfully",
        });
        return true;
      }
    } catch (error) {
      console.error('Error adding holding:', error);
      return false;
    }
  };

  const updateHolding = async (id: string, updates: Partial<UserHolding>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_holdings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating holding:', error);
        toast({
          title: "Error",
          description: "Failed to update holding",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        const typedData: UserHolding = {
          ...data,
          holding_type: data.holding_type as UserHolding['holding_type']
        };
        setHoldings(prev => prev.map(h => h.id === id ? typedData : h));
        toast({
          title: "Success",
          description: "Holding updated successfully",
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating holding:', error);
      return false;
    }
  };

  const deleteHolding = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_holdings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting holding:', error);
        toast({
          title: "Error",
          description: "Failed to delete holding",
          variant: "destructive",
        });
        return false;
      }

      setHoldings(prev => prev.filter(h => h.id !== id));
      toast({
        title: "Success",
        description: "Holding deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting holding:', error);
      return false;
    }
  };

  return {
    holdings,
    loading,
    addHolding,
    updateHolding,
    deleteHolding,
    refetch: fetchHoldings
  };
};
