import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type GoalCategory = 'retirement' | 'savings' | 'house' | 'car' | 'travel' | 'other';

export interface InvestmentGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: GoalCategory;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  linked_to_portfolio?: boolean;
}

export const useInvestmentGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const [goalsResponse, portfolioResponse] = await Promise.all([
        supabase
          .from('user_ai_memory')
          .select('current_goals')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_portfolios')
          .select('total_value')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (goalsResponse.error) throw goalsResponse.error;
      
      let parsedGoals: InvestmentGoal[] = [];
      if (goalsResponse.data?.current_goals) {
        parsedGoals = Array.isArray(goalsResponse.data.current_goals) 
          ? (goalsResponse.data.current_goals as unknown as InvestmentGoal[]) 
          : [];
      }

      // If we have portfolio value, update linked goals
      const currentPortfolioValue = portfolioResponse.data?.total_value || 0;
      setPortfolioValue(currentPortfolioValue);
      
      const updatedGoals = parsedGoals.map(goal => {
        if (goal.linked_to_portfolio) {
          return { ...goal, current_amount: currentPortfolioValue };
        }
        return goal;
      });

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Kunde inte hämta mål');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveGoals = async (newGoals: InvestmentGoal[]) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_ai_memory')
        .upsert({ 
          user_id: user.id, 
          current_goals: newGoals as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      // Update local state immediately, but also trigger a fetch to ensure sync with portfolio value
      // We manually update the local state with portfolio value if linked, to avoid waiting for fetch
      const updatedGoals = newGoals.map(goal => {
        if (goal.linked_to_portfolio) {
          return { ...goal, current_amount: portfolioValue };
        }
        return goal;
      });
      
      setGoals(updatedGoals);
      toast.success('Mål uppdaterade');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Kunde inte spara mål');
    }
  };

  const addGoal = async (goal: Omit<InvestmentGoal, 'id' | 'created_at'>) => {
    const newGoal: InvestmentGoal = {
      ...goal,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    await saveGoals([...goals, newGoal]);
    return newGoal;
  };

  const updateGoal = async (id: string, updates: Partial<InvestmentGoal>) => {
    const newGoals = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    await saveGoals(newGoals);
  };

  const deleteGoal = async (id: string) => {
    const newGoals = goals.filter(g => g.id !== id);
    await saveGoals(newGoals);
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, loading, addGoal, updateGoal, deleteGoal, refresh: fetchGoals, portfolioValue };
};
