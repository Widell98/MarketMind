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
      clobTokenIdsArray = apiMarket.clobTokenIds.split(',').map(id => id.trim());
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
        
        // Use outcome.id directly as tokenId (primary method per Polymarket docs)
        // Store clobTokenIds array index as fallback if needed
        // Note: outcome.id is typically the token ID for CLOB API
        const tokenId = outcomeId; // outcome.id is already the tokenId in most cases

        return {
          id: outcomeId,
          title: outcomeTitle,
          price: typeof outcomePrice === 'number' ? outcomePrice : parseFloat(String(outcomePrice || 0)) || 0,
          volume: outcome.volume || outcome.volume_24h || undefined,
          description: outcome.description || undefined,
          tokenId: tokenId, // Store for reference, but outcome.id is used directly
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
    } catch (error: any) {
      lastError = error;
      
      // If slug endpoint fails, try the old format /markets/{slug} as fallback
      try {
        data = await callPolymarketAPI(`/markets/${decodedSlugOrId}`);
      } catch (error2: any) {
        lastError = error2;
        
        // If both fail with validation error (422), the identifier might be an ID instead of slug
        // Search for the market in the list to find its slug
        if (error2?.message?.includes('422') || error2?.message?.includes('invalid') || error2?.message?.includes('validation')) {
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
            }
          } catch (error3: any) {
            lastError = error3;
          }
        }
      }
    }
    
    if (!data) {
      console.error('Could not fetch market detail. Last error:', lastError);
      return null;
    }

    const market = transformMarket(data);
    
    // Extract clobTokenIds if available
    let clobTokenIds: string[] | undefined = undefined;
    if (data.clobTokenIds && Array.isArray(data.clobTokenIds)) {
      clobTokenIds = data.clobTokenIds;
    } else if (data.clobTokenIds && typeof data.clobTokenIds === 'string') {
      clobTokenIds = data.clobTokenIds.split(',').map(id => id.trim());
    } else if (data.clob_token_ids && Array.isArray(data.clob_token_ids)) {
      clobTokenIds = data.clob_token_ids;
    }
    
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
      clobTokenIds: clobTokenIds,
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
  
  console.log('usePolymarketMarketHistory: Hook called', {
    hasMarket,
    hasOutcomes,
    isEnabled,
    marketId: market?.id,
    marketSlug: market?.slug,
    outcomesCount: market?.outcomes?.length || 0,
  });
  
  return useQuery({
    queryKey: ['polymarket-market-history', market?.slug, market?.id],
    queryFn: async () => {
      if (!market || !market.outcomes || !Array.isArray(market.outcomes) || market.outcomes.length === 0) {
        return null;
      }
      
      // Find primary outcome: prefer "Yes" outcome, otherwise use first outcome
      const yesOutcome = market.outcomes.find(o => 
        o.title.toLowerCase().includes('yes') || 
        o.title.toLowerCase() === 'yes'
      );
      const primaryOutcome = yesOutcome || market.outcomes[0];
      
      if (!primaryOutcome) {
        return null;
      }
      
      // Get tokenId for primary outcome
      // Try outcome.id first (most common), then outcome.tokenId, then clobTokenIds array
      const outcomeIndex = market.outcomes.indexOf(primaryOutcome);
      let tokenId = primaryOutcome.id || primaryOutcome.tokenId || market.clobTokenIds?.[outcomeIndex];
      
      console.log('usePolymarketMarketHistory: Looking for tokenId', {
        primaryOutcomeTitle: primaryOutcome.title,
        outcomeId: primaryOutcome.id,
        outcomeTokenId: primaryOutcome.tokenId,
        outcomeIndex,
        clobTokenIds: market.clobTokenIds,
        foundTokenId: tokenId,
        marketConditionId: market.conditionId,
      });
      
      // If outcome.id doesn't work, try using conditionId from market
      // Some markets use conditionId as base for token IDs
      if (!tokenId && market.conditionId) {
        // Try conditionId-based token (sometimes outcomes use conditionId + index)
        tokenId = market.conditionId;
        console.log('usePolymarketMarketHistory: Using conditionId as tokenId', tokenId);
      }
      
      if (!tokenId) {
        // If no tokenId found, generate mock data
        console.log('usePolymarketMarketHistory: No tokenId found, generating mock data');
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      }
      
      try {
        // Call CLOB API prices-history endpoint
        // Using 'market' parameter (token ID) and 'interval' parameter (e.g., "1d" for daily)
        console.log('usePolymarketMarketHistory: Calling CLOB API', {
          endpoint: '/prices-history',
          market: tokenId,
          interval: '1d',
        });
        
        const historyData = await callPolymarketAPI('/prices-history', {
          market: tokenId,
          interval: '1d', // Daily interval
        }, 'clob');
        
        console.log('usePolymarketMarketHistory: Got response from CLOB API', {
          isArray: Array.isArray(historyData),
          length: Array.isArray(historyData) ? historyData.length : 'not array',
          firstItem: Array.isArray(historyData) && historyData.length > 0 ? historyData[0] : null,
        });
        
        // Transform CLOB API response to our format
        // CLOB API /prices-history returns array of { t: number, p: number } objects
        // where t = timestamp (Unix timestamp in seconds), p = price (0-1)
        if (Array.isArray(historyData) && historyData.length > 0) {
          console.log('usePolymarketMarketHistory: Transforming history data', {
            dataLength: historyData.length,
            samplePoint: historyData[0],
          });
          
          const points: PolymarketHistoryPoint[] = historyData.map((point: any) => {
            // Handle timestamp - CLOB API returns 't' as Unix timestamp in seconds
            let timestamp: string;
            if (typeof point.t === 'number') {
              // Unix timestamp in seconds, convert to milliseconds then ISO
              timestamp = new Date(point.t * 1000).toISOString();
            } else if (typeof point.timestamp === 'number') {
              // Fallback to timestamp field if 't' is not available
              timestamp = new Date(point.timestamp * 1000).toISOString();
            } else if (typeof point.timestamp === 'string') {
              // Already ISO string
              timestamp = new Date(point.timestamp).toISOString();
            } else {
              // Fallback to current time if invalid
              timestamp = new Date().toISOString();
            }
            
            // Handle price - CLOB API returns 'p' as price (0-1 decimal)
            let price: number;
            if (typeof point.p === 'number') {
              // Primary format: 'p' field with price as decimal (0-1)
              price = point.p;
            } else if (typeof point.price === 'number') {
              // Fallback to 'price' field if 'p' is not available
              price = point.price > 1 ? point.price / 100 : point.price;
            } else {
              price = parseFloat(point.price || point.p || 0);
              if (price > 1) price = price / 100;
            }
            
            return {
              timestamp,
              price: Math.max(0, Math.min(1, price)), // Ensure price is between 0 and 1
              outcomeId: primaryOutcome.id,
              outcomeTitle: primaryOutcome.title,
            };
          });
          
          console.log('usePolymarketMarketHistory: Transformed points', {
            pointsCount: points.length,
            firstPoint: points[0],
            lastPoint: points[points.length - 1],
          });
          
          return {
            marketId: market.id,
            marketSlug: market.slug,
            points,
          };
        }
        
        // If API returns empty or invalid data, use mock data
        console.log('usePolymarketMarketHistory: API returned empty/invalid data, using mock data');
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      } catch (error) {
        // Fallback to mock data if CLOB API fails
        console.error('usePolymarketMarketHistory: Error fetching history, using mock data', error);
        const mockPoints = generateMockHistoryForOutcome(primaryOutcome, 90);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: mockPoints,
        };
      }
    },
    enabled: isEnabled,
    staleTime: 300000, // 5 minutes
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
    
    // Use seeded random for consistency
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

