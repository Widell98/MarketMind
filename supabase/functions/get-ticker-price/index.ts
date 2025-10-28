import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const finnhubApiKey = Deno.env.get("FINNHUB_API_KEY")?.trim() ?? null;

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? null;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? null;

const TICKER_PRICE_CACHE_TABLE = "ticker_price_cache";
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const STALE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

interface FinnhubQuoteResponse {
  c?: number; // Current price
  pc?: number; // Previous close price
}

interface FinnhubProfileResponse {
  currency?: string;
}

interface TickerPriceCacheRow {
  symbol: string;
  price: number | null;
  currency: string | null;
  fetched_at: string | null;
}

interface CachedTickerPrice {
  price: number;
  currency: string | null;
  fetchedAt: number;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  }

  return supabaseClient;
};

const getCachedTickerPrice = async (symbol: string): Promise<CachedTickerPrice | null> => {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const normalizedSymbol = symbol.trim().toUpperCase();

    const { data, error } = await client
      .from<TickerPriceCacheRow>(TICKER_PRICE_CACHE_TABLE)
      .select("price, currency, fetched_at")
      .eq("symbol", normalizedSymbol)
      .maybeSingle();

    if (error) {
      console.error("Failed to read cached ticker price:", error);
      return null;
    }

    if (!data || typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0) {
      return null;
    }

    const fetchedAt = data.fetched_at ? Date.parse(data.fetched_at) : NaN;
    if (!Number.isFinite(fetchedAt)) {
      return null;
    }

    const currency = typeof data.currency === "string" && data.currency.trim().length > 0
      ? data.currency.trim().toUpperCase()
      : null;

    return { price: data.price, currency, fetchedAt };
  } catch (error) {
    console.error("Error retrieving cached ticker price:", error);
    return null;
  }
};

const cacheTickerPrice = async (symbol: string, price: number, currency: string | null) => {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const normalizedCurrency = currency && currency.trim().length > 0
      ? currency.trim().toUpperCase()
      : null;

    const { error } = await client
      .from(TICKER_PRICE_CACHE_TABLE)
      .upsert({
        symbol: normalizedSymbol,
        price,
        currency: normalizedCurrency,
        fetched_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to cache ticker price:", error);
    }
  } catch (error) {
    console.error("Unexpected error while caching ticker price:", error);
  }
};

class FinnhubRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "FinnhubRequestError";
  }
}

const buildSuccessResponse = (
  symbol: string,
  price: number,
  currency: string | null,
  {
    stale = false,
    fetchedAt = null,
    cacheStatus,
  }: { stale?: boolean; fetchedAt?: string | null; cacheStatus?: "HIT" | "MISS" | "STALE" } = {},
) => {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (cacheStatus) {
    headers["X-Cache-Status"] = cacheStatus;
  }

  return new Response(
    JSON.stringify({ symbol, price, currency, stale, fetchedAt }),
    { headers },
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A valid ticker symbol is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    const cachedPrice = await getCachedTickerPrice(normalizedSymbol);
    const now = Date.now();

    if (cachedPrice && now - cachedPrice.fetchedAt <= CACHE_TTL_MS) {
      return buildSuccessResponse(normalizedSymbol, cachedPrice.price, cachedPrice.currency, {
        stale: false,
        fetchedAt: new Date(cachedPrice.fetchedAt).toISOString(),
        cacheStatus: "HIT",
      });
    }

    if (!finnhubApiKey || finnhubApiKey.length === 0) {
      if (cachedPrice && now - cachedPrice.fetchedAt <= STALE_CACHE_MAX_AGE_MS) {
        console.warn("FINNHUB_API_KEY missing. Returning cached ticker price.", { symbol: normalizedSymbol });
        return buildSuccessResponse(normalizedSymbol, cachedPrice.price, cachedPrice.currency, {
          stale: true,
          fetchedAt: new Date(cachedPrice.fetchedAt).toISOString(),
          cacheStatus: "STALE",
        });
      }

      return new Response(
        JSON.stringify({ error: "FINNHUB_API_KEY is not configured." }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let quoteData: { price: number } | null = null;
    let quoteError: unknown = null;

    try {
      quoteData = await fetchQuote(normalizedSymbol);
    } catch (error) {
      quoteError = error;
    }

    if (!quoteData || typeof quoteData.price !== "number") {
      if (cachedPrice && now - cachedPrice.fetchedAt <= STALE_CACHE_MAX_AGE_MS) {
        console.warn("Finnhub returned no live price. Falling back to cached value.", { symbol: normalizedSymbol });
        return buildSuccessResponse(normalizedSymbol, cachedPrice.price, cachedPrice.currency, {
          stale: true,
          fetchedAt: new Date(cachedPrice.fetchedAt).toISOString(),
          cacheStatus: "STALE",
        });
      }

      const message = quoteError instanceof FinnhubRequestError
        ? quoteError.message
        : "Finnhub returned no price for the requested symbol.";

      const status = quoteError instanceof FinnhubRequestError
        ? quoteError.status === 429 || quoteError.status === 403
          ? 429
          : quoteError.status
        : 404;

      return new Response(
        JSON.stringify({ error: message }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const profileData = await fetchProfile(normalizedSymbol);
    const resolvedCurrency = profileData?.currency ?? cachedPrice?.currency ?? null;

    await cacheTickerPrice(normalizedSymbol, quoteData.price, resolvedCurrency);

    return buildSuccessResponse(normalizedSymbol, quoteData.price, resolvedCurrency, {
      stale: false,
      fetchedAt: new Date().toISOString(),
      cacheStatus: "MISS",
    });
  } catch (error) {
    console.error("Failed to fetch ticker price from Finnhub:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function fetchQuote(symbol: string): Promise<{ price: number } | null> {
  try {
    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", finnhubApiKey ?? "");

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new FinnhubRequestError(
        `Finnhub quote request failed: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as FinnhubQuoteResponse;
    const price = typeof data.c === "number" && Number.isFinite(data.c) && data.c > 0
      ? data.c
      : typeof data.pc === "number" && Number.isFinite(data.pc) && data.pc > 0
        ? data.pc
        : null;

    if (price === null) {
      return null;
    }

    return { price };
  } catch (error) {
    console.error("Error fetching Finnhub quote:", error);
    throw error;
  }
}

async function fetchProfile(symbol: string): Promise<FinnhubProfileResponse | null> {
  try {
    const url = new URL("https://finnhub.io/api/v1/stock/profile2");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", finnhubApiKey ?? "");

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      console.warn(`Finnhub profile request failed for ${symbol}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as FinnhubProfileResponse;
    if (!data || typeof data.currency !== "string" || data.currency.trim().length === 0) {
      return null;
    }

    return { currency: data.currency.trim().toUpperCase() };
  } catch (error) {
    console.error("Error fetching Finnhub profile:", error);
    return null;
  }
}
