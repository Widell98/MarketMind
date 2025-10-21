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

  const encodedSymbol = encodeURIComponent(trimmed);
  const endpoints = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodedSymbol}`,
    `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodedSymbol}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.warn('Yahoo quote fetch failed:', res.status, res.statusText, url);
        continue;
      }

      const json = await res.json();
      const quote = json?.quoteResponse?.result?.[0];
      if (!quote) {
        continue;
      }

      return {
        symbol: quote.symbol as string | undefined,
        price: (quote.regularMarketPrice ?? null) as number | null,
        currency: (quote.currency ?? null) as string | null,
        name: (quote.shortName ?? quote.longName ?? quote.symbol) as string | undefined,
      };
    } catch (error) {
      console.warn('Yahoo quote fetch threw an error:', error, url);
    }
  }

  return null;
}
