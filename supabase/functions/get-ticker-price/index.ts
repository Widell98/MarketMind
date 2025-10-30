import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

const finnhubApiKey = Deno.env.get("FINNHUB_API_KEY");

interface FinnhubQuoteResponse {
  c?: number; // Current price
  pc?: number; // Previous close price
}

interface FinnhubProfileResponse {
  currency?: string;
}

serve(async (req) => {
  const { headers: corsHeaders, originAllowed } = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed) {
      return new Response("Origin not allowed", { status: 403, headers: corsHeaders });
    }

    return new Response(null, { headers: corsHeaders });
  }

  if (!originAllowed) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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

    const profileData = await fetchProfile(normalizedSymbol);

    return new Response(
      JSON.stringify({
        symbol: normalizedSymbol,
        price: quoteData.price,
        currency: profileData?.currency ?? null,
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

async function fetchQuote(symbol: string): Promise<{ price: number } | null> {
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
