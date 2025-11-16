import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { featureFlags } from '@/config/features';
import { polymarketClient } from '@/lib/api/polymarket';
import type { PolymarketMarket, PolymarketMarketFilters } from '@/types/polymarket';

type PolymarketQueryKey = ['polymarket-markets', PolymarketMarketFilters];

type PolymarketQueryOptions = Omit<
  UseQueryOptions<PolymarketMarket[], Error, PolymarketMarket[], PolymarketQueryKey>,
  'queryKey' | 'queryFn'
>;

export const usePolymarketMarkets = (filters: PolymarketMarketFilters, options?: PolymarketQueryOptions) => {
  return useQuery<PolymarketMarket[], Error, PolymarketMarket[], PolymarketQueryKey>({
    queryKey: ['polymarket-markets', filters],
    queryFn: () => polymarketClient.fetchMarkets(filters),
    enabled: featureFlags.polymarket.enabled && (options?.enabled ?? true),
    staleTime: featureFlags.polymarket.cacheTtlMs,
    ...options,
  });
};
