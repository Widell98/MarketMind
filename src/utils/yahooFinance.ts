export interface YahooQuoteResult {
  symbol?: string;
  price: number | null;
  currency?: string | null;
  name?: string;
}

const buildYahooHeaders = () => {
  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent
    ? navigator.userAgent
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  return {
    'User-Agent': userAgent,
    Accept: 'application/json',
    Referer: 'https://finance.yahoo.com/',
  } satisfies Record<string, string>;
};

export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteResult | null> {
  const trimmed = typeof symbol === 'string' ? symbol.trim() : '';
  if (!trimmed) {
    return null;
  }

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(trimmed)}`,
      {
        headers: buildYahooHeaders(),
      }
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
