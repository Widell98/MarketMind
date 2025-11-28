import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Portfolio } from './usePortfolio';

export const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    } else {
      setPortfolios([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPortfolios = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching portfolios:', error);
        return;
      }

      if (data && data.length > 0) {
        const portfolio = data[0];
        const formattedPortfolio: Portfolio = {
          ...portfolio,
          recommended_stocks: Array.isArray(portfolio.recommended_stocks) 
            ? portfolio.recommended_stocks 
            : []
        };
        setPortfolios([formattedPortfolio]);
      } else {
        setPortfolios([]);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (user) {
      await fetchPortfolios();
    }
  };

  return {
    portfolios,
    loading,
    refetch
  };
};
