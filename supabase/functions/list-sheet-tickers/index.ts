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

const resolveYahooCurrency = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toUpperCase();
  }
  return null;
};

const resolveYahooName = (
  shortName: unknown,
  longName: unknown,
  fallbackSymbol: string,
) => {
  if (typeof shortName === "string" && shortName.trim().length > 0) {
    return shortName.trim();
  }

  if (typeof longName === "string" && longName.trim().length > 0) {
    return longName.trim();
  }

  return fallbackSymbol;
};

const resolveYahooPrice = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const fetchYahooQuoteBatch = async (symbols: string[]) => {
  const uniqueSymbols = Array.from(
    new Set(
      symbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => symbol.length > 0),
    ),
  );

  if (uniqueSymbols.length === 0) {
    return new Map<
      string,
      {
        name: string;
        symbol: string;
        currency: string | null;
        price: number | null;
      }
    >();
  }

  const headers = {
    "User-Agent": "MarketMindTickerSearch/1.0",
    Accept: "application/json",
  };

  const results = new Map<
    string,
    {
      name: string;
      symbol: string;
      currency: string | null;
      price: number | null;
    }
  >();

  const symbolChunks = chunkArray(uniqueSymbols, 20);

  for (const chunk of symbolChunks) {
    const params = new URLSearchParams({
      symbols: chunk.join(","),
      lang: "en-US",
      region: "US",
    });

    try {
      const res = await fetch(
        `https://query2.finance.yahoo.com/v7/finance/quote?${params.toString()}`,
        { headers },
      );

      if (!res.ok) {
        console.warn(
          `Yahoo Finance batch quote request failed: ${res.status} ${res.statusText}`,
        );
        continue;
      }

      const json = await res.json();
      const quoteResults = Array.isArray(json?.quoteResponse?.result)
        ? json.quoteResponse.result
        : [];

      for (const quote of quoteResults) {
        if (!quote || typeof quote.symbol !== "string") {
          continue;
        }

        const resolvedSymbol = quote.symbol.trim().toUpperCase();
        if (!resolvedSymbol) {
          continue;
        }

        const price = resolveYahooPrice(
          quote.regularMarketPrice,
          quote.regularMarketPreviousClose,
          quote.postMarketPrice,
        );

        const currency = resolveYahooCurrency(
          quote.currency ?? quote.financialCurrency ?? null,
        );

        const name = resolveYahooName(
          quote.shortName,
          quote.longName,
          resolvedSymbol,
        );

        results.set(resolvedSymbol, {
          symbol: resolvedSymbol,
          name,
          currency,
          price,
        });
      }
    } catch (error) {
      console.warn("Yahoo Finance batch quote request error:", error);
    }
  }

  return results;
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

    const price = resolveYahooPrice(
      quote.regularMarketPrice,
      quote.regularMarketPreviousClose,
    );

    const currency = resolveYahooCurrency(quote.currency ?? quote.financialCurrency);

    const name = resolveYahooName(quote.shortname, quote.longname, symbol);

    tickers.push({
      symbol,
      name,
      currency,
      price,
    });
  }

  const deduped = new Map<string, {
    name: string;
    symbol: string;
    currency: string | null;
    price: number | null;
  }>();

  for (const ticker of tickers) {
    deduped.set(ticker.symbol, ticker);
  }

  const dedupedTickers = Array.from(deduped.values());

  const symbolsNeedingQuote = dedupedTickers
    .filter((ticker) =>
      !(
        typeof ticker.price === "number" &&
        Number.isFinite(ticker.price) &&
        ticker.price > 0 &&
        typeof ticker.currency === "string" &&
        ticker.currency.trim().length > 0
      )
    )
    .map((ticker) => ticker.symbol);

  if (symbolsNeedingQuote.length === 0) {
    return dedupedTickers;
  }

  const quoteMap = await fetchYahooQuoteBatch(symbolsNeedingQuote);

  return dedupedTickers.map((ticker) => {
    const quote = quoteMap.get(ticker.symbol);
    if (!quote) {
      return ticker;
    }

    const hasTickerPrice =
      typeof ticker.price === "number" &&
      Number.isFinite(ticker.price) &&
      ticker.price > 0;

    const hasTickerCurrency =
      typeof ticker.currency === "string" &&
      ticker.currency.trim().length > 0;

    const hasTickerName =
      typeof ticker.name === "string" &&
      ticker.name.trim().length > 0;

    return {
      symbol: ticker.symbol,
      name: hasTickerName ? ticker.name : quote.name,
      currency: hasTickerCurrency ? ticker.currency : quote.currency,
      price: hasTickerPrice ? ticker.price : quote.price,
    };
  });
};

