// Polymarket service for fetching real-time market data

export type PolymarketMarket = {
  id: string;
  question: string;
  slug: string;
  description?: string;
  outcomes?: Array<{
    name: string;
    price: number;
    probability?: number;
  }>;
  volume24hr?: number;
  liquidity?: number;
  endDate?: string;
  imageUrl?: string;
  tags?: string[];
};

export type PolymarketSearchResult = {
  markets: PolymarketMarket[];
  total?: number;
};

/**
 * Search Polymarket for markets matching a query
 */
export const searchPolymarketMarkets = async (
  query: string,
  limit: number = 10,
): Promise<PolymarketSearchResult> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      console.warn('SUPABASE_URL saknas, kan inte hämta Polymarket-data');
      return { markets: [] };
    }

    // Use the existing polymarket-proxy edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/polymarket-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/events',
        params: {
          closed: false,
          active: true,
          limit,
          query: query.trim(),
        },
        apiType: 'gamma',
      }),
    });

    if (!response.ok) {
      console.error('Polymarket API error:', response.status);
      return { markets: [] };
    }

    const data = await response.json();
    
    // Transform API response to our format
    const markets: PolymarketMarket[] = Array.isArray(data)
      ? data.map((market: any) => ({
          id: market.id || market.slug || '',
          question: market.question || market.title || '',
          slug: market.slug || '',
          description: market.description || '',
          outcomes: market.outcomes?.map((outcome: any) => ({
            name: outcome.name || outcome.title || '',
            price: typeof outcome.price === 'number' ? outcome.price : 0,
            probability: typeof outcome.price === 'number' ? outcome.price * 100 : undefined,
          })) || [],
          volume24hr: typeof market.volume24hr === 'number' ? market.volume24hr : undefined,
          liquidity: typeof market.liquidity === 'number' ? market.liquidity : undefined,
          endDate: market.endDate || market.end_date_iso || undefined,
          imageUrl: market.imageUrl || market.image || undefined,
          tags: Array.isArray(market.tags) ? market.tags : [],
        }))
      : [];

    return { markets, total: markets.length };
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    return { markets: [] };
  }
};

/**
 * Format Polymarket markets for AI context
 */
export const formatPolymarketContext = (
  markets: PolymarketMarket[],
  query: string,
): string => {
  if (markets.length === 0) {
    return '';
  }

  const sections: string[] = [];
  sections.push('POLYMARKET MARKNADSDATA (Realtidsodds):\n');

  markets.forEach((market, index) => {
    const parts: string[] = [];
    parts.push(`${index + 1}. ${market.question}`);
    
    if (market.description) {
      parts.push(`   Beskrivning: ${market.description.substring(0, 200)}${market.description.length > 200 ? '...' : ''}`);
    }

    if (market.outcomes && market.outcomes.length > 0) {
      parts.push('   Utfall och odds:');
      market.outcomes.forEach((outcome) => {
        const probText = outcome.probability !== undefined
          ? `${outcome.probability.toFixed(1)}%`
          : `${(outcome.price * 100).toFixed(1)}%`;
        parts.push(`     - ${outcome.name}: ${probText} (pris: ${outcome.price.toFixed(3)})`);
      });
    }

    if (market.volume24hr !== undefined) {
      parts.push(`   Volym (24h): $${market.volume24hr.toLocaleString()}`);
    }

    if (market.endDate) {
      const endDate = new Date(market.endDate);
      parts.push(`   Slutdatum: ${endDate.toLocaleDateString('sv-SE')}`);
    }

    sections.push(parts.join('\n'));
  });

  sections.push('\nINSTRUKTION: Använd denna realtidsdata från Polymarket när du analyserar prediktionsmarknader. Oddsen är aktuella och baserade på marknadens prissättning.');

  return sections.join('\n\n');
};

