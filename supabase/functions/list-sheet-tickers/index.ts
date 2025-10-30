import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Din publicerade CSV-URL
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const fetchSheetTickers = async () => {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const csvText = await res.text();

  // ✅ Använd riktig CSV-parser
  const rawRows = parse(csvText, {
    skipFirstRow: false,
    columns: false,
  }) as string[][];

  if (!rawRows.length) throw new Error("CSV saknar rader.");

  const headers = rawRows[0].map((h) =>
    typeof h === "string" ? h.trim() : ""
  );
  const dataRows = rawRows.slice(1);

  const companyIdx = headers.findIndex((h) => /company/i.test(h));
  const simpleTickerIdx = headers.findIndex((h) => /simple\s*ticker/i.test(h));
  const tickerIdx = headers.findIndex((h) => /ticker/i.test(h) && !/simple/i.test(h));
  const currencyIdx = headers.findIndex((h) => /(currency|valuta)/i.test(h));
  const priceIdx = headers.findIndex((h) => /(price|senast|last)/i.test(h));

  if (tickerIdx === -1 && simpleTickerIdx === -1) {
    throw new Error("CSV saknar nödvändiga kolumner (Ticker eller Simpel Ticker).");
  }

  const tickerMap = new Map<
    string,
    { name: string; symbol: string; currency: string | null; price: number | null }
  >();

  for (const cols of dataRows) {
    const rawName = normalizeValue(companyIdx !== -1 ? cols[companyIdx] : null);
    const rawSimpleSymbol = simpleTickerIdx !== -1 ? normalizeValue(cols[simpleTickerIdx]) : null;
    const rawSymbol = tickerIdx !== -1 ? normalizeValue(cols[tickerIdx]) : null;
    const rawCurrency = currencyIdx !== -1 ? normalizeValue(cols[currencyIdx]) : null;
    const rawPrice = priceIdx !== -1 ? normalizeValue(cols[priceIdx]) : null;

    const selectedSymbol = rawSimpleSymbol ?? rawSymbol;
    if (!selectedSymbol) continue;

    // Ta bort ev. "STO:" prefix
    const cleanedSymbol = selectedSymbol.includes(":")
      ? selectedSymbol.split(":").pop()!.toUpperCase()
      : selectedSymbol.toUpperCase();

    const price = rawPrice
      ? parseFloat(rawPrice.replace(/\s/g, "").replace(",", "."))
      : null;

    tickerMap.set(cleanedSymbol, {
      symbol: cleanedSymbol,
      name: rawName ?? cleanedSymbol,
      currency: rawCurrency ?? null,
      price,
    });
  }

  return Array.from(tickerMap.values());
};

const fetchYahooTickers = async (query: string) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    lang: "en-US",
    region: "US",
    quotesCount: "20",
    newsCount: "0",
  });

  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?${params.toString()}`,
    {
      headers: {
        "User-Agent": "MarketMindTickerSearch/1.0",
        "Accept": "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const quotes = Array.isArray(json?.quotes) ? json.quotes : [];

  const seen = new Set<string>();
  const tickers: {
    name: string;
    symbol: string;
    currency: string | null;
    price: number | null;
  }[] = [];

  for (const quote of quotes) {
    if (!quote || typeof quote.symbol !== "string") {
      continue;
    }

    const symbol = quote.symbol.trim().toUpperCase();
    if (!symbol || seen.has(symbol)) {
      continue;
    }
    seen.add(symbol);

    const price = typeof quote.regularMarketPrice === "number"
      && Number.isFinite(quote.regularMarketPrice)
      ? quote.regularMarketPrice
      : null;

    const currency = typeof quote.currency === "string" && quote.currency.trim().length > 0
      ? quote.currency.trim().toUpperCase()
      : null;

    const name = typeof quote.shortname === "string" && quote.shortname.trim().length > 0
      ? quote.shortname.trim()
      : typeof quote.longname === "string" && quote.longname.trim().length > 0
        ? quote.longname.trim()
        : symbol;

    tickers.push({
      symbol,
      name,
      currency,
      price,
    });
  }

  return tickers;
};

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

  let query: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.query === "string" && body.query.trim().length > 0) {
        query = body.query.trim();
      }
    } catch (_error) {
      // Ignorera JSON-parsningsfel och fall tillbaka till att läsa arket
    }
  }

  try {
    if (query) {
      const yahooTickers = await fetchYahooTickers(query);
      return new Response(
        JSON.stringify({ success: true, source: "yahoo", tickers: yahooTickers }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sheetTickers = await fetchSheetTickers();

    return new Response(JSON.stringify({ success: true, source: "sheet", tickers: sheetTickers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ticker lookup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