const fetchYahooQuote = async (symbol: string) => {
  const trimmedSymbol = symbol.trim();
  if (!trimmedSymbol) {
    return [];
  }

  const normalizedSymbol = trimmedSymbol.toUpperCase();
  const headers = {
    "User-Agent": "MarketMindTickerSearch/1.0",
    "Accept": "application/json",
  };

  const tickers: Array<{
    name: string;
    symbol: string;
    currency: string | null;
    price: number | null;
  }> = [];

  const pushTicker = ({
    symbol: incomingSymbol,
    shortName,
    longName,
    currency,
    price,
  }: {
    symbol: string;
    shortName?: unknown;
    longName?: unknown;
    currency: string | null;
    price: number | null;
  }) => {
    const resolvedSymbol = incomingSymbol.trim().toUpperCase();
    if (!resolvedSymbol) {
      return;
    }

    const resolvedPrice = resolveYahooPrice(price);
    const resolvedCurrency = resolveYahooCurrency(currency);
    const resolvedName = resolveYahooName(shortName, longName, resolvedSymbol);

    tickers.push({
      symbol: resolvedSymbol,
      name: resolvedName,
      currency: resolvedCurrency,
      price: resolvedPrice,
    });
  };

  try {
    const summaryRes = await fetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(normalizedSymbol)}?modules=price`,
      { headers },
    );

    if (summaryRes.ok) {
      const summaryJson = await summaryRes.json();
      const summaryResults = Array.isArray(summaryJson?.quoteSummary?.result)
        ? summaryJson.quoteSummary.result
        : [];

      for (const result of summaryResults) {
        const priceModule = result?.price ?? {};
        const rawPrice = resolveYahooPrice(
          priceModule?.regularMarketPrice?.raw,
          priceModule?.regularMarketPreviousClose?.raw,
          priceModule?.postMarketPrice?.raw,
        );

        pushTicker({
          symbol: priceModule?.symbol ?? normalizedSymbol,
          shortName: priceModule?.shortName,
          longName: priceModule?.longName,
          currency: priceModule?.currency ?? priceModule?.financialCurrency ?? null,
          price: rawPrice,
        });
      }

      if (tickers.length > 0) {
        return tickers;
      }
    } else {
      console.warn(
        `Yahoo Finance quoteSummary request failed: ${summaryRes.status} ${summaryRes.statusText}`,
      );
    }
  } catch (error) {
    console.warn("Yahoo Finance quoteSummary request error:", error);
  }

  const params = new URLSearchParams({
    symbols: normalizedSymbol,
    lang: "en-US",
    region: "US",
  });

  const res = await fetch(
    `https://query2.finance.yahoo.com/v7/finance/quote?${params.toString()}`,
    { headers },
  );

  if (!res.ok) {
    throw new Error(`Yahoo Finance quote request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const results = Array.isArray(json?.quoteResponse?.result)
    ? json.quoteResponse.result
    : [];

  for (const quote of results) {
    if (!quote || typeof quote.symbol !== "string") {
      continue;
    }

    const price = resolveYahooPrice(
      quote.regularMarketPrice,
      quote.regularMarketPreviousClose,
      quote.postMarketPrice,
    );

    pushTicker({
      symbol: quote.symbol,
      shortName: quote.shortName,
      longName: quote.longName,
      currency: quote.currency ?? quote.financialCurrency ?? null,
      price,
    });
  }

  const deduped = new Map<string, {
    name: string;
    symbol: string;
    currency: string | null;
    price: number | null;
  }>();

  for (const ticker of tickers) {
    deduped.set(ticker.symbol, ticker);
  }

  return Array.from(deduped.values());
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let query: string | null = null;
  let symbol: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.query === "string" && body.query.trim().length > 0) {
        query = body.query.trim();
      }
      if (body && typeof body.symbol === "string" && body.symbol.trim().length > 0) {
        symbol = body.symbol.trim();
      }
    } catch (_error) {
      // Ignorera JSON-parsningsfel och fall tillbaka till att läsa arket
    }
  }

  try {
    if (symbol) {
      const yahooQuote = await fetchYahooQuote(symbol);
      return new Response(
        JSON.stringify({ success: true, source: "yahoo-quote", tickers: yahooQuote }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
