import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RiskProfile {
  id: string;
  user_id: string;
  // Grundläggande information
  age: number | null;
  annual_income: number | null;
  housing_situation: string | null;
  has_loans: boolean | null;
  loan_details: string | null;
  has_children: boolean | null;
  liquid_capital: number | null;
  emergency_buffer_months: number | null;
  
  // Sparmål och tidshorisont
  investment_purpose: string[] | null;
  target_amount: number | null;
  target_date: string | null;
  investment_horizon: 'short' | 'medium' | 'long' | null;
  investment_goal: 'growth' | 'income' | 'preservation' | 'balanced' | null;
  monthly_investment_amount: number | null;
  
  // Portföljpreferenser
  preferred_stock_count: number | null;
  preferred_assets: string[] | null;

  // Riskprofil och psykologi
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | null;
  risk_comfort_level: number | null;
  panic_selling_history: boolean | null;
  control_importance: number | null;
  market_crash_reaction: string | null;
  sustainability_focus: string | null;

  // Optimerings- och rådgivningspreferenser
  portfolio_help_focus: string | null;
  current_portfolio_strategy: string | null;
  optimization_goals: string[] | null;
  optimization_risk_focus: string | null;
  optimization_diversification_focus: string[] | null;
  optimization_preference: string | null;
  optimization_timeline: string | null;

  // Investeringsstil
  portfolio_change_frequency: string | null;
  activity_preference: string | null;
  investment_style_preference: string | null;
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | null;
  
  // Nuvarande innehav
  current_portfolio_value: number | null;
  overexposure_awareness: string | null;
  sector_interests: string[];
  current_holdings: any[] | null;
  current_allocation: any | null;
  
  created_at: string;
  updated_at: string;
}

// Helper function to safely convert Json to string array
const jsonToStringArray = (jsonValue: any): string[] => {
  if (Array.isArray(jsonValue)) {
    return jsonValue.map(item => String(item));
  }
  if (typeof jsonValue === 'string') {
    try {
      const parsed = JSON.parse(jsonValue);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper function to safely convert Json to any array
const jsonToArray = (jsonValue: any): any[] => {
  if (Array.isArray(jsonValue)) {
    return jsonValue;
  }
  if (typeof jsonValue === 'string') {
    try {
      const parsed = JSON.parse(jsonValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

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
      setLoading(true);
      
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
        const typedData: RiskProfile = {
          ...data,
          sector_interests: jsonToStringArray(data.sector_interests),
          investment_purpose: jsonToStringArray(data.investment_purpose),
          current_holdings: jsonToArray(data.current_holdings),
          preferred_assets: jsonToStringArray(data.preferred_assets),
          optimization_goals: jsonToStringArray(data.optimization_goals),
          optimization_diversification_focus: jsonToStringArray(data.optimization_diversification_focus),
          investment_horizon: data.investment_horizon as RiskProfile['investment_horizon'],
          investment_goal: data.investment_goal as RiskProfile['investment_goal'],
          risk_tolerance: data.risk_tolerance as RiskProfile['risk_tolerance'],
          investment_experience: data.investment_experience as RiskProfile['investment_experience']
        };
        setRiskProfile(typedData);
        return typedData;
      } else {
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
        const typedData: RiskProfile = {
          ...data,
          sector_interests: jsonToStringArray(data.sector_interests),
          investment_purpose: jsonToStringArray(data.investment_purpose),
          current_holdings: jsonToArray(data.current_holdings),
          optimization_goals: jsonToStringArray(data.optimization_goals),
          optimization_diversification_focus: jsonToStringArray(data.optimization_diversification_focus),
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
        return typedData;
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

  const clearRiskProfile = async () => {
    if (!user) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_risk_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing risk profile:', error);
        toast({
          title: "Fel",
          description: "Kunde inte radera riskprofilen",
          variant: "destructive",
        });
        return false;
      }

      setRiskProfile(null);
      
      toast({
        title: "Profil raderad",
        description: "Din riskprofil har raderats framgångsrikt",
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing risk profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera riskprofilen",
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
    clearRiskProfile,
    refetch: fetchRiskProfile
  };
};
