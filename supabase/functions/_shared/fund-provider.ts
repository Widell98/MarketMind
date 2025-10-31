export interface FundSearchResult {
  symbol: string;
  name: string;
  price: number | null;
  currency: string | null;
  source?: string;
  holdingType?: string;
}

const YAHOO_SEARCH_ENDPOINT = "https://query2.finance.yahoo.com/v1/finance/search";
const YAHOO_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";

const DEFAULT_HEADERS = {
  "User-Agent": "MarketMindFundSearch/1.0",
  Accept: "application/json",
};

const normalizeSymbol = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

const normalizeName = (value: unknown, fallbackSymbol: string): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallbackSymbol;
};

const normalizeCurrency = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

const normalizePrice = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

export const searchYahooFunds = async (query: string): Promise<FundSearchResult[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    lang: "en-US",
    region: "US",
    quotesCount: "20",
    newsCount: "0",
  });

  const response = await fetch(`${YAHOO_SEARCH_ENDPOINT}?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const quotes = Array.isArray(json?.quotes) ? json.quotes : [];

  const results: FundSearchResult[] = [];
  const seen = new Set<string>();

  for (const quote of quotes) {
    if (!quote || typeof quote !== "object") continue;

    const symbol = normalizeSymbol((quote as Record<string, unknown>).symbol);
    if (!symbol || seen.has(symbol)) continue;

    const quoteType = typeof quote.quoteType === "string" ? quote.quoteType.toUpperCase() : "";
    const typeDisplay = typeof quote.typeDisp === "string" ? quote.typeDisp.toUpperCase() : "";
    const isFund = quoteType === "MUTUALFUND" || typeDisplay.includes("FUND");

    if (!isFund) continue;

    seen.add(symbol);

    const price = normalizePrice((quote as Record<string, unknown>).regularMarketPrice);
    const currency = normalizeCurrency((quote as Record<string, unknown>).currency);
    const name = normalizeName(
      typeof quote.shortname === "string" && quote.shortname.trim().length > 0
        ? quote.shortname
        : quote.longname,
      symbol,
    );

    results.push({
      symbol,
      name,
      price,
      currency,
      source: "yahoo_funds",
      holdingType: "fund",
    });
  }

  return results;
};

export const fetchYahooFundQuote = async (symbol: string): Promise<FundSearchResult | null> => {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) {
    return null;
  }

  const params = new URLSearchParams({
    symbols: normalizedSymbol,
  });

  const response = await fetch(`${YAHOO_QUOTE_ENDPOINT}?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance quote request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const quote = json?.quoteResponse?.result && Array.isArray(json.quoteResponse.result)
    ? json.quoteResponse.result[0]
    : null;

  if (!quote || typeof quote !== "object") {
    return null;
  }

  const price = normalizePrice((quote as Record<string, unknown>).regularMarketPrice);
  const currency = normalizeCurrency((quote as Record<string, unknown>).currency);

  if (price === null) {
    return null;
  }

  const name = normalizeName(
    typeof quote.shortName === "string" && quote.shortName.trim().length > 0
      ? quote.shortName
      : quote.longName,
    normalizedSymbol,
  );

  return {
    symbol: normalizedSymbol,
    name,
    price,
    currency,
    source: "yahoo_funds",
    holdingType: "fund",
  };
};
