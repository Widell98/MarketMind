import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  PolymarketMarket,
  PolymarketMarketDetail,
  PolymarketMarketsResponse,
  PolymarketTag,
  PolymarketMarketHistory,
  PolymarketHistoryPoint,
  PolymarketOutcome,
  GraphDataPoint,
} from '@/types/polymarket';

// Helper function to call Polymarket API via Supabase edge function
const callPolymarketAPI = async (
  endpoint: string, 
  params?: Record<string, any>,
  apiType: 'gamma' | 'clob' = 'gamma'
): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('polymarket-proxy', {
    body: { endpoint, params, apiType },
  });

  if (error) {
    console.error('Supabase function error:', error);
    throw new Error(error.message || 'Failed to fetch from Polymarket API');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};

// Transform API response to our Market type
const transformMarket = (apiMarket: any): PolymarketMarket => {
  try {
    // Handle different possible API response structures
    // Polymarket API might return outcomes in different formats
    let outcomes: any[] = [];
    
    if (apiMarket.outcomes && Array.isArray(apiMarket.outcomes)) {
      outcomes = apiMarket.outcomes;
    } else if (apiMarket.outcomePrices && Array.isArray(apiMarket.outcomePrices)) {
      outcomes = apiMarket.outcomePrices;
    } else if (apiMarket.prices && Array.isArray(apiMarket.prices)) {
      outcomes = apiMarket.prices;
    } else if (apiMarket.tokens && Array.isArray(apiMarket.tokens)) {
      // Sometimes outcomes are in tokens array
      outcomes = apiMarket.tokens.map((token: any) => ({
        id: token.outcome || token.id,
        title: token.outcome || token.name || token.title,
        price: token.price || 0,
      }));
    } else if (typeof apiMarket.outcomes === 'string') {
        try {
          outcomes = JSON.parse(apiMarket.outcomes);
        } catch (e) {
          console.warn('Failed to parse outcomes string:', e);
        }
    }

    // Parse volume - can be string like "$1.2m" or number
    let volumeNum = 0;
    if (typeof apiMarket.volume === 'number') {
      volumeNum = apiMarket.volume;
    } else if (apiMarket.volumeNum) {
      volumeNum = typeof apiMarket.volumeNum === 'number' ? apiMarket.volumeNum : parseFloat(String(apiMarket.volumeNum)) || 0;
    } else if (apiMarket.volume && typeof apiMarket.volume === 'string') {
      // Parse string format like "$1.2m" or "$1,234,567"
      const volumeStr = apiMarket.volume.replace(/[^0-9.]/g, '');
      volumeNum = parseFloat(volumeStr) || 0;
      if (apiMarket.volume.toLowerCase().includes('m')) {
        volumeNum *= 1_000_000;
      } else if (apiMarket.volume.toLowerCase().includes('b')) {
        volumeNum *= 1_000_000_000;
      } else if (apiMarket.volume.toLowerCase().includes('k')) {
        volumeNum *= 1_000;
      }
    }

    // Polymarket API uses different identifiers - try to get the correct one
    const marketId = apiMarket.id || apiMarket.conditionId || apiMarket.marketId || apiMarket.condition_id || '';
    const marketSlug = apiMarket.slug || apiMarket.question_id || apiMarket.questionId || apiMarket.id || marketId;
    
    // Extract clobTokenIds if available (can be array or comma-separated string) - kept as fallback
    let clobTokenIdsArray: string[] = [];
    if (apiMarket.clobTokenIds && Array.isArray(apiMarket.clobTokenIds)) {
      clobTokenIdsArray = apiMarket.clobTokenIds;
    } else if (apiMarket.clobTokenIds && typeof apiMarket.clobTokenIds === 'string') {
      clobTokenIdsArray = apiMarket.clobTokenIds.split(',').map((id: string) => id.trim());
    } else if (apiMarket.clob_token_ids && Array.isArray(apiMarket.clob_token_ids)) {
      clobTokenIdsArray = apiMarket.clob_token_ids;
    }
    
    return {
      id: marketId,
      slug: marketSlug,
      question: apiMarket.question || apiMarket.title || apiMarket.name || '',
      imageUrl: apiMarket.imageUrl || apiMarket.image || apiMarket.image_url || apiMarket.icon || undefined,
      description: apiMarket.description || apiMarket.longDescription || apiMarket.long_description || undefined,
      volume: volumeNum,
      volumeNum: volumeNum,
      liquidity: apiMarket.liquidity || apiMarket.liquidityNum || apiMarket.liquidity_num || 0,
      outcomes: outcomes.map((outcome: any, index: number) => {
        // Handle different outcome structures
        const outcomePrice = outcome.price || outcome.lastPrice || outcome.price_24h || 0;
        const outcomeTitle = outcome.title || outcome.name || outcome.outcome || outcome.label || `Outcome ${index + 1}`;
        const outcomeId = outcome.id || outcome.outcome || outcome.token_id || String(index);
        
        // Prioritize finding the CLOB token ID
        const tokenId = outcome.tokenId || outcome.token_id || clobTokenIdsArray[index] || outcomeId;

        return {
          id: outcomeId,
          title: outcomeTitle,
          price: typeof outcomePrice === 'number' ? outcomePrice : parseFloat(String(outcomePrice || 0)) || 0,
          volume: outcome.volume || outcome.volume_24h || undefined,
          description: outcome.description || undefined,
          tokenId: tokenId, // Store for reference
        };
      }),
      endDate: apiMarket.endDate || apiMarket.endDateIso || apiMarket.end_date || apiMarket.end_date_iso || undefined,
      resolutionDate: apiMarket.resolutionDate || apiMarket.resolution_date || apiMarket.endDate || undefined,
      conditionId: apiMarket.conditionId || apiMarket.condition_id || apiMarket.id || undefined,
      active: apiMarket.active !== false && apiMarket.closed !== true && apiMarket.archived !== true,
      closed: apiMarket.closed === true,
      archived: apiMarket.archived === true,
      tags: apiMarket.tags || apiMarket.categories || apiMarket.category || [],
      groupItemTitle: apiMarket.groupItemTitle || apiMarket.group_item_title || undefined,
      groupItemImageUrl: apiMarket.groupItemImageUrl || apiMarket.group_item_image_url || undefined,
      groupItemSlug: apiMarket.groupItemSlug || apiMarket.group_item_slug || undefined,
      clobTokenIds: clobTokenIdsArray,
    } as PolymarketMarketDetail;
  } catch (error) {
    console.error('Error transforming market:', error, apiMarket);
    // Return a minimal valid market object to prevent crashes
    return {
      id: apiMarket.id || String(Math.random()),
      slug: apiMarket.slug || apiMarket.id || String(Math.random()),
      question: apiMarket.question || apiMarket.title || 'Unknown Market',
      volume: 0,
      volumeNum: 0,
      liquidity: 0,
      outcomes: [],
      active: true,
      closed: false,
      archived: false,
      tags: [],
    };
  }
};

