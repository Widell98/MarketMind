import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";
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

const parseCsvRecords = (csvText: string) => {
  const rawRows = parse(csvText.replace(/^\ufeff/, ""), {
    skipFirstRow: false,
  }) as string[][];

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { headers: [] as string[], records: [] as Array<Record<string, string>> };
  }

  const seenHeaders = new Set<string>();
  const ensureHeaderName = (value: string | undefined, index: number) => {
    const base = value?.trim()?.length ? value.trim() : `column_${index}`;
    let candidate = base;
    let counter = 1;
    while (seenHeaders.has(candidate)) {
      candidate = `${base}_${counter++}`;
    }
    seenHeaders.add(candidate);
    return candidate;
  };

  const headerRow = rawRows[0] ?? [];
  const headers = headerRow.map((value, index) => ensureHeaderName(value, index));

  let maxColumns = headers.length;
  for (let i = 1; i < rawRows.length; i++) {
    if (rawRows[i].length > maxColumns) {
      maxColumns = rawRows[i].length;
    }
  }

  for (let i = headers.length; i < maxColumns; i++) {
    headers.push(ensureHeaderName(undefined, i));
  }

  const records = rawRows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = row[i] ?? "";
    }
    return record;
  });

  const sanitizedRecords = records.filter((record) =>
    headers.some((header) => normalizeValue(record[header] ?? null))
  );

  return { headers, records: sanitizedRecords };
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

    const { headers, records: rows } = parseCsvRecords(csvText);

    if (!rows.length) {
      throw new Error("CSV innehåller inga rader");
    }
    const companyKey = headers.find((h) => /company/i.test(h));
    const simpleTickerKey = headers.find((h) => /simple\s*ticker/i.test(h));
    const tickerKey = headers.find((h) => /ticker/i.test(h) && !/simple/i.test(h));
    const currencyKey = headers.find((h) => /currency/i.test(h));
    const priceKey = headers.find((h) => /price/i.test(h));
    const changeKey = headers.find((h) => /change/i.test(h));

    if ((!simpleTickerKey && !tickerKey) || !priceKey) {
      throw new Error("CSV saknar nödvändiga kolumner (Simple Ticker/Ticker, Price).");
    }
    const timestamp = new Date().toISOString();
    let updated = 0;
    let errors = 0;
    const unmatched: Array<{ symbol?: string; name?: string }> = [];

    for (const row of rows) {
      const rawNameValue = normalizeValue(companyKey ? row[companyKey] : null);
      const rawSimpleSymbol = normalizeValue(
        simpleTickerKey ? row[simpleTickerKey] : null,
      );
      const rawTickerSymbol = normalizeValue(
        tickerKey ? row[tickerKey] : null,
      );
      const rawSymbolValue = rawSimpleSymbol ?? rawTickerSymbol;
      const rawCurrencyValue = normalizeValue(currencyKey ? row[currencyKey] : null);
      const rawPriceValue = normalizeValue(row[priceKey]);
      const rawChangeValue = normalizeValue(changeKey ? row[changeKey] : null);

      const normalizedSymbol = normalizeSymbol(rawSymbolValue);
      const normalizedName = normalizeName(rawNameValue);
      const sanitizedSymbol = stripSymbolPrefix(rawTickerSymbol ?? rawSymbolValue);
      const symbolVariants = getSymbolVariants(
        rawSymbolValue,
        rawTickerSymbol && rawTickerSymbol !== rawSymbolValue ? rawTickerSymbol : null,
      );
      const canonicalSymbol = sanitizedSymbol ?? normalizedSymbol;
      if (requestedTicker) {
        const matchesTicker = symbolVariants.some((variant) => variant.toUpperCase() === requestedTicker);
        if (!matchesTicker) continue;
        processedRequestedTicker = true;
      }
      const namePattern = normalizedName ? `${normalizedName}%` : null;
      const price = parsePrice(rawPriceValue);
      const originalCurrency = rawCurrencyValue?.toUpperCase() || null;
      const dailyChangePct = parseChangePercent(rawChangeValue);

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
