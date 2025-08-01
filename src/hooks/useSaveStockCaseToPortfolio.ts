import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useSaveStockCaseToPortfolio = () => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const saveToPortfolio = async (stockCase: any) => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att spara till portfölj",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);
    
    try {
      // Create a holding based on the stock case
      const { error } = await supabase
        .from('user_holdings')
        .insert([
          {
            user_id: user.id,
            holding_type: 'stock',
            name: stockCase.company_name,
            symbol: stockCase.title, // Using title as symbol for now
            sector: stockCase.sector,
            market: 'Stockholm', // Default market
            currency: 'SEK',
            quantity: 0, // User can update this later
            current_value: 0,
            purchase_price: stockCase.current_price || stockCase.entry_price || 0,
            purchase_date: new Date().toISOString().split('T')[0],
            allocation: 0
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sparat till portfölj!",
        description: `${stockCase.company_name} har sparats till din portfölj som ett innehav att överväga`,
      });

      return true;
    } catch (error: any) {
      console.error('Error saving to portfolio:', error);
      
      // Check if it's a duplicate
      if (error.code === '23505') {
        toast({
          title: "Redan i portfölj",
          description: "Detta innehav finns redan i din portfölj",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fel",
          description: "Kunde inte spara till portfölj",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    saveToPortfolio,
    saving,
  };
};