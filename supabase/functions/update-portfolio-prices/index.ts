import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getSheetValues } from "../getSheetValues.ts";

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

const normalizeHeader = (header: string) => header.trim().toLowerCase();

const resolvePortfolioSheetStructure = (rows: string[][]) => {
  const headerRow = rows[0] ?? [];
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header));

  const companyIdx = normalizedHeaders.findIndex((header) => /(company|bolag)/i.test(header));
  const tickerIdx = normalizedHeaders.findIndex((header) => /ticker/i.test(header));
  const currencyIdx = normalizedHeaders.findIndex((header) => /(currency|valuta)/i.test(header));
  const priceIdx = normalizedHeaders.findIndex((header) => /(price|pris)/i.test(header));
  const changeIdx = normalizedHeaders.findIndex((header) => /(change|förändring)/i.test(header));

  const hasHeader = tickerIdx !== -1 && priceIdx !== -1;

  if (hasHeader) {
    return {
      dataRows: rows.slice(1),
      indices: { companyIdx, tickerIdx, currencyIdx, priceIdx, changeIdx },
      usingFallback: false as const,
    };
  }

  const firstRowLength = (rows[0] ?? []).length;

  if (firstRowLength >= 7) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: 3,
        priceIdx: 4,
        changeIdx: 6,
      },
      usingFallback: true as const,
    };
  }

  if (firstRowLength >= 5) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: 2,
        priceIdx: 3,
        changeIdx: 4,
      },
      usingFallback: true as const,
    };
  }

  if (firstRowLength >= 4) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: 2,
        priceIdx: 3,
        changeIdx: -1,
      },
      usingFallback: true as const,
    };
  }

  if (firstRowLength >= 3) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: -1,
        priceIdx: 2,
        changeIdx: -1,
      },
      usingFallback: true as const,
    };
  }

  return {
    dataRows: rows,
    indices: {
      companyIdx: firstRowLength > 0 ? 0 : -1,
      tickerIdx: firstRowLength > 1 ? 1 : -1,
      currencyIdx: -1,
      priceIdx: firstRowLength > 2 ? 2 : -1,
      changeIdx: -1,
    },
    usingFallback: true as const,
  };
};

const getCell = (row: string[], index: number) => {
  if (index < 0 || index >= row.length) return "";
  const value = row[index];
  return typeof value === "string" ? value : String(value ?? "");
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

    const values = await getSheetValues();
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Google Sheets API returned no rows for the configured range.");
    }

    const nonEmptyRows = values.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim().length > 0)) as string[][];

    if (nonEmptyRows.length === 0) {
      throw new Error("Google Sheets API returned only empty rows for the configured range.");
    }

    const { dataRows, indices, usingFallback } = resolvePortfolioSheetStructure(nonEmptyRows);

    if (usingFallback) {
      console.warn(
        "Google Sheets header row was not detected for update-portfolio-prices. Falling back to expected column order (Company, Ticker, -, Currency, Price, -, Change). Update GOOGLE_SHEET_RANGE to include the header row for more resilient parsing.",
      );
    }

    if (indices.tickerIdx === -1 || indices.priceIdx === -1) {
      const rangeHint =
        "Update GOOGLE_SHEET_RANGE so the selected range includes the header row with Ticker and Price columns.";
      throw new Error(`Google Sheets data is missing required columns (Ticker, Price). ${rangeHint}`);
    }

    const timestamp = new Date().toISOString();
    let updated = 0;
    let errors = 0;
    const unmatched: Array<{ symbol?: string; name?: string }> = [];

    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;

      const company = getCell(row, indices.companyIdx).trim();
      const rawSymbol = getCell(row, indices.tickerIdx).trim();
      const rawCurrency = getCell(row, indices.currencyIdx).trim();
      const rawPrice = getCell(row, indices.priceIdx).trim();
      const rawChange = indices.changeIdx >= 0 ? getCell(row, indices.changeIdx).trim() : "";

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
    console.error("Portfolio update Sheets API error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
