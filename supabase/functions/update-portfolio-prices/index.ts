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

const cleanSheetSymbol = (symbol?: string | null) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  const colonIndex = normalized.indexOf(":");
  if (colonIndex < 0) return normalized;
  const withoutPrefix = normalized.slice(colonIndex + 1);
  return withoutPrefix.length > 0 ? withoutPrefix : normalized;
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

const parseQuantityValue = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

type ScopedHolding = {
  id: string;
  symbol: string | null;
  name: string | null;
  normalizedSymbol: string | null;
  cleanedSymbol: string | null;
  normalizedName: string | null;
  quantity: number;
};

const getSymbolVariants = (symbol: string | null) => {
  if (!symbol) return [];
  const variants = new Set<string>([symbol]);
  if (symbol.endsWith(".ST")) variants.add(symbol.replace(/\.ST$/, ""));
  else variants.add(`${symbol}.ST`);
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
    const supabase = getSupabaseClient();

    let payload: unknown = null;
    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch (_err) {
        payload = null;
      }
    }

    const requestedUserId =
      payload && typeof payload === "object" && payload !== null && "userId" in payload
        ? typeof (payload as Record<string, unknown>).userId === "string"
          ? ((payload as Record<string, unknown>).userId as string)
          : null
        : null;

    let authUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length);
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) authUserId = userData.user.id;
      } catch (authError) {
        console.debug("Failed to resolve authenticated user for price update", authError);
      }
    }

    if (requestedUserId && !authUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required to update specific user holdings." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (requestedUserId && authUserId && requestedUserId !== authUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "You cannot update holdings for another user." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetUserId = authUserId ?? null;

    const scopedHoldings: ScopedHolding[] = [];
    const pendingHoldings = new Map<string, ScopedHolding>();
    const symbolIndex = new Map<string, ScopedHolding[]>();
    const nameIndex = new Map<string, ScopedHolding[]>();

    if (targetUserId) {
      const { data: holdingsData, error: holdingsError } = await supabase
        .from("user_holdings")
        .select("id, symbol, name, quantity, holding_type")
        .eq("user_id", targetUserId)
        .neq("holding_type", "cash")
        .neq("holding_type", "recommendation");

      if (holdingsError) {
        console.error("Failed to load user holdings for price update", holdingsError);
        throw holdingsError;
      }

      if (!holdingsData || holdingsData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, updated: 0, errors: 0, unmatched: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      for (const holding of holdingsData) {
        if (!holding || typeof holding.id !== "string") continue;
        const normalizedSymbol = normalizeSymbol(holding.symbol ?? null);
        const cleanedSymbol = cleanSheetSymbol(holding.symbol ?? null);
        const normalizedName = normalizeName(holding.name ?? null);
        const quantity = parseQuantityValue(holding.quantity);

        const record: ScopedHolding = {
          id: holding.id,
          symbol: holding.symbol ?? null,
          name: holding.name ?? null,
          normalizedSymbol,
          cleanedSymbol,
          normalizedName,
          quantity,
        };

        scopedHoldings.push(record);
        pendingHoldings.set(record.id, record);

        const variantSet = new Set<string>();
        if (cleanedSymbol) {
          for (const variant of getSymbolVariants(cleanedSymbol)) variantSet.add(variant);
          variantSet.add(cleanedSymbol);
        }
        if (normalizedSymbol) variantSet.add(normalizedSymbol);

        for (const variant of variantSet) {
          const list = symbolIndex.get(variant) ?? [];
          if (!list.some((h) => h.id === record.id)) list.push(record);
          symbolIndex.set(variant, list);
        }

        if (normalizedName) {
          const list = nameIndex.get(normalizedName) ?? [];
          list.push(record);
          nameIndex.set(normalizedName, list);
        }
      }
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
      const cleanedSymbol = cleanSheetSymbol(rawSymbolValue);
      const normalizedName = normalizeName(rawNameValue);
      const namePattern = normalizedName ? `${normalizedName}%` : null;
      const price = parsePrice(rawPrice);
      const originalCurrency = normalizeValue(rawCurrency)?.toUpperCase() || null;
      const dailyChangePct = parseChangePercent(rawChange);

      let resolvedPrice = price;
      let priceCurrency = originalCurrency ?? "SEK";

      if (price !== null) {
        const converted = convertToSEK(price, originalCurrency ?? "SEK");
        if (converted !== null) {
          resolvedPrice = converted;
          priceCurrency = "SEK";
        }
      }

      if ((!normalizedSymbol && !normalizedName) || resolvedPrice === null || resolvedPrice <= 0)
        continue;

      // Hitta matchande innehav
      const symbolVariantSet = new Set<string>(getSymbolVariants(cleanedSymbol));
      if (normalizedSymbol && normalizedSymbol !== cleanedSymbol) {
        symbolVariantSet.add(normalizedSymbol);
      }
      const symbolVariants = [...symbolVariantSet];

      if (targetUserId) {
        const candidateMap = new Map<string, ScopedHolding>();
        for (const variant of symbolVariants) {
          const matches = symbolIndex.get(variant);
          if (matches) {
            for (const match of matches) candidateMap.set(match.id, match);
          }
        }

        if (candidateMap.size === 0 && normalizedName) {
          const directMatches = nameIndex.get(normalizedName);
          if (directMatches) {
            for (const match of directMatches) candidateMap.set(match.id, match);
          }

          if (candidateMap.size === 0) {
            for (const holding of scopedHoldings) {
              if (!holding.normalizedName || !normalizedName) continue;
              if (
                holding.normalizedName.startsWith(normalizedName) ||
                normalizedName.startsWith(holding.normalizedName)
              ) {
                candidateMap.set(holding.id, holding);
              }
            }
          }
        }

        if (candidateMap.size === 0) continue;

        for (const holding of candidateMap.values()) {
          const quantity = Number.isFinite(holding.quantity) ? holding.quantity : 0;
          const computedValue = quantity * (resolvedPrice ?? 0);

          const updatePayload: Record<string, unknown> = {
            current_price_per_unit: resolvedPrice,
            price_currency: priceCurrency,
            current_value: computedValue,
            updated_at: timestamp,
          };
          if (dailyChangePct !== null) updatePayload.daily_change_pct = dailyChangePct;

          const { error: updateErr } = await supabase
            .from("user_holdings")
            .update(updatePayload)
            .eq("id", holding.id);
          if (updateErr) {
            console.error(`Error updating holding ${holding.id}:`, updateErr);
            errors++;
          } else {
            updated++;
            pendingHoldings.delete(holding.id);
          }
        }

        continue;
      }

      const query = supabase
        .from("user_holdings")
        .select("id, quantity")
        .neq("holding_type", "cash")
        .neq("holding_type", "recommendation");

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
        console.error(`Error selecting holdings for ${normalizedSymbol ?? normalizedName}:`, selectErr);
        errors++;
        continue;
      }

      if (!holdings || holdings.length === 0) {
        unmatched.push({ symbol: rawSymbolValue ?? undefined, name: rawNameValue ?? undefined });
        console.warn(`No holdings matched for ${normalizedSymbol ?? rawSymbolValue}`);
        continue;
      }

      for (const holding of holdings) {
        const quantity = parseQuantityValue(holding.quantity);
        const computedValue = quantity * (resolvedPrice ?? 0);

        const updatePayload: Record<string, unknown> = {
          current_price_per_unit: resolvedPrice,
          price_currency: priceCurrency,
          current_value: computedValue,
          updated_at: timestamp,
        };
        if (dailyChangePct !== null) updatePayload.daily_change_pct = dailyChangePct;

        const { error: updateErr } = await supabase.from("user_holdings").update(updatePayload).eq("id", holding.id);
        if (updateErr) {
          console.error(`Error updating holding ${holding.id}:`, updateErr);
          errors++;
        } else updated++;
      }
    }

    if (targetUserId) {
      unmatched.push(
        ...Array.from(pendingHoldings.values()).map((holding) => ({
          symbol: holding.symbol ?? undefined,
          name: holding.name ?? undefined,
        })),
      );
    }

    return new Response(JSON.stringify({ success: true, updated, errors, unmatched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Portfolio update error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
