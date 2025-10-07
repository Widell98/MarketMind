import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseClient;
};

const normalizeValue = (value?: string | null) =>
  value && value.trim().length > 0 ? value.trim() : null;

const normalizeSymbol = (value?: string | null) =>
  normalizeValue(value)?.toUpperCase() ?? null;

const parsePrice = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseFloat(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseChangePercent = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseFloat(value.replace(/\s/g, "").replace("%", "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

type QuoteResult = {
  pricePerUnit: number;
  currency: string | null;
  changePercent: number | null;
};

type QuoteFetchResponse = {
  quote: QuoteResult | null;
  error?: string;
};

const fetchAlphaVantageQuote = async (symbol: string): Promise<QuoteFetchResponse> => {
  const apiKey = normalizeValue(Deno.env.get("ALPHAVANTAGE_API_KEY"));
  if (!apiKey) {
    console.warn("Alpha Vantage API key is not configured");
    return { quote: null, error: "Alpha Vantage API key is not configured." };
  }

  const url =
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const message = `Alpha Vantage request failed for ${symbol}: ${response.status}`;
      console.warn(message);
      return { quote: null, error: message };
    }

    const json = await response.json();
    const quote = json?.["Global Quote"] ?? null;
    if (!quote || typeof quote !== "object") {
      const message = `Alpha Vantage did not return a quote for ${symbol}`;
      console.warn(message);
      return { quote: null, error: message };
    }

    const pricePerUnit = parsePrice(quote["05. price"] ?? quote["05. Price"]);
    if (pricePerUnit === null || pricePerUnit <= 0) {
      const message = `Alpha Vantage returned invalid price for ${symbol}`;
      console.warn(message);
      return { quote: null, error: message };
    }

    const changePercent = parseChangePercent(quote["10. change percent"] ?? quote["10. Change Percent"]);
    const currency = normalizeValue(quote["08. currency"] ?? quote["08. Currency"])?.toUpperCase() ?? "USD";

    return {
      quote: {
        pricePerUnit,
        currency,
        changePercent,
      },
    };
  } catch (error) {
    console.error(`Alpha Vantage request threw for ${symbol}:`, error);
    const message = error instanceof Error ? error.message : "Failed to fetch Alpha Vantage quote.";
    return { quote: null, error: message };
  }
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed",
    });
  }

  const supabase = getSupabaseClient();

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, {
      success: false,
      error: "Missing authorization header",
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse(401, {
      success: false,
      error: "Invalid access token",
    });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse(403, {
      success: false,
      error: "Invalid or expired access token",
    });
  }

  let payload: { symbol?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    // Ignore JSON parse errors; handled below
  }

  const normalizedSymbol = normalizeSymbol(payload?.symbol ?? null);
  if (!normalizedSymbol) {
    return jsonResponse(400, {
      success: false,
      error: "Ingen symbol angavs för prisuppslag.",
    });
  }

  const { quote, error } = await fetchAlphaVantageQuote(normalizedSymbol);
  if (!quote) {
    return jsonResponse(200, {
      success: false,
      symbol: normalizedSymbol,
      error: error ?? "Kunde inte hämta pris från Alpha Vantage.",
    });
  }

  return jsonResponse(200, {
    success: true,
    symbol: normalizedSymbol,
    quote: {
      pricePerUnit: quote.pricePerUnit,
      currency: quote.currency,
      changePercent: quote.changePercent,
      fetchedAt: new Date().toISOString(),
    },
  });
});
