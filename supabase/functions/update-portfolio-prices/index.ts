import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supabase-klient med lazy init
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase configuration");
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseClient;
};

// === Hjälpfunktioner ===
const normalizeValue = (v?: string | null) => (v?.trim()?.length ? v.trim() : null);
const normalizeSymbol = (v?: string | null) => normalizeValue(v)?.toUpperCase() ?? null;
const normalizeName = (v?: string | null) => normalizeValue(v)?.toUpperCase() ?? null;

const stripSymbolPrefix = (symbol?: string | null) => {
  const normalized = normalizeValue(symbol);
  if (!normalized) return null;
  const upper = normalized.toUpperCase();
  const parts = upper.split(":");
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate : upper;
};

const parsePrice = (v?: string | null) => {
  if (!v) return null;
  const num = parseFloat(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
};

const parseChangePercent = (v?: string | null) => {
  if (!v) return null;
  const num = parseFloat(v.replace(/\s/g, "").replace("%", "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
};

const getSymbolVariants = (symbol: string | null, alternative?: string | null) => {
  const seeds = new Set<string>();

  const addSeed = (value: string | null) => {
    const normalized = normalizeSymbol(value);
    if (!normalized) return;

    seeds.add(normalized);

    const withoutPrefix = stripSymbolPrefix(normalized);
    if (withoutPrefix && withoutPrefix !== normalized) {
      seeds.add(withoutPrefix);
    }
  };

  addSeed(symbol);
  if (alternative) addSeed(alternative);

  const variants = new Set<string>(seeds);

  for (const variant of [...seeds]) {
    if (variant.endsWith(".ST")) {
      const base = variant.replace(/\.ST$/, "");
      if (base.length > 0) {
        variants.add(base);
      }
    } else {
      variants.add(`${variant}.ST`);
    }
  }

  return [...variants];
};

const EXCHANGE_RATES: Record<string, number> = {
  SEK: 1,
  USD: 10.5,
  EUR: 11.4,
  GBP: 13.2,
  NOK: 0.95,
  DKK: 1.53,
  JPY: 0.07,
  CHF: 11.8,
  CAD: 7.8,
  AUD: 7.0,
};

const convertToSEK = (amount: number, currency?: string | null) => {
  if (!Number.isFinite(amount)) return null;
  const c = currency?.toUpperCase();
  if (!c || c === "SEK") return amount;
  const rate = EXCHANGE_RATES[c];
  return typeof rate === "number" ? amount * rate : null;
};

type AlphaQuote = {
  symbol: string;
  name: string | null;
  price: number;
  currency: string | null;
  changePercent: number | null;
};

const fetchAlphaVantageQuote = async (requestedSymbol: string): Promise<AlphaQuote | null> => {
  const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  if (!apiKey) {
    console.warn("Missing ALPHA_VANTAGE_API_KEY – cannot fallback to Alpha Vantage");
    return null;
  }

  const upperRequested = requestedSymbol.toUpperCase();
  let resolvedSymbol = upperRequested;
  let resolvedName: string | null = null;
  let resolvedCurrency: string | null = null;

  try {
    const searchUrl =
      "https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=" +
      encodeURIComponent(upperRequested) +
      `&apikey=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    if (searchResponse.ok) {
      const searchJson = await searchResponse.json();
      const matches: Array<Record<string, string>> = Array.isArray(searchJson?.bestMatches)
        ? searchJson.bestMatches
        : [];
      const exactMatch = matches.find((match) =>
        typeof match?.["1. symbol"] === "string" && match["1. symbol"].toUpperCase() === upperRequested
      );
      const bestMatch = exactMatch ?? matches[0];
      if (bestMatch) {
        const matchSymbol = bestMatch["1. symbol"];
        if (typeof matchSymbol === "string" && matchSymbol.trim().length > 0) {
          resolvedSymbol = matchSymbol.trim().toUpperCase();
        }
        const matchName = bestMatch["2. name"];
        if (typeof matchName === "string" && matchName.trim().length > 0) {
          resolvedName = matchName.trim();
        }
        const matchCurrency = bestMatch["8. currency"];
        if (typeof matchCurrency === "string" && matchCurrency.trim().length > 0) {
          resolvedCurrency = matchCurrency.trim().toUpperCase();
        }
      }
    } else {
      console.warn("Alpha Vantage search request failed:", searchResponse.status, searchResponse.statusText);
    }
  } catch (err) {
    console.error("Alpha Vantage search error:", err);
  }

  try {
    const quoteUrl =
      "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
      encodeURIComponent(resolvedSymbol) +
      `&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    if (!quoteResponse.ok) {
      console.warn("Alpha Vantage quote request failed:", quoteResponse.status, quoteResponse.statusText);
      return null;
    }
    const quoteJson = await quoteResponse.json();
    const globalQuote = quoteJson?.["Global Quote"] ?? quoteJson?.GlobalQuote ?? null;
    if (!globalQuote || typeof globalQuote !== "object") {
      console.warn("Alpha Vantage quote response missing Global Quote block:", quoteJson);
      return null;
    }
    const priceValueRaw = globalQuote["05. price"] ?? globalQuote["05. Price"] ?? null;
    const changePercentRaw = globalQuote["10. change percent"] ?? globalQuote["10. Change Percent"] ?? null;
    const parsedPrice = priceValueRaw !== null ? parseFloat(String(priceValueRaw)) : NaN;
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      console.warn("Alpha Vantage quote returned invalid price:", priceValueRaw);
      return null;
    }
    const parsedChange =
      typeof changePercentRaw === "string" || typeof changePercentRaw === "number"
        ? parseFloat(String(changePercentRaw).replace("%", ""))
        : NaN;

    return {
      symbol: resolvedSymbol,
      name: resolvedName,
      price: parsedPrice,
      currency: resolvedCurrency,
      changePercent: Number.isFinite(parsedChange) ? parsedChange : null,
    };
  } catch (err) {
    console.error("Alpha Vantage quote error:", err);
    return null;
  }
};

// === Edge Function ===
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let payload: { ticker?: string } | null = null;
    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch {
        payload = null;
      }
    }

    const requestedTicker = payload?.ticker ? String(payload.ticker).trim().toUpperCase() : null;
    const requestedTickerVariants = requestedTicker
      ? new Set(getSymbolVariants(requestedTicker).map((variant) => variant.toUpperCase()))
      : null;
    const tickerForAlphaLookup = requestedTickerVariants
      ? Array.from(requestedTickerVariants).find((variant) => !variant.includes(":")) ??
        Array.from(requestedTickerVariants)[0] ??
        requestedTicker
      : requestedTicker;

    let fallbackApplied = false;
    let fallbackQuote: AlphaQuote | null = null;
    const sheetTickerVariants = new Set<string>();

    const supabase = getSupabaseClient();

    const unauthorizedResponse = (status: number, message: string) =>
      new Response(JSON.stringify({ success: false, error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return unauthorizedResponse(401, "Missing authorization header");

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return unauthorizedResponse(401, "Missing access token");

    const serviceToken = Deno.env.get("PORTFOLIO_SERVICE_TOKEN");
    let isServiceRequest = false;
    let userId: string | null = null;

    if (serviceToken && token === serviceToken) {
      isServiceRequest = true;
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) {
        return unauthorizedResponse(403, "Invalid or expired access token");
      }
      userId = userData.user.id;
    }

    if (!isServiceRequest && !requestedTicker) {
      return new Response(
        JSON.stringify({ success: false, error: "Ingen ticker angavs för prisuppdatering" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Hämta CSV från Google Sheets (ändra output till csv)
    const csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvOPfg5tZjaFqCu7b3Li80oPEEuje4tQTcnr6XjxCW_ItVbOGWCvfQfFvWDXRH544MkBKeI1dPyzJG/pub?output=csv";
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();

    // Parsning av CSV → rader
    const rows = csvText.split("\n").map((r) => r.split(","));
    const timestamp = new Date().toISOString();
    let updated = 0;
    let errors = 0;
    const unmatched: Array<{ symbol?: string; name?: string }> = [];

    for (const row of rows) {
      // Anpassa index efter din CSV-struktur (B2:H tidigare)
      const [company, rawSymbol, , rawCurrency, rawPrice, , rawChange] = row.map((c) =>
        c.trim()
      );

      const rawSymbolValue = normalizeValue(rawSymbol);
      const rawNameValue = normalizeValue(company);
      const normalizedSymbol = normalizeSymbol(rawSymbolValue);
      const normalizedName = normalizeName(rawNameValue);
      const sanitizedSymbol = stripSymbolPrefix(rawSymbolValue);
      const canonicalSymbol = sanitizedSymbol ?? normalizedSymbol;
      const symbolVariants = getSymbolVariants(rawSymbolValue, sanitizedSymbol);
      for (const variant of symbolVariants) {
        if (variant) {
          sheetTickerVariants.add(variant.toUpperCase());
        }
      }
      if (canonicalSymbol) {
        sheetTickerVariants.add(canonicalSymbol.toUpperCase());
      }
      if (requestedTickerVariants) {
        const matchesTicker = symbolVariants.some((variant) =>
          requestedTickerVariants.has(variant.toUpperCase())
        );
        if (!matchesTicker) continue;
      }
      const namePattern = normalizedName ? `${normalizedName}%` : null;
      const price = parsePrice(rawPrice);
      const originalCurrency = normalizeValue(rawCurrency)?.toUpperCase() || null;
      const dailyChangePct = parseChangePercent(rawChange);

      const priceCurrency = originalCurrency ?? "SEK";
      const pricePerUnit = price;

      if ((!canonicalSymbol && !normalizedName) || pricePerUnit === null || pricePerUnit <= 0)
        continue;

      const pricePerUnitInSEK =
        priceCurrency === "SEK"
          ? pricePerUnit
          : convertToSEK(pricePerUnit, priceCurrency);

      // Hitta matchande innehav i Supabase
      let query = supabase.from("user_holdings").select("id, quantity");

      if (!isServiceRequest && userId) {
        query = query.eq("user_id", userId);
      }

      query = query.neq("holding_type", "cash");

      if (symbolVariants.length > 0 && namePattern) {
        query.or(
          [...symbolVariants.map((v) => `symbol.ilike.${v}`), `name.ilike.${namePattern}`].join(",")
        );
      } else if (symbolVariants.length > 1) {
        query.or(symbolVariants.map((v) => `symbol.ilike.${v}`).join(","));
      } else if (symbolVariants.length === 1) {
        query.ilike("symbol", symbolVariants[0]);
      } else if (namePattern) {
        query.ilike("name", namePattern);
      } else continue;

      const { data: holdings, error: selectErr } = await query;
      if (selectErr) {
        console.error(`Error selecting holdings for ${canonicalSymbol ?? normalizedName}:`, selectErr);
        errors++;
        continue;
      }

      if (!holdings || holdings.length === 0) {
        unmatched.push({ symbol: canonicalSymbol ?? rawSymbolValue ?? undefined, name: rawNameValue ?? undefined });
        console.warn(`No holdings matched for ${canonicalSymbol ?? normalizedSymbol ?? rawSymbolValue}`);
        continue;
      }

      for (const holding of holdings) {
        const q = Number.isFinite(holding.quantity)
          ? holding.quantity
          : parseFloat(String(holding.quantity ?? "").replace(",", "."));
        const quantity = Number.isFinite(q) ? q : 0;
        const computedValue =
          pricePerUnitInSEK !== null && Number.isFinite(quantity)
            ? quantity * pricePerUnitInSEK
            : quantity === 0
              ? 0
              : null;

        const payload: Record<string, unknown> = {
          current_price_per_unit: pricePerUnit,
          price_currency: priceCurrency,
          updated_at: timestamp,
        };

        if (computedValue !== null) {
          payload.current_value = computedValue;
        }
        if (dailyChangePct !== null) payload.daily_change_pct = dailyChangePct;

        const { error: updateErr } = await supabase.from("user_holdings").update(payload).eq("id", holding.id);
        if (updateErr) {
          console.error(`Error updating holding ${holding.id}:`, updateErr);
          errors++;
        } else updated++;
      }
    }

    const sheetHasRequestedTicker = requestedTickerVariants
      ? Array.from(requestedTickerVariants).some((variant) => sheetTickerVariants.has(variant))
      : false;

    if (tickerForAlphaLookup && requestedTicker && !sheetHasRequestedTicker) {
      const alphaQuote = await fetchAlphaVantageQuote(tickerForAlphaLookup);
      if (alphaQuote) {
        fallbackQuote = alphaQuote;
        fallbackApplied = true;

        const canonicalSymbol = normalizeSymbol(alphaQuote.symbol);
        const normalizedName = normalizeName(alphaQuote.name ?? alphaQuote.symbol);
        const namePattern = normalizedName ? `${normalizedName}%` : null;
        const symbolVariants = getSymbolVariants(alphaQuote.symbol);

        const hasSymbolVariants = symbolVariants.length > 0;

        if (!hasSymbolVariants && !namePattern) {
          unmatched.push({ symbol: canonicalSymbol ?? requestedTicker, name: alphaQuote.name ?? undefined });
          console.warn(`No suitable filters for Alpha Vantage ticker ${canonicalSymbol ?? requestedTicker}`);
        } else {
          const priceCurrency = alphaQuote.currency ?? "USD";
          const pricePerUnit = alphaQuote.price;
          const pricePerUnitInSEK =
            priceCurrency === "SEK" ? pricePerUnit : convertToSEK(pricePerUnit, priceCurrency);

          let query = supabase.from("user_holdings").select("id, quantity");

          if (!isServiceRequest && userId) {
            query = query.eq("user_id", userId);
          }

          query = query.neq("holding_type", "cash");

          if (hasSymbolVariants && namePattern) {
            query.or(
              [...symbolVariants.map((v) => `symbol.ilike.${v}`), `name.ilike.${namePattern}`].join(",")
            );
          } else if (symbolVariants.length > 1) {
            query.or(symbolVariants.map((v) => `symbol.ilike.${v}`).join(","));
          } else if (symbolVariants.length === 1) {
            query.ilike("symbol", symbolVariants[0]);
          } else if (namePattern) {
            query.ilike("name", namePattern);
          }

          const { data: holdings, error: selectErr } = await query;
          if (selectErr) {
            console.error(`Error selecting holdings for Alpha Vantage ticker ${canonicalSymbol}:`, selectErr);
            errors++;
          } else if (!holdings || holdings.length === 0) {
            unmatched.push({ symbol: canonicalSymbol ?? requestedTicker, name: alphaQuote.name ?? undefined });
            console.warn(`No holdings matched Alpha Vantage ticker ${canonicalSymbol ?? requestedTicker}`);
          } else {
            for (const holding of holdings) {
              const q = Number.isFinite(holding.quantity)
                ? holding.quantity
                : parseFloat(String(holding.quantity ?? "").replace(",", "."));
              const quantity = Number.isFinite(q) ? q : 0;
              const computedValue =
                pricePerUnitInSEK !== null && Number.isFinite(quantity)
                  ? quantity * pricePerUnitInSEK
                  : quantity === 0
                    ? 0
                    : null;

              const payload: Record<string, unknown> = {
                current_price_per_unit: pricePerUnit,
                price_currency: priceCurrency,
                updated_at: timestamp,
              };

              if (computedValue !== null) {
                payload.current_value = computedValue;
              }
              if (alphaQuote.changePercent !== null) payload.daily_change_pct = alphaQuote.changePercent;

              const { error: updateErr } = await supabase.from("user_holdings").update(payload).eq("id", holding.id);
              if (updateErr) {
                console.error(`Error updating holding ${holding.id} with Alpha Vantage data:`, updateErr);
                errors++;
              } else {
                updated++;
              }
            }
          }
        }
      }
    }

    const tickerFound = requestedTicker ? sheetHasRequestedTicker || fallbackApplied : undefined;

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        errors,
        unmatched,
        requestedTicker,
        tickerFound,
        sheetHasRequestedTicker: requestedTicker ? sheetHasRequestedTicker : undefined,
        fallbackQuote: fallbackQuote ?? undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Portfolio update error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