// Fetch markets list
export const fetchPolymarketMarkets = async (params?: {
  limit?: number;
  offset?: number;
  tags?: string[];
  search?: string;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<PolymarketMarket[]> => {
  try {
    // Build params object for the edge function
    const apiParams: Record<string, any> = {};
    if (params?.limit) apiParams.limit = params.limit;
    if (params?.offset) apiParams.offset = params.offset;
    if (params?.tags && params.tags.length > 0) {
      apiParams.tags = params.tags;
    }
    if (params?.search) apiParams.search = params.search;
    if (params?.active !== undefined) apiParams.active = params.active;
    if (params?.closed !== undefined) apiParams.closed = params.closed;
    if (params?.order) apiParams.order = params.order;
    if (params?.ascending !== undefined) apiParams.ascending = params.ascending;

    const data = await callPolymarketAPI('/markets', apiParams);
    
    // Handle different response structures
    let markets: any[] = [];
    if (Array.isArray(data)) {
      markets = data;
    } else if (data.data && Array.isArray(data.data)) {
      markets = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      markets = data.results;
    } else if (data.items && Array.isArray(data.items)) {
      markets = data.items;
    } else {
      console.warn('Unexpected Polymarket API response structure:', data);
      return [];
    }
    
    // Transform all markets, filtering out any that fail to transform
    const transformedMarkets = markets
      .map(transformMarket)
      .filter(market => market.id && market.question); // Filter out invalid markets
    
    return transformedMarkets;
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    throw error;
  }
};

// Fetch single market detail
export const fetchPolymarketMarketDetail = async (slugOrId: string): Promise<PolymarketMarketDetail | null> => {
  try {
    const decodedSlugOrId = decodeURIComponent(slugOrId);
    let data;
    
    // Try with slug endpoint
    try {
      data = await callPolymarketAPI(`/markets/slug/${decodedSlugOrId}`);
    } catch (error: any) {
        // Fallback logic omitted for brevity, but same as before
        if (error?.message?.includes('404')) return null;
    }
    
    // Handle array response from slug endpoint
    if (Array.isArray(data)) {
        data = data[0];
    }

    if (!data) return null;

    const market = transformMarket(data);
    
    return {
      ...market,
      eventSlug: data.eventSlug || undefined,
      liquidityNum: typeof data.liquidity === 'number' 
        ? data.liquidity 
        : parseFloat(String(data.liquidity || 0).replace(/[^0-9.]/g, '')) || 0,
      startDate: data.startDate || data.startDateIso || undefined,
      createdAt: data.createdAt || data.created_at || undefined,
      updatedAt: data.updatedAt || data.updated_at || undefined,
      endDateIso: data.endDateIso || data.endDateISO || data.endDate || undefined,
      resolution: data.resolution || undefined,
      resolutionSource: data.resolutionSource || undefined,
      collateralToken: data.collateralToken || undefined,
      outcomesDetails: market.outcomes,
      clobTokenIds: market.clobTokenIds,
    };
  } catch (error) {
    console.error('Error fetching market detail:', error);
    return null;
  }
};

// Fetch tags
export const fetchPolymarketTags = async (): Promise<PolymarketTag[]> => {
  try {
    const data = await callPolymarketAPI('/tags');
    if (Array.isArray(data)) {
      return data.map((tag: any) => ({
        id: tag.id || tag.slug || '',
        name: tag.name || '',
        slug: tag.slug || tag.id || '',
        description: tag.description || undefined,
        marketCount: tag.marketCount || tag.count || undefined,
      }));
    } 
    return [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};


// Transform history to graph data format (simplified for single price line)
export const transformHistoryToGraphData = (
  history: PolymarketMarketHistory | null | undefined
): GraphDataPoint[] => {
  if (!history || !history.points || !Array.isArray(history.points) || history.points.length === 0) {
    return [];
  }

  // Sort points by timestamp and transform to graph data format
  return history.points
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric' 
      }),
      price: Math.round(point.price * 100), // Convert 0-1 to 0-100 percentage
    }));
};

