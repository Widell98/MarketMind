
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'premium' | 'pro';
  subscription_end?: string;
}

interface UsageData {
  ai_messages_count: number;
  analysis_count: number;
  insights_count: number;
  predictive_analysis_count: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta prenumerationsstatus",
        variant: "destructive",
      });
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setUsage(data || {
        ai_messages_count: 0,
        analysis_count: 0,
        insights_count: 0,
        predictive_analysis_count: 0,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const createCheckout = async (tier: 'premium' | 'pro') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa checkout session",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna kundportal",
        variant: "destructive",
      });
    }
  };

  const checkUsageLimit = (type: 'ai_message' | 'analysis' | 'insights' | 'predictive_analysis'): boolean => {
    if (!subscription || !usage) return false;
    if (subscription.subscribed) return true; // Premium users have unlimited usage
    
    const limit = 5; // Free tier daily limit changed to 5
    const currentUsage = usage[`${type}_count` as keyof UsageData] || 0;
    return currentUsage < limit;
  };

  const getRemainingUsage = (type: 'ai_message' | 'analysis' | 'insights' | 'predictive_analysis'): number => {
    if (!usage || subscription?.subscribed) return Infinity;
    const limit = 5; // Free tier daily limit changed to 5
    const currentUsage = usage[`${type}_count` as keyof UsageData] || 0;
    return Math.max(0, limit - currentUsage);
  };

  useEffect(() => {
    if (user) {
      Promise.all([checkSubscription(), fetchUsage()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    subscription,
    usage,
    loading,
    checkSubscription,
    fetchUsage,
    createCheckout,
    openCustomerPortal,
    checkUsageLimit,
    getRemainingUsage,
  };
};
