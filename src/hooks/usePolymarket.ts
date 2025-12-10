import { useQuery } from '@tanstack/react-query';
import type {
  PolymarketMarket,
  PolymarketMarketDetail,
  PolymarketMarketsResponse,
  PolymarketTag,
  PolymarketMarketHistory,
  GraphDataPoint,
} from '@/types/polymarket';

// Use Vite proxy in development to avoid CORS issues
const POLYMARKET_API_BASE = import.meta.env.DEV 
  ? '/api/polymarket' 
  : 'https://gamma-api.polymarket.com';

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

    return {
      id: apiMarket.id || apiMarket.conditionId || apiMarket.marketId || apiMarket.condition_id || '',
      slug: apiMarket.slug || apiMarket.question_id || apiMarket.id || '',
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
}): Promise<PolymarketMarket[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    if (params?.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.active !== undefined) queryParams.append('active', String(params.active));

    const url = `${POLYMARKET_API_BASE}/markets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Polymarket API error:', response.status, errorText);
      throw new Error(`Failed to fetch markets: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
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
export const fetchPolymarketMarketDetail = async (slug: string): Promise<PolymarketMarketDetail | null> => {
  const url = `${POLYMARKET_API_BASE}/markets/${slug}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch market detail: ${response.statusText}`);
  }

  const data = await response.json();
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
};

// Fetch tags
export const fetchPolymarketTags = async (): Promise<PolymarketTag[]> => {
  const url = `${POLYMARKET_API_BASE}/tags`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  const data = await response.json();
  
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

