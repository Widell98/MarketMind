import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

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

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeSymbol = (value?: string | null) => normalizeValue(value)?.toUpperCase() ?? null;

const parseNumber = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseFloat(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const stripSymbolPrefix = (symbol?: string | null) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  const parts = normalized.split(":");
  const last = parts[parts.length - 1]?.trim();
  return last && last.length > 0 ? last : normalized;
};

const getSymbolVariants = (symbol: string) => {
  const variants = new Set<string>();
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return [] as string[];

  variants.add(normalized);

  const stripped = stripSymbolPrefix(normalized);
  if (stripped && stripped !== normalized) {
    variants.add(stripped);
  }

  if (normalized.endsWith(".ST")) {
    variants.add(normalized.replace(/\.ST$/, ""));
  } else {
    variants.add(`${normalized}.ST`);
  }

  return Array.from(variants);
};

interface SheetTicker {
  symbol: string;
  name: string;
  currency: string | null;
  price: number | null;
}

type SheetTickerMap = Map<string, SheetTicker>;

const loadSheetTickers = async (): Promise<SheetTickerMap> => {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const rawRows = parse(csvText, {
    skipFirstRow: false,
    columns: false,
  }) as string[][];

  if (!rawRows.length) {
    throw new Error("CSV saknar rader.");
  }

  const headers = rawRows[0].map((header) => (typeof header === "string" ? header.trim() : ""));
  const dataRows = rawRows.slice(1);

  const companyIdx = headers.findIndex((header) => /company/i.test(header));
  const simpleTickerIdx = headers.findIndex((header) => /simple\s*ticker/i.test(header));
  const tickerIdx = headers.findIndex((header) => /ticker/i.test(header) && !/simple/i.test(header));
  const currencyIdx = headers.findIndex((header) => /(currency|valuta)/i.test(header));
  const priceIdx = headers.findIndex((header) => /(price|senast|last)/i.test(header));

  if (tickerIdx === -1 && simpleTickerIdx === -1) {
    throw new Error("CSV saknar nödvändiga kolumner (Ticker eller Simpel Ticker).");
  }

  const tickerMap: SheetTickerMap = new Map();

  for (const row of dataRows) {
    const rawName = companyIdx !== -1 ? normalizeValue(row[companyIdx]) : null;
    const rawSimpleSymbol = simpleTickerIdx !== -1 ? normalizeValue(row[simpleTickerIdx]) : null;
    const rawSymbol = tickerIdx !== -1 ? normalizeValue(row[tickerIdx]) : null;
    const rawCurrency = currencyIdx !== -1 ? normalizeValue(row[currencyIdx]) : null;
    const rawPrice = priceIdx !== -1 ? normalizeValue(row[priceIdx]) : null;

    const selectedSymbol = rawSimpleSymbol ?? rawSymbol;
    if (!selectedSymbol) continue;

    const cleanedSymbol = selectedSymbol.includes(":")
      ? selectedSymbol.split(":").pop()!.toUpperCase()
      : selectedSymbol.toUpperCase();

    const price = rawPrice ? parseNumber(rawPrice) : null;

    tickerMap.set(cleanedSymbol, {
      symbol: cleanedSymbol,
      name: rawName ?? cleanedSymbol,
      currency: rawCurrency ? rawCurrency.toUpperCase() : null,
      price,
    });
  }

  return tickerMap;
};

interface AlphaSearchMatch {
  symbol: string;
  name: string;
  region: string | null;
  currency: string | null;
  matchScore: number | null;
  assetType: string | null;
}

const fetchAlphaVantageSearch = async (keywords: string) => {
  const apiKey = normalizeValue(Deno.env.get("ALPHAVANTAGE_API_KEY"));
  if (!apiKey) {
    throw new Error("Alpha Vantage API key is not configured.");
  }

  const url =
    `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed: ${response.status}`);
  }

  const json = await response.json();
  if (typeof json !== "object" || !json) {
    throw new Error("Invalid response from Alpha Vantage.");
  }

  if (json.Note) {
    return { matches: [] as AlphaSearchMatch[], note: String(json.Note) };
  }

  const rawMatches = Array.isArray(json?.bestMatches) ? json.bestMatches : [];
  const matches: AlphaSearchMatch[] = rawMatches
    .map((item: Record<string, string | null | undefined>) => {
      const symbol = normalizeSymbol(item["1. symbol"]);
      if (!symbol) return null;

      const name = normalizeValue(item["2. name"]);
      const region = normalizeValue(item["4. region"]);
      const currency = normalizeSymbol(item["8. currency"]);
      const matchScore = parseNumber(item["9. matchScore"] ?? item["9. matchscore"]);
      const assetType = normalizeValue(item["3. type"]);

      return {
        symbol,
        name: name ?? symbol,
        region,
        currency,
        matchScore,
        assetType,
      };
    })
    .filter((item): item is AlphaSearchMatch => Boolean(item));

  return { matches, note: null as string | null };
};

const matchSheetTicker = (symbol: string, sheetMap: SheetTickerMap) => {
  const variants = getSymbolVariants(symbol);
  for (const variant of variants) {
    if (sheetMap.has(variant)) {
      return sheetMap.get(variant)!;
    }
  }
  return null;
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
    return jsonResponse(405, { success: false, error: "Method not allowed" });
  }

  const supabase = getSupabaseClient();

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { success: false, error: "Missing authorization header" });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse(401, { success: false, error: "Invalid access token" });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse(403, { success: false, error: "Invalid or expired access token" });
  }

  let payload: { query?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const normalizedQuery = normalizeValue(payload?.query ?? null);
  if (!normalizedQuery) {
    return jsonResponse(400, { success: false, error: "Ingen sökterm angavs." });
  }

  try {
    const [sheetMap, searchResult] = await Promise.all([
      loadSheetTickers(),
      fetchAlphaVantageSearch(normalizedQuery),
    ]);

    const matchesWithSheet = searchResult.matches.map((match) => ({
      ...match,
      sheet: matchSheetTicker(match.symbol, sheetMap),
    }));

    return jsonResponse(200, {
      success: true,
      query: normalizedQuery,
      matches: matchesWithSheet,
      note: searchResult.note,
    });
  } catch (error) {
    console.error("Alpha Vantage search failed:", error);
    const message = error instanceof Error ? error.message : "Kunde inte söka tickers.";
    return jsonResponse(200, { success: false, error: message });
  }
});
