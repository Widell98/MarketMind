import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PredictionMarketBet {
  id: string;
  user_id: string;
  prediction_market_id: string;
  market_question: string;
  bet_outcome: string;
  bet_odds: number;
  bet_amount: number;
  potential_payout: number;
  market_end_date: string | null;
  notes: string | null;
  status: 'active' | 'pending' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface AddBetData {
  prediction_market_id: string;
  market_question: string;
  bet_outcome: string;
  bet_odds: number;
  bet_amount: number;
  market_end_date?: string | null;
  notes?: string | null;
}

export const usePredictionMarketBets = () => {
  const [bets, setBets] = useState<PredictionMarketBet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate potential payout based on odds and bet amount
  const calculatePotentialPayout = useCallback((betAmount: number, odds: number, outcome: string): number => {
    if (odds <= 0 || odds >= 1) return 0;
    
    // For Yes: payout = bet_amount / odds
    // For No: payout = bet_amount / (1 - odds)
    if (outcome.toLowerCase() === 'yes') {
      return betAmount / odds;
    } else {
      return betAmount / (1 - odds);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_prediction_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBets((data || []) as PredictionMarketBet[]);
    } catch (error) {
      console.error('Error fetching bets:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta bets. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBet = async (betData: AddBetData): Promise<PredictionMarketBet | null> => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till bets.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const potentialPayout = calculatePotentialPayout(
        betData.bet_amount,
        betData.bet_odds,
        betData.bet_outcome
      );

      const { data, error } = await supabase
        .from('user_prediction_bets')
        .insert({
          user_id: user.id,
          prediction_market_id: betData.prediction_market_id,
          market_question: betData.market_question,
          bet_outcome: betData.bet_outcome,
          bet_odds: betData.bet_odds,
          bet_amount: betData.bet_amount,
          potential_payout: potentialPayout,
          market_end_date: betData.market_end_date || null,
          notes: betData.notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Bet tillagt!",
        description: "Ditt bet har lagts till i portföljen.",
      });

      await fetchBets();
      return data as PredictionMarketBet;
    } catch (error) {
      console.error('Error adding bet:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till bet. Försök igen.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateBet = async (betId: string, updates: Partial<AddBetData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        ...updates,
      };

      // Recalculate potential payout if odds or amount changed
      if (updates.bet_odds !== undefined || updates.bet_amount !== undefined) {
        const existingBet = bets.find(b => b.id === betId);
        if (existingBet) {
          const newOdds = updates.bet_odds ?? existingBet.bet_odds;
          const newAmount = updates.bet_amount ?? existingBet.bet_amount;
          const outcome = updates.bet_outcome ?? existingBet.bet_outcome;
          updateData.potential_payout = calculatePotentialPayout(newAmount, newOdds, outcome);
        }
      }

      const { error } = await supabase
        .from('user_prediction_bets')
        .update(updateData)
        .eq('id', betId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Bet uppdaterat",
        description: "Ditt bet har uppdaterats.",
      });

      await fetchBets();
      return true;
    } catch (error) {
      console.error('Error updating bet:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera bet. Försök igen.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeBet = async (betId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_prediction_bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Bet borttaget",
        description: "Ditt bet har tagits bort från portföljen.",
      });

      await fetchBets();
      return true;
    } catch (error) {
      console.error('Error removing bet:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort bet. Försök igen.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateBetStatus = async (betId: string, status: 'active' | 'pending' | 'won' | 'lost'): Promise<boolean> => {
    return updateBet(betId, {} as Partial<AddBetData>).then(() => {
      return supabase
        .from('user_prediction_bets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', betId)
        .eq('user_id', user?.id)
        .then(({ error }) => {
          if (error) throw error;
          fetchBets();
          return true;
        });
    }).catch(() => false);
  };

  return {
    bets,
    loading,
    addBet,
    updateBet,
    removeBet,
    updateBetStatus,
    calculatePotentialPayout,
    refetch: fetchBets,
  };
};