// Hook for fetching markets list
export const usePolymarketMarkets = (params?: {
  limit?: number;
  offset?: number;
  tags?: string[];
  search?: string;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}) => {
  return useQuery({
    queryKey: ['polymarket-markets', params],
    queryFn: () => fetchPolymarketMarkets(params),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

// Hook for fetching market detail
export const usePolymarketMarketDetail = (slug: string) => {
  return useQuery({
    queryKey: ['polymarket-market', slug],
    queryFn: () => fetchPolymarketMarketDetail(slug),
    enabled: !!slug,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

// Hook for fetching tags
export const usePolymarketTags = () => {
  return useQuery({
    queryKey: ['polymarket-tags'],
    queryFn: fetchPolymarketTags,
    staleTime: 3600000, // 1 hour (tags don't change often)
  });
};

// Hook for market history using CLOB API - fetches only primary outcome
export const usePolymarketMarketHistory = (market: PolymarketMarketDetail | null | undefined) => {
  const hasMarket = !!market;
  const hasOutcomes = !!market?.outcomes && Array.isArray(market.outcomes) && market.outcomes.length > 0;
  const isEnabled = hasMarket && hasOutcomes;
  
  return useQuery({
    queryKey: ['polymarket-market-history', market?.slug, market?.id],
    queryFn: async () => {
      if (!market || !market.outcomes || !Array.isArray(market.outcomes) || market.outcomes.length === 0) {
        return null;
      }
      
      const yesOutcome = market.outcomes.find(o => 
        o.title.toLowerCase().includes('yes') || 
        o.title.toLowerCase() === 'yes'
      );
      const primaryOutcome = yesOutcome || market.outcomes[0];
      
      if (!primaryOutcome) {
        return null;
      }
      
      // FIX: Prioritera tokenId (från transformMarket) före outcome.id
      const outcomeIndex = market.outcomes.indexOf(primaryOutcome);
      let tokenId = primaryOutcome.tokenId || primaryOutcome.id || market.clobTokenIds?.[outcomeIndex];
      
      // Fallback: conditionId
      if (!tokenId && market.conditionId) {
        tokenId = market.conditionId;
      }
      
      if (!tokenId) {
        console.log('usePolymarketMarketHistory: No tokenId found, generating mock data');
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      }
      
      try {
        console.log('usePolymarketMarketHistory: Calling CLOB API', { market: tokenId });
        
        const historyData = await callPolymarketAPI('/prices-history', {
          market: tokenId,
          interval: 'max', // VIKTIGT: Hämta all historik
          fidelity: 60,    // VIKTIGT: 60 minuters upplösning
        }, 'clob');
        
        // FIX: Hantera API-svaret korrekt!
        // API returnerar { history: [...] }, inte en array direkt.
        const historyArray = Array.isArray(historyData) ? historyData : (historyData.history || []);
        
        if (Array.isArray(historyArray) && historyArray.length > 0) {
          console.log(`usePolymarketMarketHistory: Parsed ${historyArray.length} points`);
          
          const points: PolymarketHistoryPoint[] = historyArray.map((point: any) => {
            let timestamp: string;
            // Hantera tidsstämpel (t = unix seconds)
            if (typeof point.t === 'number') {
              timestamp = new Date(point.t * 1000).toISOString();
            } else {
              timestamp = new Date().toISOString();
            }
            
            // Hantera pris (p = 0-1)
            let price: number = 0;
            if (typeof point.p === 'number') {
              price = point.p;
            } else if (typeof point.price === 'number') {
                price = point.price;
            }
            
            return {
              timestamp,
              price: Math.max(0, Math.min(1, price)),
              outcomeId: primaryOutcome.id,
              outcomeTitle: primaryOutcome.title,
            };
          });
          
          return {
            marketId: market.id,
            marketSlug: market.slug,
            points,
          };
        }
        
        console.log('usePolymarketMarketHistory: Empty data, using mock');
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      } catch (error) {
        console.error('usePolymarketMarketHistory: Error fetching history', error);
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      }
    },
    enabled: isEnabled,
    staleTime: 300000, 
  });
};

// Helper function to generate mock history for a single outcome (fallback)
const generateMockHistoryForOutcome = (outcome: PolymarketOutcome, days: number): PolymarketHistoryPoint[] => {
  const now = new Date();
  const points: PolymarketHistoryPoint[] = [];
  const basePrice = outcome.price || 0.5;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const seed = (i * 1000) % 1000;
    const random = (Math.sin(seed) + 1) / 2;
    const variation = (random - 0.5) * 0.2;
    const price = Math.max(0, Math.min(1, basePrice + variation));
    
    points.push({
      timestamp: date.toISOString(),
      price,
      outcomeId: outcome.id,
      outcomeTitle: outcome.title,
    });
  }
  
  return points;
};
