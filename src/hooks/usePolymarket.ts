import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  PolymarketMarket,
  PolymarketMarketDetail,
  PolymarketMarketsResponse,
  PolymarketTag,
  PolymarketMarketHistory,
  GraphDataPoint,
} from '@/types/polymarket';

// Helper function to call Polymarket API via Supabase edge function
const callPolymarketAPI = async (endpoint: string, params?: Record<string, any>): Promise<any> => {
  const { data, error } = await supabase.functions.invoke('polymarket-proxy', {
    body: { endpoint, params },
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

        return {
          id: outcomeId,
          title: outcomeTitle,
          price: typeof outcomePrice === 'number' ? outcomePrice : parseFloat(String(outcomePrice || 0)) || 0,
          volume: outcome.volume || outcome.volume_24h || undefined,
          description: outcome.description || undefined,
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
    };
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
    
    console.log('Polymarket API response structure:', {
      isArray: Array.isArray(data),
      hasData: !!data.data,
      hasResults: !!data.results,
      keys: Object.keys(data),
      firstItem: Array.isArray(data) ? data[0] : data.data?.[0] || data.results?.[0] || null,
    });
    
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
      // Try to return empty array instead of throwing
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
    // Decode the identifier in case it's URL encoded
    const decodedSlugOrId = decodeURIComponent(slugOrId);
    
    // According to Polymarket docs, we should use /markets/slug/{slug} for individual markets
    // But if we have an ID instead of slug, we need to search for the market first
    let data;
    let lastError;
    
    // First try with /markets/slug/{slug} endpoint (recommended by docs)
    try {
      data = await callPolymarketAPI(`/markets/slug/${decodedSlugOrId}`);
      console.log('Successfully fetched market with slug endpoint:', `/markets/slug/${decodedSlugOrId}`);
    } catch (error: any) {
      lastError = error;
      console.log(`Failed to fetch with /markets/slug/${decodedSlugOrId}:`, error.message);
      
      // If slug endpoint fails, try the old format /markets/{slug} as fallback
      try {
        data = await callPolymarketAPI(`/markets/${decodedSlugOrId}`);
        console.log('Successfully fetched market with direct path:', `/markets/${decodedSlugOrId}`);
      } catch (error2: any) {
        lastError = error2;
        console.log(`Failed to fetch with /markets/${decodedSlugOrId}:`, error2.message);
        
        // If both fail with validation error (422), the identifier might be an ID instead of slug
        // Search for the market in the list to find its slug
        if (error2?.message?.includes('422') || error2?.message?.includes('invalid') || error2?.message?.includes('validation')) {
          console.log('Identifier might be an ID, searching for market in list...');
          try {
            // Search for markets and find the one matching our slug/id
            const searchData = await callPolymarketAPI('/markets', { 
              limit: 200,
              active: true 
            });
            
            // Find the market that matches our slug or id
            let markets: any[] = [];
            if (Array.isArray(searchData)) {
              markets = searchData;
            } else if (searchData.data && Array.isArray(searchData.data)) {
              markets = searchData.data;
            } else if (searchData.results && Array.isArray(searchData.results)) {
              markets = searchData.results;
            }
            
            // Try to find matching market by conditionId, id, or slug
            const matchingMarket = markets.find((m: any) => {
              const mConditionId = m.conditionId || m.condition_id || '';
              const mId = m.id || m.marketId || '';
              const mSlug = m.slug || m.question_id || m.questionId || '';
              
              // Check all identifiers
              return (
                (mConditionId && (mConditionId === decodedSlugOrId || String(mConditionId).toLowerCase() === String(decodedSlugOrId).toLowerCase())) ||
                (mId && (mId === decodedSlugOrId || String(mId).toLowerCase() === String(decodedSlugOrId).toLowerCase())) ||
                (mSlug && (mSlug === decodedSlugOrId || String(mSlug).toLowerCase() === String(decodedSlugOrId).toLowerCase()))
              );
            });
            
            if (matchingMarket) {
              data = matchingMarket;
              console.log('Found matching market by searching, using that data');
            } else {
              console.log('No matching market found in search results');
            }
          } catch (error3: any) {
            lastError = error3;
            console.log('Search alternative also failed:', error3.message);
          }
        }
      }
    }
    
    if (!data) {
      console.error('Could not fetch market detail. Last error:', lastError);
      return null;
    }

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
    };
  } catch (error) {
    console.error('Error fetching market detail:', error);
    // If it's a 404 or 422, return null
    if (error instanceof Error && (error.message.includes('404') || error.message.includes('422') || error.message.includes('invalid'))) {
      return null;
    }
    throw error;
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
    } else if (data.data && Array.isArray(data.data)) {
      return data.data.map((tag: any) => ({
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

// Generate mock history data (since Polymarket API may not provide historical data directly)
// In a real implementation, you might want to cache prices over time or use a different data source
const generateMockHistory = (
  market: PolymarketMarketDetail,
  days: number = 30
): PolymarketMarketHistory => {
  const now = new Date();
  const history: PolymarketMarketHistory = {
    marketId: market.id,
    marketSlug: market.slug,
    outcomes: {},
  };

  market.outcomes.forEach((outcome) => {
    const points: any[] = [];
    const basePrice = outcome.price;
    
    // Generate historical points with some variation
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some random variation to simulate price movement
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const price = Math.max(0, Math.min(1, basePrice + variation));
      
      points.push({
        timestamp: date.toISOString(),
        price,
        outcomeId: outcome.id,
        outcomeTitle: outcome.title,
      });
    }
    
    history.outcomes[outcome.id] = points;
  });

  return history;
};

// Transform history to graph data format
export const transformHistoryToGraphData = (
  history: PolymarketMarketHistory
): GraphDataPoint[] => {
  if (!history.outcomes || Object.keys(history.outcomes).length === 0) {
    return [];
  }

  // Get all timestamps
  const allTimestamps = new Set<string>();
  Object.values(history.outcomes).forEach((points) => {
    points.forEach((point) => {
      allTimestamps.add(point.timestamp);
    });
  });

  const sortedTimestamps = Array.from(allTimestamps).sort();

  // Create data points for each timestamp
  return sortedTimestamps.map((timestamp) => {
    const point: GraphDataPoint = {
      date: new Date(timestamp).toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric' 
      }),
    };

    Object.entries(history.outcomes).forEach(([outcomeId, points]) => {
      const pointAtTime = points.find((p) => p.timestamp === timestamp);
      if (pointAtTime) {
        point[pointAtTime.outcomeTitle] = Math.round(pointAtTime.price * 100);
      }
    });

    return point;
  });
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

// Hook for market history (with mock data generation for now)
export const usePolymarketMarketHistory = (market: PolymarketMarketDetail | null | undefined) => {
  return useQuery({
    queryKey: ['polymarket-market-history', market?.slug],
    queryFn: () => {
      if (!market) return null;
      return generateMockHistory(market, 90); // Last 90 days
    },
    enabled: !!market,
    staleTime: 300000, // 5 minutes
  });
};

