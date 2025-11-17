import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface MarketOverviewInsight {
  id: string;
  title: string;
  content: string;
  confidence_score?: number;
  insight_type?: string;
  key_factors?: string[];
  sentiment?: Sentiment;
}

const FALLBACK_INSIGHTS: MarketOverviewInsight[] = [
  {
    id: 'fallback-1',
    title: 'Blandad öppning för globala index',
    content:
      'Marknaden inledde dagen försiktigt med svaga rörelser efter nattens inflationssiffror. Investerare väntar på nästa signal från centralbankerna.',
    confidence_score: 0.52,
    insight_type: 'macro',
    key_factors: ['Inflation', 'Centralbanker', 'Riskaptit'],
    sentiment: 'neutral',
  },
];

export const useMarketOverviewInsights = () => {
  const { user } = useAuth();

  return useQuery<MarketOverviewInsight[]>({
    queryKey: ['market-overview-insights', user?.id ?? 'anonymous'],
    queryFn: async () => {
      if (!user) {
        return FALLBACK_INSIGHTS;
      }

      try {
        const { data, error } = await supabase.functions.invoke('ai-market-insights', {
          body: {
            type: 'market_overview',
            personalized: false,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!Array.isArray(data) || data.length === 0) {
          return FALLBACK_INSIGHTS;
        }

        return data;
      } catch (err) {
        console.error('Failed to fetch market overview insights:', err);
        return FALLBACK_INSIGHTS;
      }
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const getFallbackMarketOverviewInsights = () => FALLBACK_INSIGHTS;
