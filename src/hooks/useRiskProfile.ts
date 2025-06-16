
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RiskProfile {
  id: string;
  user_id: string;
  age: number | null;
  annual_income: number | null;
  investment_horizon: 'short' | 'medium' | 'long' | null;
  investment_goal: 'growth' | 'income' | 'preservation' | 'balanced' | null;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | null;
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | null;
  sector_interests: string[];
  monthly_investment_amount: number | null;
  current_portfolio_value: number | null;
  created_at: string;
  updated_at: string;
}

export const useRiskProfile = () => {
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRiskProfile();
    }
  }, [user]);

  const fetchRiskProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching risk profile:', error);
      } else {
        setRiskProfile(data);
      }
    } catch (error) {
      console.error('Error fetching risk profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRiskProfile = async (profileData: Omit<RiskProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_risk_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving risk profile:', error);
        toast({
          title: "Error",
          description: "Failed to save risk profile",
          variant: "destructive",
        });
        return false;
      }

      setRiskProfile(data);
      toast({
        title: "Success",
        description: "Risk profile saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error saving risk profile:', error);
      toast({
        title: "Error",
        description: "Failed to save risk profile",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    riskProfile,
    loading,
    saveRiskProfile,
    refetch: fetchRiskProfile
  };
};
