import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface YahooQuoteResult {
  symbol: string;
  name: string | null;
  price: number | null;
  currency: string | null;
}

const sanitizeQuote = (quote: any): YahooQuoteResult | null => {
  if (!quote || typeof quote.symbol !== "string") {
    return null;
  }

  const symbol = quote.symbol.trim().toUpperCase();
  if (!symbol) {
    return null;
  }

  const name = typeof quote.shortname === "string" && quote.shortname.trim().length > 0
    ? quote.shortname.trim()
    : typeof quote.longname === "string" && quote.longname.trim().length > 0
      ? quote.longname.trim()
      : null;

  const price = typeof quote.regularMarketPrice === "number" && Number.isFinite(quote.regularMarketPrice)
    ? quote.regularMarketPrice
    : null;

  const currency = typeof quote.currency === "string" && quote.currency.trim().length > 0
    ? quote.currency.trim().toUpperCase()
    : null;

  return {
    symbol,
    name,
    price,
    currency,
  };
};

const fetchYahooTickers = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    lang: "en-US",
    region: "US",
    quotesCount: "20",
  });

  const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const quotes = Array.isArray(payload?.quotes) ? payload.quotes : [];

  const seen = new Set<string>();
  const tickers: YahooQuoteResult[] = [];

  for (const quote of quotes) {
    const sanitized = sanitizeQuote(quote);
    if (!sanitized || seen.has(sanitized.symbol)) {
      continue;
    }

    seen.add(sanitized.symbol);
    tickers.push(sanitized);
  }

  return tickers;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tickers = await fetchYahooTickers(query);

    return new Response(
      JSON.stringify({ success: true, tickers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
