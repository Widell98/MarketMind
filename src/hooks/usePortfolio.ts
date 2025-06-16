
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Portfolio {
  id: string;
  user_id: string;
  risk_profile_id: string;
  portfolio_name: string;
  asset_allocation: Record<string, number>;
  recommended_stocks: any[];
  total_value: number | null;
  expected_return: number | null;
  risk_score: number | null;
  last_rebalanced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioRecommendation {
  id: string;
  user_id: string;
  portfolio_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  ai_reasoning: string | null;
  priority: string;
  is_implemented: boolean;
  valid_until: string | null;
  created_at: string;
}

export const usePortfolio = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [recommendations, setRecommendations] = useState<PortfolioRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPortfolios();
      fetchRecommendations();
    }
  }, [user]);

  const fetchPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
      } else if (data) {
        // Cast the database data to our interface type
        const typedPortfolios: Portfolio[] = data.map(item => ({
          ...item,
          asset_allocation: typeof item.asset_allocation === 'object' && item.asset_allocation !== null 
            ? item.asset_allocation as Record<string, number>
            : {},
          recommended_stocks: Array.isArray(item.recommended_stocks) ? item.recommended_stocks : []
        }));
        
        setPortfolios(typedPortfolios);
        const active = typedPortfolios.find(p => p.is_active);
        setActivePortfolio(active || null);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_implemented', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
      } else {
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const generatePortfolio = async (riskProfileId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await supabase.functions.invoke('generate-portfolio', {
        body: { risk_profile_id: riskProfileId }
      });

      if (response.error) {
        console.error('Error generating portfolio:', response.error);
        toast({
          title: "Error",
          description: "Failed to generate portfolio",
          variant: "destructive",
        });
        return;
      }

      await fetchPortfolios();
      await fetchRecommendations();
      
      toast({
        title: "Success",
        description: "Portfolio generated successfully",
      });
    } catch (error) {
      console.error('Error generating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to generate portfolio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    portfolios,
    activePortfolio,
    recommendations,
    loading,
    generatePortfolio,
    refetch: fetchPortfolios
  };
};
