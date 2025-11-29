import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MorningNewsletter {
  content: string;
  generated_at: string;
  date: string;
}

export const useMorningNewsletter = () => {
  const [newsletter, setNewsletter] = useState<MorningNewsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsletter = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('ai-morning-brief');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      setNewsletter(data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch morning newsletter';
      setError(errorMessage);
      console.error('Error fetching morning newsletter:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletter();
    
    // Refresh once per hour (morning newsletter is generated once per day)
    const interval = setInterval(fetchNewsletter, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { newsletter, loading, error, refetch: fetchNewsletter };
};
