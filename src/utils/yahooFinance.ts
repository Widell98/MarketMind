export interface YahooQuoteResult {
  symbol?: string;
  price: number | null;
  currency?: string | null;
  name?: string;
}

export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteResult | null> {
  const trimmed = typeof symbol === 'string' ? symbol.trim() : '';
  if (!trimmed) {
    return null;
  }

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(trimmed)}`
    );

    if (!res.ok) {
      console.warn('Yahoo quote fetch failed:', res.status, res.statusText);
      return null;
    }

    const json = await res.json();
    const quote = json?.quoteResponse?.result?.[0];
    if (!quote) return null;

    return {
      symbol: quote.symbol as string | undefined,
      price: (quote.regularMarketPrice ?? null) as number | null,
      currency: (quote.currency ?? null) as string | null,
      name: (quote.shortName ?? quote.longName ?? quote.symbol) as string | undefined,
    };
  } catch (error) {
    console.warn('Yahoo quote fetch threw an error:', error);
    return null;
  }
}
