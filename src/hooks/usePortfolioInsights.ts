
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioInsight {
  id: string;
  user_id: string;
  insight_type: 'news_impact' | 'rebalancing' | 'risk_warning' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  related_holdings: any[];
  action_required: boolean;
  is_read: boolean;
  expires_at?: string;
  created_at: string;
}

export const usePortfolioInsights = () => {
  const [insights, setInsights] = useState<PortfolioInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching insights:', error);
        toast({
          title: "Error",
          description: "Failed to fetch insights",
          variant: "destructive",
        });
        return;
      }

      // Type cast the data properly
      const typedData: PortfolioInsight[] = (data || []).map(item => ({
        ...item,
        insight_type: item.insight_type as PortfolioInsight['insight_type'],
        severity: item.severity as PortfolioInsight['severity'],
        related_holdings: Array.isArray(item.related_holdings) ? item.related_holdings : []
      }));

      setInsights(typedData);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('portfolio_insights')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking insight as read:', error);
        return false;
      }

      setInsights(prev => prev.map(insight => 
        insight.id === id ? { ...insight, is_read: true } : insight
      ));
      return true;
    } catch (error) {
      console.error('Error marking insight as read:', error);
      return false;
    }
  };

  const unreadCount = insights.filter(insight => !insight.is_read).length;
  const criticalInsights = insights.filter(insight => insight.severity === 'critical' && !insight.is_read);

  return {
    insights,
    loading,
    unreadCount,
    criticalInsights,
    markAsRead,
    refetch: fetchInsights
  };
};
