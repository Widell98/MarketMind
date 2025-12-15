import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const finnhubApiKey = Deno.env.get("FINNHUB_API_KEY");

interface FinnhubQuoteResponse {
  c?: number; // Current price
  d?: number; // Change (absolute)
  dp?: number; // Percent change
  h?: number; // High price of the day
  l?: number; // Low price of the day
  o?: number; // Open price of the day
  pc?: number; // Previous close price
}

interface FinnhubProfileResponse {
  currency?: string;
}

type CacheEntry = {
  price: number;
  currency: string | null;
  profileFetched: boolean;
  expiresAt: number;
  change?: number | null;
  changePercent?: number | null;
  high?: number | null;
  low?: number | null;
  open?: number | null;
  previousClose?: number | null;
};

const CACHE_TTL_MS = 60_000; // 1 minute cache window for identical lookups
const priceCache = new Map<string, CacheEntry>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!finnhubApiKey) {
    return new Response(
      JSON.stringify({ error: "FINNHUB_API_KEY is not configured." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const symbol = typeof body?.symbol === "string" ? body.symbol : null;
    const includeProfile = typeof body?.includeProfile === "boolean"
      ? body.includeProfile
      : true;

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
    const now = Date.now();
    const cached = priceCache.get(normalizedSymbol);
    const isCachedValid = cached && cached.expiresAt > now;

    if (isCachedValid && (!includeProfile || cached.profileFetched)) {
      const refreshedEntry: CacheEntry = {
        ...cached!,
        expiresAt: now + CACHE_TTL_MS,
      };
      priceCache.set(normalizedSymbol, refreshedEntry);

      return new Response(
        JSON.stringify({
          symbol: normalizedSymbol,
          price: refreshedEntry.price,
          currency: refreshedEntry.currency,
          profileFetched: refreshedEntry.profileFetched,
          change: refreshedEntry.change ?? null,
          changePercent: refreshedEntry.changePercent ?? null,
          high: refreshedEntry.high ?? null,
          low: refreshedEntry.low ?? null,
          open: refreshedEntry.open ?? null,
          previousClose: refreshedEntry.previousClose ?? null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let price: number | null = null;
    let change: number | null = null;
    let changePercent: number | null = null;
    let high: number | null = null;
    let low: number | null = null;
    let open: number | null = null;
    let previousClose: number | null = null;
    const cachedCurrency: string | null = isCachedValid ? cached!.currency : cached?.currency ?? null;
    let profileFetched = isCachedValid ? cached!.profileFetched : cached?.profileFetched ?? false;

    if (!isCachedValid) {
      const quoteData = await fetchQuote(normalizedSymbol);

      if (!quoteData || typeof quoteData.price !== "number") {
        return new Response(
          JSON.stringify({ error: "Finnhub returned no price for the requested symbol." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      price = quoteData.price;
      change = quoteData.change ?? null;
      changePercent = quoteData.changePercent ?? null;
      high = quoteData.high ?? null;
      low = quoteData.low ?? null;
      open = quoteData.open ?? null;
      previousClose = quoteData.previousClose ?? null;
      profileFetched = false;
    } else {
      price = cached!.price;
      change = cached!.change ?? null;
      changePercent = cached!.changePercent ?? null;
      high = cached!.high ?? null;
      low = cached!.low ?? null;
      open = cached!.open ?? null;
      previousClose = cached!.previousClose ?? null;
    }

    let finalCurrency = cachedCurrency;
    let finalProfileFetched = profileFetched;

    if (includeProfile && (!finalProfileFetched || !finalCurrency)) {
      const profileData = await fetchProfile(normalizedSymbol);
      finalProfileFetched = true;

      if (profileData?.currency) {
        finalCurrency = profileData.currency;
      }
    }

    if (price === null) {
      return new Response(
        JSON.stringify({ error: "Finnhub returned no price for the requested symbol." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const cacheEntry: CacheEntry = {
      price,
      currency: finalCurrency ?? null,
      profileFetched: finalProfileFetched,
      expiresAt: now + CACHE_TTL_MS,
      change,
      changePercent,
      high,
      low,
      open,
      previousClose,
    };

    priceCache.set(normalizedSymbol, cacheEntry);

    return new Response(
      JSON.stringify({
        symbol: normalizedSymbol,
        price,
        currency: cacheEntry.currency,
        profileFetched: cacheEntry.profileFetched,
        change: cacheEntry.change ?? null,
        changePercent: cacheEntry.changePercent ?? null,
        high: cacheEntry.high ?? null,
        low: cacheEntry.low ?? null,
        open: cacheEntry.open ?? null,
        previousClose: cacheEntry.previousClose ?? null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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

async function fetchQuote(symbol: string): Promise<{
  price: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
} | null> {
  try {
    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", finnhubApiKey ?? "");

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Finnhub quote request failed: ${response.status} ${response.statusText}`);
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

    return {
      price,
      change: typeof data.d === "number" && Number.isFinite(data.d) ? data.d : undefined,
      changePercent: typeof data.dp === "number" && Number.isFinite(data.dp) ? data.dp : undefined,
      high: typeof data.h === "number" && Number.isFinite(data.h) && data.h > 0 ? data.h : undefined,
      low: typeof data.l === "number" && Number.isFinite(data.l) && data.l > 0 ? data.l : undefined,
      open: typeof data.o === "number" && Number.isFinite(data.o) && data.o > 0 ? data.o : undefined,
      previousClose: typeof data.pc === "number" && Number.isFinite(data.pc) && data.pc > 0 ? data.pc : undefined,
    };
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
