
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
    if (!user) {
      setSubscription({ subscribed: false, subscription_tier: 'free' });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Subscription check error:', error);
        // Vid fel, sätt gratis plan som fallback
        setSubscription({ subscribed: false, subscription_tier: 'free' });
        return;
      }
      
      // Säkerställ att vi alltid har en giltig subscription tier
      const subscriptionData = {
        subscribed: data?.subscribed || false,
        subscription_tier: data?.subscription_tier || 'free',
        subscription_end: data?.subscription_end
      };
      
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Vid fel, sätt gratis plan som fallback
      setSubscription({ subscribed: false, subscription_tier: 'free' });
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Usage fetch error:', error);
      }
      
      const usageData = data && data.length > 0 ? data[0] : {
        ai_messages_count: 0,
        analysis_count: 0,
        insights_count: 0,
        predictive_analysis_count: 0,
      };
      
      setUsage(usageData);
    } catch (error) {
      console.error('Error fetching usage:', error);
      setUsage({
        ai_messages_count: 0,
        analysis_count: 0,
        insights_count: 0,
        predictive_analysis_count: 0,
      });
    }
  };

  const createCheckout = async (tier: 'premium' | 'pro') => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att uppgradera",
        variant: "destructive",
      });
      return;
    }

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
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att hantera din prenumeration",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Opening customer portal for user:', user.email);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Customer portal error:', error);
        throw new Error(error.message || 'Kunde inte öppna kundportal');
      }
      
      if (data?.url) {
        console.log('Redirecting to customer portal:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('Ingen portal-URL mottagen');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna kundportalen. Kontrollera att du har en aktiv prenumeration och försök igen.",
        variant: "destructive",
      });
    }
  };

  const checkUsageLimit = (type: 'ai_message' | 'analysis' | 'insights' | 'predictive_analysis'): boolean => {
    if (!subscription || !usage) return false;
    if (subscription.subscribed) return true;
    
    const limit = 5;
    const currentUsage = usage[`${type}_count` as keyof UsageData] || 0;
    return currentUsage < limit;
  };

  const getRemainingUsage = (type: 'ai_message' | 'analysis' | 'insights' | 'predictive_analysis'): number => {
    if (!usage || subscription?.subscribed) return Infinity;
    const limit = 5;
    const currentUsage = usage[`${type}_count` as keyof UsageData] || 0;
    return Math.max(0, limit - currentUsage);
  };

  useEffect(() => {
    if (user) {
      Promise.all([checkSubscription(), fetchUsage()]).finally(() => {
        setLoading(false);
      });
    } else {
      // Om ingen användare är inloggad, sätt gratis plan
      setSubscription({ subscribed: false, subscription_tier: 'free' });
      setUsage({
        ai_messages_count: 0,
        analysis_count: 0,
        insights_count: 0,
        predictive_analysis_count: 0,
      });
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
