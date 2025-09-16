
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestedSymbol: string | null = null;

  try {
    const payload = await req.json();
    const { symbol } = payload ?? {};

    if (typeof symbol === "string" && symbol.trim().length > 0) {
      requestedSymbol = symbol.trim();
    } else {
      throw new Error("Symbol is required");
    }

    console.log(`Fetching Yahoo Finance quote for symbol: ${requestedSymbol}`);

    const quote = await fetchFromYahoo(requestedSymbol);

    return new Response(JSON.stringify(quote), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching stock quote from Yahoo:", message);

    return new Response(JSON.stringify({
      symbol: requestedSymbol,
      price: null,
      change: null,
      changePercent: null,
      volume: null,
      high: null,
      low: null,
      open: null,
      previousClose: null,
      lastUpdated: new Date().toISOString(),
      hasValidPrice: false,
      currency: null,
      error: message,
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchFromYahoo(symbol: string) {
  const cleanSymbol = symbol.trim();
  if (!cleanSymbol) {
    throw new Error("Empty symbol provided");
  }

  const yahooSymbol = normalizeYahooSymbol(cleanSymbol);

  const response = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(7000),
    },
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const quote = data?.quoteResponse?.result?.[0];

  if (!quote) {
    throw new Error("Yahoo Finance returned no results for the requested symbol");
  }

  const price = typeof quote.regularMarketPrice === "number" ? quote.regularMarketPrice : null;

  if (price === null || price <= 0) {
    throw new Error("Yahoo Finance returned no valid price data");
  }

  const change = typeof quote.regularMarketChange === "number" ? quote.regularMarketChange : null;
  const changePercent = typeof quote.regularMarketChangePercent === "number"
    ? quote.regularMarketChangePercent
    : null;

  return {
    symbol: quote.symbol ?? yahooSymbol,
    name: quote.longName ?? quote.shortName ?? quote.symbol ?? yahooSymbol,
    price: Math.round(price * 100) / 100,
    change: change !== null ? Math.round(change * 100) / 100 : null,
    changePercent: changePercent !== null ? Math.round(changePercent * 100) / 100 : null,
    volume: typeof quote.regularMarketVolume === "number" ? quote.regularMarketVolume : null,
    high: typeof quote.regularMarketDayHigh === "number" ? Math.round(quote.regularMarketDayHigh * 100) / 100 : null,
    low: typeof quote.regularMarketDayLow === "number" ? Math.round(quote.regularMarketDayLow * 100) / 100 : null,
    open: typeof quote.regularMarketOpen === "number" ? Math.round(quote.regularMarketOpen * 100) / 100 : null,
    previousClose: typeof quote.regularMarketPreviousClose === "number"
      ? Math.round(quote.regularMarketPreviousClose * 100) / 100
      : null,
    lastUpdated: new Date().toISOString(),
    hasValidPrice: true,
    currency: typeof quote.currency === "string" ? quote.currency.toUpperCase() : null,
  };
}

function normalizeYahooSymbol(symbol: string) {
  const trimmed = symbol.trim().toUpperCase();

  if (trimmed.includes(".")) {
    return trimmed;
  }

  // Add common Nordic suffixes only if they appear missing while name suggests Nordic market.
  return trimmed;
}
