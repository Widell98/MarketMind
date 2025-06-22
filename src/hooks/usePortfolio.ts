import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Portfolio {
  id: string;
  user_id: string;
  risk_profile_id: string;
  portfolio_name: string;
  asset_allocation: any;
  recommended_stocks: any[];
  total_value: number;
  expected_return: number;
  risk_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  portfolio_id: string;
  title: string;
  description: string;
  ai_reasoning?: string;
  priority?: string;
  created_at: string;
}

// Add the missing PortfolioRecommendation export (alias for Recommendation)
export type PortfolioRecommendation = Recommendation;

export const usePortfolio = () => {
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchActivePortfolio();
      fetchRecommendations();
    } else {
      setActivePortfolio(null);
      setRecommendations([]);
      setLoading(false);
    }
  }, [user]);

  const fetchActivePortfolio = async () => {
    if (!user) return;

    try {
      console.log('Fetching active portfolio for user:', user.id);
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching portfolio:', error);
        return;
      }

      if (data) {
        console.log('Found active portfolio:', data.id);
        // Convert the data to match our Portfolio interface
        const portfolio: Portfolio = {
          ...data,
          recommended_stocks: Array.isArray(data.recommended_stocks) ? data.recommended_stocks : []
        };
        setActivePortfolio(portfolio);
      } else {
        console.log('No active portfolio found');
        setActivePortfolio(null);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portfolio_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return;
      }

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const generatePortfolio = async (riskProfileId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting portfolio generation for user:', user.id, 'risk profile:', riskProfileId);

      // Call the edge function without authentication headers since it's now public
      const { data, error } = await supabase.functions.invoke('generate-portfolio', {
        body: { 
          riskProfileId,
          userId: user.id
        }
      });

      console.log('Generate portfolio response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Portfolio generation failed: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('Portfolio generation was not successful:', data);
        throw new Error(data?.error || 'Failed to generate portfolio - unknown error');
      }

      console.log('Portfolio generated successfully:', data.portfolio);
      
      // Convert the response data to match our Portfolio interface
      const portfolio: Portfolio = {
        ...data.portfolio,
        recommended_stocks: Array.isArray(data.portfolio.recommended_stocks) ? data.portfolio.recommended_stocks : []
      };
      setActivePortfolio(portfolio);
      
      // Refresh recommendations after portfolio creation
      await fetchRecommendations();
      
      toast({
        title: "Success",
        description: "Portfolio generated successfully!",
      });

    } catch (error: any) {
      console.error('Error generating portfolio:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate portfolio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (user) {
      setLoading(true);
      await Promise.all([fetchActivePortfolio(), fetchRecommendations()]);
    }
  };

  return {
    activePortfolio,
    recommendations,
    loading,
    generatePortfolio,
    refetch
  };
};
