import { useQuery } from '@tanstack/react-query';
import { useSavedOpportunities } from './useSavedOpportunities';
import { fetchPolymarketMarketDetail } from './usePolymarket';
import type { PolymarketMarketDetail } from '@/types/polymarket';

export const useSavedPredictionMarkets = () => {
  const { savedItems, loading: savedItemsLoading, refetch } = useSavedOpportunities();

  // Filter saved items to only prediction markets
  const savedMarketIds = savedItems
    .filter(item => item.item_type === 'prediction_market')
    .map(item => item.item_id);

  // Fetch details for all saved markets
  const { data: markets = [], isLoading: marketsLoading } = useQuery({
    queryKey: ['saved-prediction-markets', savedMarketIds],
    queryFn: async () => {
      if (savedMarketIds.length === 0) return [];

      // Fetch all markets in parallel
      const promises = savedMarketIds.map(id => fetchPolymarketMarketDetail(id));
      const results = await Promise.all(promises);

      // Filter out null results and return valid markets
      return results.filter((m): m is PolymarketMarketDetail => m !== null);
    },
    enabled: savedMarketIds.length > 0 && !savedItemsLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine saved opportunity metadata with market details
  const savedMarketsWithMetadata = markets.map(market => {
    const savedItem = savedItems.find(
      item => item.item_type === 'prediction_market' && item.item_id === market.id
    );

    return {
      market,
      savedItem: savedItem ? {
        id: savedItem.id,
        tags: savedItem.tags,
        notes: savedItem.notes,
        created_at: savedItem.created_at,
        updated_at: savedItem.updated_at,
      } : null,
    };
  });

  return {
    savedMarkets: savedMarketsWithMetadata.map(item => item.market),
    savedMarketsWithMetadata,
    loading: savedItemsLoading || marketsLoading,
    refetch,
  };
};

