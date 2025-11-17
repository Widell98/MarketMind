
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketDataResponse {
  marketIndices: any[];
  topStocks: any[];
  bottomStocks: any[];
  lastUpdated: string;
}

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('fetch-market-data');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      setMarketData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { marketData, loading, error, refetch: fetchMarketData };
};
