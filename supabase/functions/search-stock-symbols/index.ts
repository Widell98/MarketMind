import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const alphaVantageKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");

interface TickerResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  region?: string;
  currency?: string;
  source: string;
}

type YahooQuote = {
  symbol?: string;
  longname?: string;
  shortname?: string;
  exchange?: string;
  fullExchangeName?: string;
  quoteType?: string;
  region?: string;
  currency?: string;
};

type AlphaVantageMatch = {
  [key: string]: string | undefined;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchTerm = query.trim();
    const results = await searchTickers(searchTerm);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching for tickers:", error);

    return new Response(
      JSON.stringify({
        results: getMockResults(""),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function searchTickers(query: string): Promise<TickerResult[]> {
  const results: TickerResult[] = [];
  const errors: string[] = [];

  try {
    const yahooResults = await searchYahooFinance(query);
    results.push(...yahooResults);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Yahoo error";
    errors.push(`Yahoo Finance error: ${message}`);
    console.error("Yahoo Finance search failed:", message);
  }

  if (results.length < 5 && alphaVantageKey) {
    try {
      const alphaResults = await searchAlphaVantage(query);
      results.push(...alphaResults);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Alpha Vantage error";
      errors.push(`Alpha Vantage error: ${message}`);
      console.error("Alpha Vantage search failed:", message);
    }
  }

  if (results.length < 5) {
    const mockResults = getMockResults(query);
    results.push(...mockResults);
  }

  if (errors.length) {
    console.log("Ticker search completed with warnings:", errors.join(" | "));
  }

  return deduplicate(results).slice(0, 15);
}

async function searchYahooFinance(query: string): Promise<TickerResult[]> {
  const url = new URL("https://query2.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", "10");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("enableFuzzyQuery", "false");
  url.searchParams.set("lang", "en-US");
  url.searchParams.set("region", "US");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarketMindBot/1.0; +https://lovable.dev)",
      "Accept": "application/json, text/plain, */*",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned status ${response.status}`);
  }

  const data = await response.json();
  const rawQuotes = Array.isArray(data?.quotes) ? (data.quotes as unknown[]) : [];

  return rawQuotes
    .filter((quote): quote is YahooQuote => {
      return (
        typeof quote === "object" &&
        quote !== null &&
        typeof (quote as YahooQuote).symbol === "string" &&
        (typeof (quote as YahooQuote).longname === "string" ||
          typeof (quote as YahooQuote).shortname === "string" ||
          typeof (quote as YahooQuote).symbol === "string")
      );
    })
    .map((quote) => ({
      symbol: String(quote.symbol).toUpperCase(),
      name: String(quote.longname || quote.shortname || quote.symbol),
      exchange: quote.exchange || quote.fullExchangeName || undefined,
      type: quote.quoteType || undefined,
      region: quote.region || undefined,
      currency: quote.currency || undefined,
      source: "yahoo",
    }));
}

async function searchAlphaVantage(query: string): Promise<TickerResult[]> {
  if (!alphaVantageKey) return [];

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "SYMBOL_SEARCH");
  url.searchParams.set("keywords", query);
  url.searchParams.set("apikey", alphaVantageKey);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarketMindBot/1.0; +https://lovable.dev)",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage returned status ${response.status}`);
  }

  const data = await response.json();
  const rawMatches = Array.isArray(data?.bestMatches) ? (data.bestMatches as unknown[]) : [];

  return rawMatches
    .filter((match): match is AlphaVantageMatch => {
      return (
        typeof match === "object" &&
        match !== null &&
        typeof (match as AlphaVantageMatch)["1. symbol"] === "string" &&
        typeof (match as AlphaVantageMatch)["2. name"] === "string"
      );
    })
    .map((match) => ({
      symbol: String(match["1. symbol"]).toUpperCase(),
      name: String(match["2. name"] || match["1. symbol"]),
      exchange: match["7. region"] || undefined,
      type: match["3. type"] || undefined,
      region: match["4. region"] || undefined,
      currency: match["8. currency"] || undefined,
      source: "alpha_vantage",
    }));
}

function deduplicate(results: TickerResult[]): TickerResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = result.symbol?.toUpperCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getMockResults(query: string): TickerResult[] {
  const mockDatabase: TickerResult[] = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "GOOGL", name: "Alphabet Inc. Class A", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", region: "US", currency: "USD", type: "EQUITY", source: "mock" },
    { symbol: "VOLV-B.ST", name: "Volvo AB (publ) Class B", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "SAND.ST", name: "Sandvik AB", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "ERIC-B.ST", name: "Telefonaktiebolaget LM Ericsson Class B", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "HM-B.ST", name: "H & M Hennes & Mauritz AB Class B", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "INVEB.ST", name: "Investor AB Class B", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "SBBB-B.ST", name: "Samhällsbyggnadsbolaget i Norden AB B", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "SWED-A.ST", name: "Swedbank AB Class A", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "SEB-A.ST", name: "Skandinaviska Enskilda Banken AB Class A", exchange: "Stockholm", region: "SE", currency: "SEK", type: "EQUITY", source: "mock" },
    { symbol: "XACTOMX.ST", name: "XACT OMXS30 ETF", exchange: "Stockholm", region: "SE", currency: "SEK", type: "ETF", source: "mock" },
  ];

  if (!query) {
    return mockDatabase.slice(0, 10);
  }

  const lowerQuery = query.toLowerCase();

  return mockDatabase.filter((item) =>
    item.symbol.toLowerCase().includes(lowerQuery) ||
    item.name.toLowerCase().includes(lowerQuery)
  );
}
