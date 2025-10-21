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

  return Array.from(tickerMap.values());
};

const stripSymbolPrefix = (symbol?: string | null) => {
  if (!symbol) return null;
  const trimmed = symbol.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  const parts = upper.split(":");
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate : upper;
};

const getSymbolVariants = (symbol?: string | null) => {
  const variants = new Set<string>();

  const addVariant = (value?: string | null) => {
    if (!value || typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;

    const upper = trimmed.toUpperCase();
    variants.add(upper);

    const stripped = stripSymbolPrefix(upper);
    if (stripped && stripped !== upper) {
      variants.add(stripped);
    }
  };

  addVariant(symbol);

  for (const current of [...variants]) {
    if (current.endsWith(".ST")) {
      const base = current.replace(/\.ST$/, "");
      if (base) variants.add(base);
    } else {
      variants.add(`${current}.ST`);
    }
  }

  return [...variants];
};

const chunkArray = <T>(items: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const fetchYahooQuotes = async (symbols: string[]) => {
  const normalized = symbols
    .filter((symbol): symbol is string => typeof symbol === "string")
    .flatMap((symbol) => getSymbolVariants(symbol))
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => symbol.length > 0);

  const uniqueSymbols = Array.from(new Set(normalized));

  if (uniqueSymbols.length === 0) {
    return [];
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; MarketMindTickerSearch/1.0; +https://marketmind.se)",
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://finance.yahoo.com/",
    Origin: "https://finance.yahoo.com",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  const results: {
    name: string;
    symbol: string;
    currency: string | null;
    price: number | null;
  }[] = [];

  for (const chunk of chunkArray(uniqueSymbols, 10)) {
    const params = new URLSearchParams({
      symbols: chunk.join(","),
      lang: "en-US",
      region: "US",
      corsDomain: "finance.yahoo.com",
    });

    const res = await fetch(
      `https://query2.finance.yahoo.com/v6/finance/quote?${params.toString()}`,
      { headers },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Yahoo Finance quote request failed for symbols [${chunk.join(", ")}]: ${res.status} ${res.statusText}${
          errorText ? ` - ${errorText}` : ""
        }`,
      );
    }

    const json = await res.json();
    const quoteResults = Array.isArray(json?.quoteResponse?.result)
      ? json.quoteResponse.result
      : [];

    for (const quote of quoteResults) {
      if (!quote || typeof quote.symbol !== "string") {
        continue;
      }

      const symbol = quote.symbol.trim().toUpperCase();
      if (!symbol) {
        continue;
      }

      const price = typeof quote.regularMarketPrice === "number"
        && Number.isFinite(quote.regularMarketPrice)
        ? quote.regularMarketPrice
        : null;

      const currency = typeof quote.currency === "string" && quote.currency.trim().length > 0
        ? quote.currency.trim().toUpperCase()
        : null;

      const name = typeof quote.shortName === "string" && quote.shortName.trim().length > 0
        ? quote.shortName.trim()
        : typeof quote.longName === "string" && quote.longName.trim().length > 0
          ? quote.longName.trim()
          : symbol;

      results.push({
        symbol,
        name,
        currency,
        price,
      });
    }
  }

  const deduped = new Map<string, typeof results[number]>();
  results.forEach((item) => {
    if (!deduped.has(item.symbol)) {
      deduped.set(item.symbol, item);
    }
  });

  return Array.from(deduped.values());
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let query: string | null = null;
  let yahooSymbols: string[] = [];

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.query === "string" && body.query.trim().length > 0) {
        query = body.query.trim();
      }
      if (body && Array.isArray(body.symbols)) {
        yahooSymbols = body.symbols.filter((value: unknown): value is string => typeof value === "string");
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
    const combinedTickers = [...sheetTickers];
    const existingSymbols = new Set(
      sheetTickers.map((ticker) => ticker.symbol.trim().toUpperCase()),
    );

    if (yahooSymbols.length > 0) {
      const yahooTickers = await fetchYahooQuotes(yahooSymbols);
      yahooTickers.forEach((ticker) => {
        if (!existingSymbols.has(ticker.symbol.toUpperCase())) {
          combinedTickers.push(ticker);
          existingSymbols.add(ticker.symbol.toUpperCase());
        }
      });
    }

    return new Response(JSON.stringify({ success: true, source: "sheet", tickers: combinedTickers }), {
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
