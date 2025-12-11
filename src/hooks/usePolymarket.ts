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
//
// Ersätt transformMarket funktionen med denna robusta version:
const transformMarket = (apiMarket: any): PolymarketMarket => {
  try {
    console.log('Transforming market raw data:', {
      id: apiMarket.id,
      hasOutcomes: !!apiMarket.outcomes,
      outcomesType: typeof apiMarket.outcomes,
      hasTokens: !!apiMarket.tokens
    });

    let outcomes: any[] = [];
    
    // Hantera outcomes som kan vara array ELLER JSON-sträng
    if (apiMarket.outcomes) {
      if (Array.isArray(apiMarket.outcomes)) {
        outcomes = apiMarket.outcomes;
      } else if (typeof apiMarket.outcomes === 'string') {
        try {
          // Ibland kommer outcomes som en sträng: "[{...}]"
          outcomes = JSON.parse(apiMarket.outcomes);
        } catch (e) {
          console.warn('Failed to parse outcomes string:', e);
        }
      }
    } 
    
    // Fallback: Kolla andra fält om outcomes saknas
    if (outcomes.length === 0) {
      if (apiMarket.outcomePrices && Array.isArray(apiMarket.outcomePrices)) {
        // Om outcomePrices finns (typiskt en sträng-array av priser), skapa outcomes
        outcomes = JSON.parse(apiMarket.outcomePrices).map((price: string, i: number) => ({
          id: String(i),
          title: i === 0 ? 'Yes' : 'No', // Gissning för binära marknader
          price: Number(price)
        }));
      } else if (apiMarket.tokens && Array.isArray(apiMarket.tokens)) {
        outcomes = apiMarket.tokens.map((token: any) => ({
          id: token.outcome || token.id,
          title: token.outcome || token.name || token.title,
          price: token.price || 0,
          tokenId: token.token_id // Spara token_id här om det finns
        }));
      }
    }

    // Parse volume
    let volumeNum = 0;
    if (typeof apiMarket.volume === 'number') {
      volumeNum = apiMarket.volume;
    } else if (apiMarket.volumeNum) {
      volumeNum = Number(apiMarket.volumeNum) || 0;
    } else if (typeof apiMarket.volume === 'string') {
      const volumeStr = apiMarket.volume.replace(/[^0-9.]/g, '');
      volumeNum = parseFloat(volumeStr) || 0;
      if (apiMarket.volume.toLowerCase().includes('m')) volumeNum *= 1_000_000;
      if (apiMarket.volume.toLowerCase().includes('b')) volumeNum *= 1_000_000_000;
      if (apiMarket.volume.toLowerCase().includes('k')) volumeNum *= 1_000;
    }

    // Hämta CLOB Token IDs
    let clobTokenIdsArray: string[] = [];
    if (Array.isArray(apiMarket.clobTokenIds)) {
      clobTokenIdsArray = apiMarket.clobTokenIds;
    } else if (typeof apiMarket.clobTokenIds === 'string') {
      try {
        clobTokenIdsArray = JSON.parse(apiMarket.clobTokenIds);
      } catch {
        clobTokenIdsArray = apiMarket.clobTokenIds.split(',').map(s => s.trim());
      }
    }

    const marketId = apiMarket.id || apiMarket.conditionId || '';

    return {
      id: marketId,
      slug: apiMarket.slug || apiMarket.id,
      question: apiMarket.question || apiMarket.title || 'Unknown Market',
      imageUrl: apiMarket.imageUrl || apiMarket.image || apiMarket.icon,
      description: apiMarket.description,
      volume: volumeNum,
      volumeNum: volumeNum,
      liquidity: Number(apiMarket.liquidity) || 0,
      outcomes: outcomes.map((outcome: any, index: number) => {
        // Försök hitta det riktiga Token ID:t för historik
        // 1. outcome.tokenId (från tokens-array)
        // 2. clobTokenIdsArray[index] (från marknadens lista)
        // 3. outcome.id (om det ser ut som ett hash/ID)
        const specificTokenId = outcome.tokenId || clobTokenIdsArray[index] || outcome.id;
        
        return {
          id: String(outcome.id || index),
          title: outcome.title || outcome.name || `Outcome ${index + 1}`,
          price: Number(outcome.price || 0),
          volume: outcome.volume,
          tokenId: specificTokenId // Detta är nyckeln för historik!
        };
      }),
      endDate: apiMarket.endDate || apiMarket.endDateIso,
      conditionId: apiMarket.conditionId,
      active: apiMarket.active !== false && apiMarket.closed !== true,
      closed: apiMarket.closed === true,
      archived: apiMarket.archived === true,
      tags: apiMarket.tags || [],
      clobTokenIds: clobTokenIdsArray // Se till att denna följer med i objektet
    } as PolymarketMarketDetail; // Type cast för att inkludera extra fält
  } catch (error) {
    console.error('Error transforming market:', error);
    return {
      id: apiMarket.id || 'error',
      slug: 'error',
      question: 'Error loading market',
      volume: 0,
      volumeNum: 0,
      liquidity: 0,
      outcomes: [],
      active: false
    };
  }
};

// Fetch single market detail
export const fetchPolymarketMarketDetail = async (slugOrId: string): Promise<PolymarketMarketDetail | null> => {
  try {
    const decodedSlugOrId = decodeURIComponent(slugOrId);
    let data = await callPolymarketAPI(`/markets/slug/${decodedSlugOrId}`);
    
    // API:et kan returnera en array om man söker på slug
    if (Array.isArray(data)) {
      data = data[0];
    }

    if (!data) return null;

    const market = transformMarket(data);
    
    // Returnera som detalj-objekt
    return {
      ...market,
      eventSlug: data.eventSlug,
      liquidityNum: market.liquidity,
      startDate: data.startDate,
      endDateIso: data.endDate || data.endDateIso,
      resolutionSource: data.resolutionSource,
      clobTokenIds: market.clobTokenIds // Från transformern
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
      // Prioritera tokenId eftersom transformMarket lägger det "bästa" ID:t där för CLOB-anrop
let tokenId = primaryOutcome.tokenId || primaryOutcome.id || market.clobTokenIds?.[outcomeIndex];
      
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

