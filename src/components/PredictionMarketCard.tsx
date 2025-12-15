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

export type TimeRange = '1h' | '6h' | '1d' | '1w' | '1m' | 'all';

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

const transformMarket = (apiMarket: any): PolymarketMarket => {
  try {
    let outcomes: any[] = [];
    
    // Försök hämta outcomes från olika ställen i API-svaret
    if (apiMarket.outcomes && Array.isArray(apiMarket.outcomes)) {
      outcomes = apiMarket.outcomes;
    } else if (typeof apiMarket.outcomes === 'string') {
      try { outcomes = JSON.parse(apiMarket.outcomes); } catch {}
    }
    
    // Om outcomes saknas eller saknar priser, kolla 'outcomePrices' (vanligt i sökresultat)
    if (outcomes.length === 0 || !outcomes[0]?.price) {
        let prices = apiMarket.outcomePrices;
        if (typeof prices === 'string') {
            try { prices = JSON.parse(prices); } catch {}
        }
        
        if (prices) {
            // Kan vara array ["0.5", "0.5"] eller objekt {"0": "0.5"}
            const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);
            
            // Skapa outcomes baserat på prislistan
            outcomes = pricesArray.map((p: any, i: number) => ({
                id: String(i),
                title: i === 0 ? 'Yes' : 'No', // Default namn
                price: p // Spara råvärdet, vi konverterar nedan
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
      if (apiMarket.volume.toLowerCase().includes('k')) volumeNum *= 1_000;
    }

    const marketId = apiMarket.id || apiMarket.conditionId || apiMarket.marketId || '';
    
    // CLOB Token IDs
    let clobTokenIdsArray: string[] = [];
    if (Array.isArray(apiMarket.clobTokenIds)) clobTokenIdsArray = apiMarket.clobTokenIds;
    else if (typeof apiMarket.clobTokenIds === 'string') {
      try { clobTokenIdsArray = JSON.parse(apiMarket.clobTokenIds); } catch {}
    }

    return {
      id: marketId,
      slug: apiMarket.slug || marketId,
      question: apiMarket.question || apiMarket.title || 'Unknown Market',
      // Här sparar vi grupptiteln om den finns
      groupItemTitle: apiMarket.groupItemTitle, 
      imageUrl: apiMarket.imageUrl || apiMarket.image || apiMarket.icon,
      description: apiMarket.description,
      volume: volumeNum,
      volumeNum: volumeNum,
      liquidity: Number(apiMarket.liquidity) || 0,
      outcomes: outcomes.map((outcome: any, index: number) => {
        // HÄR ÄR NYCKELN: Säkra upp priset till ett nummer
        let price = 0;
        const rawPrice = outcome.price || outcome.lastPrice;
        
        if (typeof rawPrice === 'number') {
            price = rawPrice;
        } else if (typeof rawPrice === 'string') {
            price = parseFloat(rawPrice);
        }

        return {
          id: outcome.id || String(index),
          title: outcome.title || outcome.name || (index === 0 ? 'Yes' : 'No'),
          price: price || 0, // Nu är det garanterat ett nummer (0.0 - 1.0)
          tokenId: outcome.tokenId || clobTokenIdsArray[index],
        };
      }),
      endDate: apiMarket.endDate || apiMarket.endDateIso,
      active: apiMarket.active !== false,
      closed: apiMarket.closed === true,
      clobTokenIds: clobTokenIdsArray,
      tags: apiMarket.tags || [],
    } as PolymarketMarketDetail;
  } catch (error) {
    console.error('Transform error:', error);
    return { id: 'error', slug: 'error', question: 'Error', volume: 0, liquidity: 0, outcomes: [], active: false, tags: [] };
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
    const apiParams: Record<string, any> = {};
    let endpoint = '/markets';

    // --- SÖK-LOGIK: Byt till /public-search vid sökning ---
    if (params?.search && params.search.trim().length > 0) {
      endpoint = '/public-search';
      apiParams.q = params.search;
      // Sök-API stöder inte vanliga filter, rensa dem
    } else {
      // Kopiera vanliga parametrar för /markets
      if (params?.limit) apiParams.limit = params.limit;
      if (params?.offset) apiParams.offset = params.offset;
      if (params?.tags && params.tags.length > 0) apiParams.tags = params.tags;
      if (params?.active !== undefined) apiParams.active = params.active;
      if (params?.closed !== undefined) apiParams.closed = params.closed;
      if (params?.order) apiParams.order = params.order;
      if (params?.ascending !== undefined) apiParams.ascending = params.ascending;
    }

    const data = await callPolymarketAPI(endpoint, apiParams);
    
    let rawItems: any[] = [];
    
    // --- EXTRAHERA MARKNADER ---
    if (endpoint === '/public-search') {
        // Sökresultat ligger ofta under 'events' eller 'markets'
        const events = data.events || (Array.isArray(data) ? data : []);
        
        // "Packa upp" events till marknader
        // Om ett sökresultat är ett Event, vill vi visa dess marknader istället för eventet självt
        events.forEach((item: any) => {
            if (item.markets && Array.isArray(item.markets) && item.markets.length > 0) {
                // Lägg till alla marknader från detta event och injecta event-titeln
                const marketsWithGroupTitle = item.markets.map((m: any) => ({
                    ...m,
                    // Använd eventets titel som groupItemTitle om den inte redan finns
                    groupItemTitle: m.groupItemTitle || item.title || item.name 
                }));
                rawItems.push(...marketsWithGroupTitle);
            } else {
                // Eller lägg till objektet som det är (om det redan är en marknad)
                rawItems.push(item);
            }
        });
    } else {
        // Standard endpoint response
        if (Array.isArray(data)) rawItems = data;
        else if (data.data && Array.isArray(data.data)) rawItems = data.data;
        else if (data.results && Array.isArray(data.results)) rawItems = data.results;
    }

    if (rawItems.length === 0) return [];
    
    // Transformera och filtrera
    const transformedMarkets = rawItems
      .map(item => {
        // Fix: Om search result saknar 'question' men har 'title', använd 'title'
        if (!item.question && (item.title || item.name)) {
             return transformMarket({ ...item, question: item.title || item.name });
        }
        return transformMarket(item);
      })
      .filter(market => market.id && market.question);
    
    return transformedMarkets;
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
};

// Fetch single market detail
export const fetchPolymarketMarketDetail = async (slugOrId: string): Promise<PolymarketMarketDetail | null> => {
  try {
    const decodedSlugOrId = decodeURIComponent(slugOrId);
    let data;
    
    // Försök hämta via slug endpoint
    try {
      data = await callPolymarketAPI(`/markets/slug/${decodedSlugOrId}`);
    } catch (e) {
      // Fallback: Försök hämta via ID endpoint
      try {
        data = await callPolymarketAPI(`/markets/${decodedSlugOrId}`);
      } catch (e2) {
        return null;
      }
    }
    
    if (Array.isArray(data)) data = data[0];
    if (!data) return null;

    const market = transformMarket(data);
    
    return {
      ...market,
      eventSlug: data.eventSlug,
      liquidityNum: market.liquidity,
      startDate: data.startDate,
      endDateIso: data.endDate || data.endDateIso,
      resolutionSource: data.resolutionSource,
      clobTokenIds: market.clobTokenIds
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
    if (Array.isArray(data)) return data.map((tag: any) => ({ id: tag.id, name: tag.name, slug: tag.slug }));
    return [];
  } catch {
    return [];
  }
};

// Transform history to graph data
export const transformHistoryToGraphData = (
  history: PolymarketMarketHistory | null | undefined
): GraphDataPoint[] => {
  if (!history?.points?.length) return [];

  return history.points
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      price: Math.round(point.price * 100),
    }));
};

// Hooks
export const usePolymarketMarkets = (params?: any) => {
  return useQuery({
    queryKey: ['polymarket-markets', params],
    queryFn: () => fetchPolymarketMarkets(params),
    staleTime: 60000,
  });
};

export const usePolymarketMarketDetail = (slug: string) => {
  return useQuery({
    queryKey: ['polymarket-market', slug],
    queryFn: () => fetchPolymarketMarketDetail(slug),
    enabled: !!slug,
    staleTime: 60000,
  });
};

export const usePolymarketTags = () => {
  return useQuery({
    queryKey: ['polymarket-tags'],
    queryFn: fetchPolymarketTags,
    staleTime: 3600000,
  });
};

// Hook for market history using CLOB API
export const usePolymarketMarketHistory = (
  market: PolymarketMarketDetail | null | undefined,
  timeRange: TimeRange = 'all'
) => {
  const isEnabled = !!market && !!market.outcomes?.length;
  
  return useQuery({
    queryKey: ['polymarket-market-history', market?.slug, market?.id, timeRange],
    queryFn: async () => {
      if (!market?.outcomes?.length) return null;
      
      const yesOutcome = market.outcomes.find(o => 
        o.title.toLowerCase() === 'yes' || o.title.toLowerCase().includes('yes')
      );
      const primaryOutcome = yesOutcome || market.outcomes[0];
      
      const rawTokenId = primaryOutcome.tokenId || primaryOutcome.id;
      let tokenId = rawTokenId;

      if ((!tokenId || tokenId.length < 10) && market.clobTokenIds?.length) {
         const index = market.outcomes.indexOf(primaryOutcome);
         if (index >= 0 && market.clobTokenIds[index]) {
             tokenId = market.clobTokenIds[index];
         }
      }

      if (!tokenId || tokenId.length < 5) {
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: generateMockHistoryForOutcome(primaryOutcome, 90),
        };
      }
      
      try {
        const now = Math.floor(Date.now() / 1000);
        let apiParams: any = { market: tokenId };

        switch (timeRange) {
          case '1h':
            apiParams.startTs = now - (60 * 60);
            apiParams.endTs = now;
            apiParams.fidelity = 1; 
            break;
          case '6h':
            apiParams.startTs = now - (6 * 60 * 60);
            apiParams.endTs = now;
            apiParams.fidelity = 5; 
            break;
          case '1d':
            apiParams.startTs = now - (24 * 60 * 60);
            apiParams.endTs = now;
            apiParams.fidelity = 10; 
            break;
          case '1w':
            apiParams.startTs = now - (7 * 24 * 60 * 60);
            apiParams.endTs = now;
            apiParams.fidelity = 60; 
            break;
          case '1m':
            apiParams.startTs = now - (30 * 24 * 60 * 60);
            apiParams.endTs = now;
            apiParams.fidelity = 120;
            break;
          case 'all':
          default:
            apiParams.interval = 'max';
            apiParams.fidelity = 60;
            break;
        }

        const historyData = await callPolymarketAPI('/prices-history', apiParams, 'clob');
        const historyArray = Array.isArray(historyData) ? historyData : (historyData.history || []);
        
        if (Array.isArray(historyArray) && historyArray.length > 0) {
          const points: PolymarketHistoryPoint[] = historyArray.map((point: any) => ({
            timestamp: new Date((point.t || point.timestamp) * 1000).toISOString(),
            price: point.p ?? point.price ?? 0,
            outcomeId: primaryOutcome.id,
            outcomeTitle: primaryOutcome.title,
          }));
          
          return {
            marketId: market.id,
            marketSlug: market.slug,
            points,
          };
        }
        
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: generateMockHistoryForOutcome(primaryOutcome, 90),
        };
      } catch (error) {
        console.error('History fetch failed:', error);
        return {
          marketId: market.id,
          marketSlug: market.slug,
          points: generateMockHistoryForOutcome(primaryOutcome, 90),
        };
      }
    },
    enabled: isEnabled,
    staleTime: 60000,
  });
};

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
    
    points.push({
      timestamp: date.toISOString(),
      price: Math.max(0, Math.min(1, basePrice + variation)),
      outcomeId: outcome.id,
      outcomeTitle: outcome.title,
    });
  }
  return points;
};
