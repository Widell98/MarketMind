
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
      console.log('Fetching portfolios for user:', user?.id);
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
        toast({
          title: "Error",
          description: "Failed to fetch portfolios",
          variant: "destructive",
        });
      } else if (data) {
        console.log('Fetched portfolios:', data);
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
        console.log('Active portfolio:', active);
        setActivePortfolio(active || null);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolios",
        variant: "destructive",
      });
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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate a portfolio",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting portfolio generation for risk profile:', riskProfileId);
      setLoading(true);
      
      // Get the current session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid session found:', sessionError);
        toast({
          title: "Error",
          description: "Please sign in again to generate portfolio",
          variant: "destructive",
        });
        return;
      }

      console.log('Calling edge function with session token and risk_profile_id:', riskProfileId);
      
      // Make sure we're sending the correct payload format
      const requestBody = { risk_profile_id: riskProfileId };
      console.log('Request body being sent:', requestBody);
      
      const response = await supabase.functions.invoke('generate-portfolio', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Portfolio generation response:', response);

      if (response.error) {
        console.error('Error generating portfolio:', response.error);
        toast({
          title: "Error",
          description: response.error.message || "Failed to generate portfolio",
          variant: "destructive",
        });
        return;
      }

      if (response.data?.success) {
        console.log('Portfolio generated successfully, refetching data...');
        await fetchPortfolios();
        await fetchRecommendations();
        
        toast({
          title: "Success",
          description: "Portfolio generated successfully",
        });
      } else {
        console.error('Portfolio generation failed:', response.data);
        toast({
          title: "Error",
          description: response.data?.error || "Failed to generate portfolio",
          variant: "destructive",
        });
      }
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
