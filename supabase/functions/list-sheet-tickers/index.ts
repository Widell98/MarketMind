import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Din publicerade CSV-URL
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type AlphaTickerMatch = {
  symbol: string;
  name: string;
  currency: string | null;
  price: number | null;
  source: "alpha_vantage";
};

const fetchAlphaVantageMatch = async (ticker: string): Promise<AlphaTickerMatch | null> => {
  const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  if (!apiKey) {
    console.warn("Missing ALPHA_VANTAGE_API_KEY – cannot search Alpha Vantage for ticker", ticker);
    return null;
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  let resolvedSymbol = normalizedTicker;
  let resolvedName: string | null = null;
  let resolvedCurrency: string | null = null;

  try {
    const searchUrl =
      "https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=" +
      encodeURIComponent(normalizedTicker) +
      `&apikey=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    if (searchResponse.ok) {
      const searchJson = await searchResponse.json();
      const matches: Array<Record<string, string>> = Array.isArray(searchJson?.bestMatches)
        ? searchJson.bestMatches
        : [];
      const exactMatch = matches.find((match) =>
        typeof match?.["1. symbol"] === "string" && match["1. symbol"].toUpperCase() === normalizedTicker
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
      console.warn("Alpha Vantage SYMBOL_SEARCH failed:", searchResponse.status, searchResponse.statusText);
    }
  } catch (err) {
    console.error("Alpha Vantage SYMBOL_SEARCH error:", err);
  }

  let resolvedPrice: number | null = null;
  try {
    const quoteUrl =
      "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
      encodeURIComponent(resolvedSymbol) +
      `&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    if (quoteResponse.ok) {
      const quoteJson = await quoteResponse.json();
      const globalQuote = quoteJson?.["Global Quote"] ?? quoteJson?.GlobalQuote ?? null;
      if (globalQuote && typeof globalQuote === "object") {
        const priceRaw = globalQuote["05. price"] ?? globalQuote["05. Price"] ?? null;
        const parsedPrice = priceRaw !== null ? parseFloat(String(priceRaw)) : NaN;
        if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
          resolvedPrice = parsedPrice;
        }
      }
    } else {
      console.warn("Alpha Vantage GLOBAL_QUOTE failed:", quoteResponse.status, quoteResponse.statusText);
    }
  } catch (err) {
    console.error("Alpha Vantage GLOBAL_QUOTE error:", err);
  }

  if (!resolvedName && !resolvedSymbol) {
    return null;
  }

  return {
    symbol: resolvedSymbol,
    name: resolvedName ?? resolvedSymbol,
    currency: resolvedCurrency,
    price: resolvedPrice,
    source: "alpha_vantage",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: { ticker?: string | null } | null = null;
    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch {
        payload = null;
      }
    }

    const requestedTicker = payload?.ticker ? String(payload.ticker).trim().toUpperCase() : null;

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

    console.log("Headers:", headers);

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

    const tickers = Array.from(tickerMap.values()).map((item) => ({ ...item, source: "google_sheets" as const }));

    let fallbackTicker: AlphaTickerMatch | null = null;
    if (requestedTicker) {
      const existsInSheet = tickers.some((t) => t.symbol.toUpperCase() === requestedTicker);
      if (!existsInSheet) {
        fallbackTicker = await fetchAlphaVantageMatch(requestedTicker);
        if (fallbackTicker) {
          const alreadyIncluded = tickers.some((t) => t.symbol.toUpperCase() === fallbackTicker.symbol.toUpperCase());
          if (!alreadyIncluded) {
            tickers.push(fallbackTicker);
          }
        }
      }
    }

    // 🔍 Debug-loggar
    // console.log("Antal rader i CSV:", rawRows.length);
    // console.log("Antal tickers:", tickers.length);
    // console.log("Första 3:", tickers.slice(0, 3));
    // console.log("Sista 3:", tickers.slice(-3));

    return new Response(
      JSON.stringify({ success: true, tickers, requestedTicker: requestedTicker ?? undefined, fallbackTicker: fallbackTicker ?? undefined }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Sheet parsing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
