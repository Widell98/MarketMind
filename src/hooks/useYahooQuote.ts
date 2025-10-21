export interface YahooQuoteResult {
  symbol: string;
  name: string;
  currency: string | null;
  price: number | null;
}

export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteResult | null> {
  if (!symbol) return null;

  const url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(symbol)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': navigator.userAgent,
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://finance.yahoo.com/',
    },
  });

  if (!res.ok) {
    console.warn('Yahoo quote request failed:', res.status);
    return null;
  }

  const json = await res.json();
  const quote = json?.quoteResponse?.result?.[0];

  if (!quote) return null;

  return {
    symbol: quote.symbol,
    name: quote.shortName ?? quote.longName ?? quote.symbol,
    currency: quote.currency ?? null,
    price:
      typeof quote.regularMarketPrice === 'number'
        ? quote.regularMarketPrice
        : null,
  };
}
