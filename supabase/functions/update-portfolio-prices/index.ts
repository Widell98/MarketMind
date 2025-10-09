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

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

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

const isLikelyTicker = (value: string | null | undefined) => {
  if (!value) return false;
  const candidate = value.trim();
  if (!candidate || candidate.length > 15) return false;
  return /^[A-Z0-9._-]+$/.test(candidate);
};

const toNumericQuantity = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "value" in value) {
    return toNumericQuantity((value as { value: unknown }).value);
  }
  return 0;
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

type QuoteResult = {
  symbol: string | null;
  pricePerUnit: number | null;
  currency: string | null;
  changePercent: number | null;
};

const fetchAlphaVantageQuote = async (symbol: string): Promise<QuoteResult | null> => {
  const apiKey = normalizeValue(Deno.env.get("ALPHAVANTAGE_API_KEY"));
  if (!apiKey) {
    console.warn("Alpha Vantage API key is not configured");
    return null;
  }

  const url =
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Alpha Vantage request failed for ${symbol}: ${response.status}`);
      return null;
    }

    const json = await response.json();
    const quote = json?.["Global Quote"] ?? null;
    if (!quote || typeof quote !== "object") {
      console.warn(`Alpha Vantage did not return a quote for ${symbol}`);
      return null;
    }

    const resolvedSymbol = normalizeSymbol(quote["01. symbol"] ?? quote["01. Symbol"] ?? symbol);
    const pricePerUnit = parsePrice(quote["05. price"] ?? quote["05. Price"]);
    const changePercent = parseChangePercent(quote["10. change percent"] ?? quote["10. Change Percent"]);
    const currency = normalizeValue(quote["08. currency"] ?? quote["08. Currency"])?.toUpperCase() ?? "USD";

    if (pricePerUnit === null || pricePerUnit <= 0) {
      console.warn(`Alpha Vantage returned invalid price for ${symbol}`);
      return null;
    }

    return { symbol: resolvedSymbol ?? symbol.toUpperCase(), pricePerUnit, currency, changePercent };
  } catch (error) {
    console.error(`Alpha Vantage request threw for ${symbol}:`, error);
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
    let processedRequestedTicker = false;

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
    const updatedHoldingIds = new Set<string>();

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
      const symbolVariants = getSymbolVariants(rawSymbolValue, sanitizedSymbol);
      const canonicalSymbol = sanitizedSymbol ?? normalizedSymbol;
      if (requestedTicker) {
        const matchesTicker = symbolVariants.some((variant) => variant.toUpperCase() === requestedTicker);
        if (!matchesTicker) continue;
        processedRequestedTicker = true;
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
        } else {
          updated++;
          updatedHoldingIds.add(String(holding.id));
        }
      }
    }

    if (requestedTicker && !processedRequestedTicker) {
      const sanitizedRequested = stripSymbolPrefix(requestedTicker) ?? requestedTicker;
      const alphaVariants = getSymbolVariants(requestedTicker, sanitizedRequested);
      let alphaQuote: QuoteResult | null = null;
      let usedAlphaSymbol: string | null = null;

      for (const variant of alphaVariants) {
        if (!isLikelyTicker(variant)) continue;
        alphaQuote = await fetchAlphaVantageQuote(variant);
        if (alphaQuote) {
          usedAlphaSymbol = variant;
          break;
        }
      }

      if (!alphaQuote && sanitizedRequested !== requestedTicker && isLikelyTicker(sanitizedRequested)) {
        alphaQuote = await fetchAlphaVantageQuote(sanitizedRequested);
        if (alphaQuote) usedAlphaSymbol = sanitizedRequested;
      }

      if (alphaQuote && alphaQuote.pricePerUnit !== null) {
        const priceCurrency = alphaQuote.currency ?? "USD";
        const pricePerUnitInSEK =
          priceCurrency === "SEK"
            ? alphaQuote.pricePerUnit
            : convertToSEK(alphaQuote.pricePerUnit, priceCurrency);

        let query = supabase.from("user_holdings").select("id, quantity");

        if (!isServiceRequest && userId) {
          query = query.eq("user_id", userId);
        }

        query = query.neq("holding_type", "cash");

        if (alphaVariants.length > 1) {
          query = query.or(alphaVariants.map((v) => `symbol.ilike.${v}`).join(","));
        } else {
          query = query.ilike("symbol", alphaVariants[0] ?? sanitizedRequested);
        }

        const { data: holdings, error: selectErr } = await query;
        if (selectErr) {
          console.error(`Error selecting holdings for ${usedAlphaSymbol ?? sanitizedRequested}:`, selectErr);
          errors++;
        } else if (holdings && holdings.length > 0) {
          for (const holding of holdings) {
            const quantity = toNumericQuantity(holding.quantity);
            const computedValue =
              pricePerUnitInSEK !== null && Number.isFinite(quantity)
                ? quantity * pricePerUnitInSEK
                : quantity === 0
                  ? 0
                  : null;

            const payload: Record<string, unknown> = {
              current_price_per_unit: alphaQuote.pricePerUnit,
              price_currency: priceCurrency,
              updated_at: timestamp,
            };

            if (computedValue !== null) {
              payload.current_value = computedValue;
            }
            if (alphaQuote.changePercent !== null) payload.daily_change_pct = alphaQuote.changePercent;

            const { error: updateErr } = await supabase
              .from("user_holdings")
              .update(payload)
              .eq("id", holding.id);
            if (updateErr) {
              console.error(`Error updating holding ${holding.id} from Alpha Vantage:`, updateErr);
              errors++;
            } else {
              updated++;
              processedRequestedTicker = true;
              updatedHoldingIds.add(String(holding.id));
            }
          }
        }
      }
    }

    const alphaQuoteCache = new Map<string, QuoteResult | null>();
    const fetchAlphaWithCache = async (symbol: string) => {
      if (!isLikelyTicker(symbol)) return null;
      const cached = alphaQuoteCache.get(symbol);
      if (cached !== undefined) return cached;
      const quote = await fetchAlphaVantageQuote(symbol);
      alphaQuoteCache.set(symbol, quote);
      return quote;
    };

    const tryUpdateHoldingFromAlpha = async (
      holding: { id: unknown; quantity: unknown },
      quote: QuoteResult,
    ) => {
      if (quote.pricePerUnit === null) return false;

      const priceCurrency = quote.currency ?? "USD";
      const pricePerUnitInSEK =
        priceCurrency === "SEK"
          ? quote.pricePerUnit
          : convertToSEK(quote.pricePerUnit, priceCurrency);

      const quantity = toNumericQuantity(holding.quantity);
      const computedValue =
        pricePerUnitInSEK !== null && Number.isFinite(quantity)
          ? quantity * pricePerUnitInSEK
          : quantity === 0
            ? 0
            : null;

      const payload: Record<string, unknown> = {
        current_price_per_unit: quote.pricePerUnit,
        price_currency: priceCurrency,
        updated_at: timestamp,
      };

      if (computedValue !== null) {
        payload.current_value = computedValue;
      }
      if (quote.changePercent !== null) {
        payload.daily_change_pct = quote.changePercent;
      }

      const { error: updateErr } = await supabase
        .from("user_holdings")
        .update(payload)
        .eq("id", holding.id);

      if (updateErr) {
        console.error(`Error updating holding ${holding.id} from Alpha fallback:`, updateErr);
        errors++;
        return false;
      }

      updated++;
      updatedHoldingIds.add(String(holding.id));
      return true;
    };

    let fallbackQuery = supabase
      .from("user_holdings")
      .select("id, symbol, name, quantity")
      .neq("holding_type", "cash");

    if (!isServiceRequest && userId) {
      fallbackQuery = fallbackQuery.eq("user_id", userId);
    }

    const { data: alphaCandidatesRaw, error: alphaCandidatesError } = await fallbackQuery;
    if (alphaCandidatesError) {
      console.error("Failed to fetch holdings for Alpha fallback:", alphaCandidatesError);
    } else if (alphaCandidatesRaw && alphaCandidatesRaw.length > 0) {
      const alphaCandidates = alphaCandidatesRaw as Array<{
        id: string | number;
        symbol?: string | null;
        name?: string | null;
        quantity?: number | string | null;
      }>;

      const normalizedRequestedTicker = requestedTicker ?? null;

      for (const candidate of alphaCandidates) {
        if (updatedHoldingIds.has(String(candidate.id))) continue;

        const symbolValue = toNullableString(candidate.symbol);
        const sanitizedSymbol = stripSymbolPrefix(symbolValue);
        const nameValue = toNullableString(candidate.name);
        const sanitizedName = stripSymbolPrefix(nameValue);

        const variantSeeds = new Set<string>();
        for (const variant of getSymbolVariants(symbolValue, sanitizedSymbol)) {
          if (isLikelyTicker(variant)) variantSeeds.add(variant);
        }
        for (const variant of getSymbolVariants(nameValue, sanitizedName)) {
          if (isLikelyTicker(variant)) variantSeeds.add(variant);
        }

        if (variantSeeds.size === 0) continue;

        let holdingUpdated = false;
        for (const variant of variantSeeds) {
          const quote = await fetchAlphaWithCache(variant);
          if (!quote) continue;

          const success = await tryUpdateHoldingFromAlpha(candidate, quote);
          if (success) {
            holdingUpdated = true;
            if (normalizedRequestedTicker && variant.toUpperCase() === normalizedRequestedTicker) {
              processedRequestedTicker = true;
            } else if (
              normalizedRequestedTicker &&
              quote.symbol &&
              normalizeSymbol(quote.symbol) === normalizedRequestedTicker
            ) {
              processedRequestedTicker = true;
            }
            break;
          }
        }

        if (!holdingUpdated && normalizedRequestedTicker) {
          const matchesRequested = [...variantSeeds].some(
            (variant) => variant.toUpperCase() === normalizedRequestedTicker,
          );
          if (matchesRequested) {
            unmatched.push({
              symbol: symbolValue ?? undefined,
              name: nameValue ?? undefined,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        errors,
        unmatched,
        requestedTicker,
        tickerFound: requestedTicker ? processedRequestedTicker : undefined,
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
