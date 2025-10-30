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
  pc?: number; // Previous close price
}

interface FinnhubProfileResponse {
  currency?: string;
}

class FinnhubHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FinnhubHttpError";
    this.status = status;
  }
}

const normalizeSymbol = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

const stripSymbolPrefix = (symbol?: string | null) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return null;
  }

  if (!normalized.includes(":")) {
    return normalized;
  }

  const parts = normalized.split(":");
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate.toUpperCase() : normalized;
};

const buildSymbolVariants = (symbol: string) => {
  const queue: string[] = [];
  const seen = new Set<string>();
  const enqueue = (value?: string | null) => {
    const normalized = normalizeSymbol(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    queue.push(normalized);
  };

  enqueue(symbol);

  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];

    const withoutPrefix = stripSymbolPrefix(candidate);
    if (withoutPrefix && withoutPrefix !== candidate) {
      enqueue(withoutPrefix);
    }

    const baseCandidate = withoutPrefix ?? candidate;

    if (baseCandidate.endsWith(".ST")) {
      const base = baseCandidate.slice(0, -3);
      if (base.length > 0) {
        enqueue(base);
      }
    } else if (!baseCandidate.includes(".")) {
      enqueue(`${baseCandidate}.ST`);
    }

    if (baseCandidate.includes("-")) {
      const withoutHyphen = baseCandidate.replace(/-/g, "");
      if (withoutHyphen.length > 0) {
        enqueue(withoutHyphen);
      }
    }
  }

  return queue;
};

const createJsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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
    const symbolVariants = buildSymbolVariants(normalizedSymbol);

    let resolvedSymbol: string | null = null;
    let quoteData: { price: number } | null = null;
    let lastError: Error | null = null;

    for (const candidate of symbolVariants) {
      try {
        const result = await fetchQuote(candidate);
        if (result && typeof result.price === "number") {
          resolvedSymbol = candidate;
          quoteData = result;
          break;
        }
      } catch (error) {
        if (error instanceof FinnhubHttpError) {
          console.warn(`Finnhub quote request failed for ${candidate}: ${error.status}`);

          if ([401, 403, 429].includes(error.status)) {
            return createJsonResponse(error.status, {
              error: error.message,
              attemptedSymbols: symbolVariants,
            });
          }

          lastError = error;
          continue;
        }

        const fallbackError = error instanceof Error
          ? error
          : new Error("Unknown Finnhub error");
        console.warn(`Unexpected Finnhub error for ${candidate}:`, fallbackError);
        lastError = fallbackError;
      }
    }

    if (!quoteData || typeof quoteData.price !== "number") {
      const message = lastError instanceof FinnhubHttpError
        ? `Finnhub request failed (${lastError.status}) for the supplied ticker.`
        : "Finnhub returned no price for the requested symbol.";

      return createJsonResponse(404, {
        error: message,
        attemptedSymbols: symbolVariants,
      });
    }

    const profileData = resolvedSymbol ? await fetchProfile(resolvedSymbol) : null;

    return createJsonResponse(200, {
      source: "finnhub",
      requestedSymbol: normalizedSymbol,
      resolvedSymbol,
      symbol: resolvedSymbol ?? normalizedSymbol,
      price: quoteData.price,
      currency: profileData?.currency ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch ticker price from Finnhub:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return createJsonResponse(500, { error: message });
  }
});

async function fetchQuote(symbol: string): Promise<{ price: number } | null> {
  try {
    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("token", finnhubApiKey ?? "");

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new FinnhubHttpError(
        response.status,
        `Finnhub quote request failed: ${response.status} ${response.statusText}`,
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
