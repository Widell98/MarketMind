
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

export const useNewsData = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('fetch-news-data');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      setNewsData(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news data';
      setError(errorMessage);
      console.error('Error fetching news data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
    
    // Refresh data every 10 minutes
    const interval = setInterval(fetchNewsData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { newsData, loading, error, refetch: fetchNewsData };
};
