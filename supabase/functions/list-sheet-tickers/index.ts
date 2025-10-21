import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "TSLA",
  "META",
  "NFLX",
  "SPY",
  "QQQ",
  "VOO",
  "VTI",
  "BND",
  "XLF",
  "XLE",
  "XLY",
  "XLC",
  "EURUSD=X",
  "USDSEK=X",
  "SEK=X",
];

type YahooTicker = {
  symbol: string;
  name: string;
  currency: string | null;
  price: number | null;
};

const normalizeSymbol = (symbol: string): string | null => {
  if (typeof symbol !== "string") {
    return null;
  }

  const trimmed = symbol.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toUpperCase();
};

const toTicker = (quote: Record<string, unknown>): YahooTicker | null => {
  if (!quote || typeof quote !== "object") {
    return null;
  }

  const rawSymbol = typeof quote.symbol === "string" ? quote.symbol : null;
  const symbol = rawSymbol ? normalizeSymbol(rawSymbol) : null;

  if (!symbol) {
    return null;
  }

  const name =
    typeof quote.shortname === "string" && quote.shortname.trim().length > 0
      ? quote.shortname.trim()
      : typeof quote.longname === "string" && quote.longname.trim().length > 0
        ? quote.longname.trim()
        : symbol;

  const priceValue =
    typeof quote.regularMarketPrice === "number" && Number.isFinite(quote.regularMarketPrice)
      ? quote.regularMarketPrice
      : typeof quote.postMarketPrice === "number" && Number.isFinite(quote.postMarketPrice)
        ? quote.postMarketPrice
        : null;

  const currency =
    typeof quote.currency === "string" && quote.currency.trim().length > 0
      ? quote.currency.trim().toUpperCase()
      : null;

  return {
    symbol,
    name,
    currency,
    price: priceValue,
  };
};

const fetchYahooSearchTickers = async (query: string) => {
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

  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?${params.toString()}`,
    {
      headers: {
        "User-Agent": "MarketMindTickerSearch/1.0",
        "Accept": "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const quotes = Array.isArray(json?.quotes) ? json.quotes : [];

  const seen = new Set<string>();
  const tickers: YahooTicker[] = [];

  for (const quote of quotes) {
    const ticker = toTicker(quote as Record<string, unknown>);
    if (!ticker) {
      continue;
    }

    if (seen.has(ticker.symbol)) {
      continue;
    }

    seen.add(ticker.symbol);
    tickers.push(ticker);
  }

  return tickers;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const fetchYahooQuoteTickers = async (symbols: string[]) => {
  const normalized = Array.from(
    new Set(
      symbols
        .map((symbol) => (typeof symbol === "string" ? symbol.trim() : ""))
        .filter((symbol) => symbol.length > 0)
        .map((symbol) => symbol.toUpperCase()),
    ),
  );

  if (normalized.length === 0) {
    return [];
  }

  const batches = chunk(normalized, 20);
  const tickers: YahooTicker[] = [];
  const seen = new Set<string>();

  for (const batch of batches) {
    const params = new URLSearchParams({
      symbols: batch.join(","),
    });

    const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?${params.toString()}`, {
      headers: {
        "User-Agent": "MarketMindTickerSearch/1.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance quote request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const quotes = Array.isArray(json?.quoteResponse?.result) ? json.quoteResponse.result : [];

    for (const quote of quotes) {
      const ticker = toTicker(quote as Record<string, unknown>);
      if (!ticker) {
        continue;
      }

      if (seen.has(ticker.symbol)) {
        continue;
      }

      seen.add(ticker.symbol);
      tickers.push(ticker);
    }
  }

  return tickers;
};

const fetchDefaultTickers = async () => {
  try {
    return await fetchYahooQuoteTickers(DEFAULT_SYMBOLS);
  } catch (error) {
    console.error("Failed to fetch default Yahoo tickers:", error);
    return [];
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let query: string | null = null;
  let symbols: string[] | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.query === "string" && body.query.trim().length > 0) {
        query = body.query.trim();
      }

      if (body && Array.isArray(body.symbols)) {
        symbols = body.symbols.filter((item: unknown): item is string => typeof item === "string");
      }
    } catch (_error) {
      // Ignorera JSON-parsningsfel och fall tillbaka till att läsa arket
    }
  }

  try {
    if (symbols && symbols.length > 0) {
      const yahooQuotes = await fetchYahooQuoteTickers(symbols);
      return new Response(
        JSON.stringify({ success: true, source: "yahoo-quotes", tickers: yahooQuotes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (query) {
      const yahooTickers = await fetchYahooSearchTickers(query);
      return new Response(
        JSON.stringify({ success: true, source: "yahoo", tickers: yahooTickers }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sheetTickers = await fetchDefaultTickers();

    return new Response(JSON.stringify({ success: true, source: "sheet", tickers: sheetTickers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ticker lookup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
