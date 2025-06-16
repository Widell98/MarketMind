
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
    if (!user) {
      setLoading(false);
      return null;
    }

    try {
      console.log('Fetching risk profile for user:', user?.id);
      setLoading(true);
      
      // Get the most recent risk profile for the user
      const { data, error } = await supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching risk profile:', error);
        toast({
          title: "Error",
          description: "Failed to fetch risk profile",
          variant: "destructive",
        });
        setRiskProfile(null);
        return null;
      } else if (data) {
        console.log('Fetched risk profile:', data);
        // Cast the database data to our interface type with proper type conversion
        const typedData: RiskProfile = {
          ...data,
          sector_interests: Array.isArray(data.sector_interests) 
            ? data.sector_interests.map(item => String(item)) 
            : [],
          investment_horizon: data.investment_horizon as RiskProfile['investment_horizon'],
          investment_goal: data.investment_goal as RiskProfile['investment_goal'],
          risk_tolerance: data.risk_tolerance as RiskProfile['risk_tolerance'],
          investment_experience: data.investment_experience as RiskProfile['investment_experience']
        };
        setRiskProfile(typedData);
        return typedData;
      } else {
        console.log('No risk profile found');
        setRiskProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching risk profile:', error);
      setRiskProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveRiskProfile = async (profileData: Omit<RiskProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;

    try {
      console.log('Saving risk profile:', profileData);
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

      if (data) {
        console.log('Risk profile saved successfully:', data);
        const typedData: RiskProfile = {
          ...data,
          sector_interests: Array.isArray(data.sector_interests) 
            ? data.sector_interests.map(item => String(item)) 
            : [],
          investment_horizon: data.investment_horizon as RiskProfile['investment_horizon'],
          investment_goal: data.investment_goal as RiskProfile['investment_goal'],
          risk_tolerance: data.risk_tolerance as RiskProfile['risk_tolerance'],
          investment_experience: data.investment_experience as RiskProfile['investment_experience']
        };
        setRiskProfile(typedData);
        
        toast({
          title: "Success",
          description: "Risk profile saved successfully",
        });
        return typedData; // Return the typed data instead of just data
      }
      
      return false;
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
