// src/hooks/usePolymarket.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  PolymarketMarket,
  PolymarketMarketDetail,
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
// Vi lägger till parentEventTitle som en valfri parameter här
const transformMarket = (apiMarket: any, parentEventTitle?: string): PolymarketMarket => {
  try {
    let outcomes: any[] = [];
    
    // Försök hämta outcomes
    if (apiMarket.outcomes && Array.isArray(apiMarket.outcomes)) {
      outcomes = apiMarket.outcomes;
    } else if (typeof apiMarket.outcomes === 'string') {
      try { outcomes = JSON.parse(apiMarket.outcomes); } catch {}
    }
    
    // Fallback för outcomes (vanligt i sökresultat)
    if (outcomes.length === 0 || !outcomes[0]?.price) {
        let prices = apiMarket.outcomePrices;
        if (typeof prices === 'string') {
            try { prices = JSON.parse(prices); } catch {}
        }
        if (prices) {
            const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);
            outcomes = pricesArray.map((p: any, i: number) => ({
                id: String(i),
                title: i === 0 ? 'Yes' : 'No', 
                price: p 
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
    
    let clobTokenIdsArray: string[] = [];
    if (Array.isArray(apiMarket.clobTokenIds)) clobTokenIdsArray = apiMarket.clobTokenIds;
    else if (typeof apiMarket.clobTokenIds === 'string') {
      try { clobTokenIdsArray = JSON.parse(apiMarket.clobTokenIds); } catch {}
    }

    // LOGIK FÖR TITLAR:
    // 1. Använd parentEventTitle om den finns (från sökning)
    // 2. Annars fallback på apiMarket data
    const eventTitle = parentEventTitle || apiMarket.eventTitle || apiMarket.groupItemTitle;
    const question = apiMarket.question || apiMarket.title || 'Unknown Market';

    return {
      id: marketId,
      slug: apiMarket.slug || marketId,
      question: question,
      eventTitle: eventTitle, // Spara titeln
      imageUrl: apiMarket.imageUrl || apiMarket.image || apiMarket.icon,
      description: apiMarket.description,
      volume: volumeNum,
      volumeNum: volumeNum,
      liquidity: Number(apiMarket.liquidity) || 0,
      outcomes: outcomes.map((outcome: any, index: number) => {
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
          price: price || 0,
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

    if (params?.search && params.search.trim().length > 0) {
      endpoint = '/public-search';
      apiParams.q = params.search;
    } else {
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
    
    if (endpoint === '/public-search') {
        const events = data.events || (Array.isArray(data) ? data : []);
        
        // Här packar vi upp Events och skickar med titeln till barnen
        events.forEach((item: any) => {
            if (item.markets && Array.isArray(item.markets) && item.markets.length > 0) {
                const enrichedMarkets = item.markets.map((m: any) => {
                    // Vi berikar API-objektet innan transform
                    const enriched = {
                        ...m,
                        // Ärva bild om barnet saknar det
                        image: m.image || m.icon || item.image || item.icon,
                    };
                    // Skicka med eventets titel som argument 2
                    return transformMarket(enriched, item.title);
                });
                rawItems.push(...enrichedMarkets);
            } else {
                rawItems.push(transformMarket(item));
            }
        });
    } else {
        if (Array.isArray(data)) rawItems = data.map(item => transformMarket(item));
        else if (data.data && Array.isArray(data.data)) rawItems = data.data.map(item => transformMarket(item));
        else if (data.results && Array.isArray(data.results)) rawItems = data.results.map(item => transformMarket(item));
    }

    return rawItems.filter(market => market.id && market.question && market.id !== 'error');
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
};

export const fetchPolymarketMarketDetail = async (slugOrId: string): Promise<PolymarketMarketDetail | null> => {
  try {
    const decodedSlugOrId = decodeURIComponent(slugOrId);
    let data;
    try {
      data = await callPolymarketAPI(`/markets/slug/${decodedSlugOrId}`);
    } catch (e) {
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

export const fetchPolymarketTags = async (): Promise<PolymarketTag[]> => {
  try {
    const data = await callPolymarketAPI('/tags');
    if (Array.isArray(data)) return data.map((tag: any) => ({ id: tag.id, name: tag.name, slug: tag.slug }));
    return [];
  } catch {
    return [];
  }
};

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

export const usePolymarketMarketHistory = (
  market: PolymarketMarketDetail | null | undefined,
  timeRange: TimeRange = 'all'
) => {
  const isEnabled = !!market && !!market.outcomes?.length;
  return useQuery({
    queryKey: ['polymarket-market-history', market?.slug, market?.id, timeRange],
    queryFn: async () => {
      if (!market?.outcomes?.length) return null;
      const yesOutcome = market.outcomes.find(o => o.title.toLowerCase() === 'yes') || market.outcomes[0];
      const rawTokenId = yesOutcome.tokenId || yesOutcome.id;
      let tokenId = rawTokenId;

      if ((!tokenId || tokenId.length < 10) && market.clobTokenIds?.length) {
         const index = market.outcomes.indexOf(yesOutcome);
         if (index >= 0 && market.clobTokenIds[index]) tokenId = market.clobTokenIds[index];
      }

      // Mocka historia om inget token ID finns
      if (!tokenId || tokenId.length < 5) {
        return { marketId: market.id, marketSlug: market.slug, points: [] };
      }
      
      try {
        const now = Math.floor(Date.now() / 1000);
        let apiParams: any = { market: tokenId };
        switch (timeRange) {
          case '1h': apiParams.startTs = now - 3600; apiParams.fidelity = 1; break;
          case '6h': apiParams.startTs = now - 21600; apiParams.fidelity = 5; break;
          case '1d': apiParams.startTs = now - 86400; apiParams.fidelity = 10; break;
          case '1w': apiParams.startTs = now - 604800; apiParams.fidelity = 60; break;
          case '1m': apiParams.startTs = now - 2592000; apiParams.fidelity = 120; break;
          default: apiParams.interval = 'max'; apiParams.fidelity = 60; break;
        }

        const historyData = await callPolymarketAPI('/prices-history', apiParams, 'clob');
        const historyArray = Array.isArray(historyData) ? historyData : (historyData.history || []);
        
        if (Array.isArray(historyArray) && historyArray.length > 0) {
          const points: PolymarketHistoryPoint[] = historyArray.map((point: any) => ({
            timestamp: new Date((point.t || point.timestamp) * 1000).toISOString(),
            price: point.p ?? point.price ?? 0,
            outcomeId: yesOutcome.id,
            outcomeTitle: yesOutcome.title,
          }));
          return { marketId: market.id, marketSlug: market.slug, points };
        }
        return { marketId: market.id, marketSlug: market.slug, points: [] };
      } catch (error) {
        console.error('History fetch failed:', error);
        return { marketId: market.id, marketSlug: market.slug, points: [] };
      }
    },
    enabled: isEnabled,
    staleTime: 60000,
  });
};
