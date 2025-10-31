import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface FundSearchResult {
  symbol: string;
  name: string;
  price: number | null;
  currency: string | null;
  source: string;
  holdingType: string;
}

const YAHOO_SEARCH_ENDPOINT = "https://query2.finance.yahoo.com/v1/finance/search";

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

const searchYahooFunds = async (query: string): Promise<FundSearchResult[]> => {
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let query = "";

    if (req.method === "POST") {
      const payload = await req.json().catch(() => null);
      if (payload && typeof payload.query === "string") {
        query = payload.query;
      }
    } else {
      const url = new URL(req.url);
      query = url.searchParams.get("query") ?? "";
    }

    query = query.trim();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const funds = await searchYahooFunds(query);

    return new Response(
      JSON.stringify({ success: true, source: "yahoo_funds", funds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("list-funds error", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
