import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const POLYMARKET_API_URL = Deno.env.get("POLYMARKET_API_URL") ?? "https://clob.polymarket.com/markets?limit=200";
const POLYMARKET_API_KEY = Deno.env.get("POLYMARKET_API_KEY");
const CACHE_TTL_MS = Number(Deno.env.get("POLYMARKET_CACHE_TTL_MS") ?? "120000");
const RATE_LIMIT_MS = Number(Deno.env.get("POLYMARKET_RATE_LIMIT_MS") ?? "1000");
const DEFAULT_LIMIT = 50;

interface PolymarketOutcome {
  id: string;
  name: string;
  price: number;
  probability: number;
  volume24h?: number;
}

interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  categories: string[];
  liquidity: number;
  volume24h: number;
  closeTime?: string;
  createdTime?: string;
  outcomes: PolymarketOutcome[];
  url?: string;
  isResolved?: boolean;
}

interface PolymarketMarketFilters {
  categories?: string[];
  minLiquidity?: number;
  minVolume24h?: number;
  closingAfter?: string;
  closingBefore?: string;
  limit?: number;
  marketIds?: string[];
}

type CachedResponse = {
  data: PolymarketMarket[];
  expiresAt: number;
  fetchedAt: number;
};

let cachedResponse: CachedResponse | null = null;
let inFlightFetch: Promise<PolymarketMarket[]> | null = null;
let lastFetchTimestamp = 0;

serve(async (req) => {
  const requestStartedAt = Date.now();

  const respondWithMetrics = (
    markets: PolymarketMarket[],
    fetchedAt: number,
    cacheHit: boolean,
    status = 200,
    warning?: string,
  ) => {
    const durationMs = Date.now() - requestStartedAt;
    console.info('[polymarket-function]', {
      event: 'response',
      status,
      cacheHit,
      markets: markets.length,
      durationMs,
    });

    return respond(markets, fetchedAt, cacheHit, status, warning);
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let filters: PolymarketMarketFilters = {};

  if (req.method === "POST") {
    try {
      const body = await req.json();
      filters = normalizeFilters(body?.filters ?? body ?? {});
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const now = Date.now();
  const cacheValid = cachedResponse && cachedResponse.expiresAt > now;

  if (cacheValid) {
    const filtered = applyFilters(cachedResponse!.data, filters);
    return respondWithMetrics(filtered, cachedResponse!.fetchedAt, true);
  }

  if (inFlightFetch) {
    const markets = await inFlightFetch;
    const filtered = applyFilters(markets, filters);
    const fetchedAt = cachedResponse?.fetchedAt ?? now;
    return respondWithMetrics(filtered, fetchedAt, true);
  }

  if (cachedResponse && now - lastFetchTimestamp < RATE_LIMIT_MS) {
    const filtered = applyFilters(cachedResponse.data, filters);
    return respondWithMetrics(filtered, cachedResponse.fetchedAt, true);
  }

  try {
    inFlightFetch = fetchPolymarketMarkets();
    const markets = await inFlightFetch;
    cachedResponse = {
      data: markets,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    lastFetchTimestamp = cachedResponse.fetchedAt;

    const filtered = applyFilters(markets, filters);
    return respondWithMetrics(filtered, cachedResponse.fetchedAt, false);
  } catch (error) {
    console.error("Failed to fetch Polymarket markets:", error);

    if (cachedResponse) {
      const filtered = applyFilters(cachedResponse.data, filters);
      return respondWithMetrics(
        filtered,
        cachedResponse.fetchedAt,
        true,
        502,
        "Upstream fetch failed; returning cached data.",
      );
    }

    console.error('[polymarket-function]', {
      event: 'fatal-error',
      durationMs: Date.now() - requestStartedAt,
    });

    return new Response(
      JSON.stringify({ error: "Unable to fetch Polymarket markets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } finally {
    inFlightFetch = null;
  }
});

async function fetchPolymarketMarkets(): Promise<PolymarketMarket[]> {
  const upstreamStartedAt = Date.now();
  const response = await fetch(POLYMARKET_API_URL, {
    headers: POLYMARKET_API_KEY ? { Authorization: `Bearer ${POLYMARKET_API_KEY}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    console.error('[polymarket-function] upstream-error', { status: response.status, message });
    throw new Error(`Polymarket API responded with ${response.status}: ${message}`);
  }

  const payload = await response.json();
  console.info('[polymarket-function]', {
    event: 'upstream-fetch',
    status: response.status,
    durationMs: Date.now() - upstreamStartedAt,
  });
  const rawMarkets: unknown[] = Array.isArray(payload?.markets)
    ? payload.markets
    : Array.isArray(payload)
      ? payload
      : [];

  return rawMarkets.map(normalizeMarket).filter((market) => Boolean(market.id));
}

function applyFilters(markets: PolymarketMarket[], filters: PolymarketMarketFilters): PolymarketMarket[] {
  let filtered = [...markets];

  if (filters.marketIds && filters.marketIds.length > 0) {
    const idSet = new Set(filters.marketIds);
    filtered = filtered.filter((market) => idSet.has(market.id));
  }

  if (filters.categories && filters.categories.length > 0) {
    const categorySet = new Set(filters.categories.map((category) => category.toLowerCase()));
    filtered = filtered.filter((market) =>
      market.categories.some((category) => categorySet.has(category.toLowerCase()))
    );
  }

  if (typeof filters.minLiquidity === "number") {
    filtered = filtered.filter((market) => market.liquidity >= filters.minLiquidity!);
  }

  if (typeof filters.minVolume24h === "number") {
    filtered = filtered.filter((market) => market.volume24h >= filters.minVolume24h!);
  }

  if (filters.closingAfter) {
    const closingAfter = Date.parse(filters.closingAfter);
    if (!Number.isNaN(closingAfter)) {
      filtered = filtered.filter((market) => {
        if (!market.closeTime) return false;
        const closeDate = Date.parse(market.closeTime);
        return !Number.isNaN(closeDate) && closeDate >= closingAfter;
      });
    }
  }

  if (filters.closingBefore) {
    const closingBefore = Date.parse(filters.closingBefore);
    if (!Number.isNaN(closingBefore)) {
      filtered = filtered.filter((market) => {
        if (!market.closeTime) return false;
        const closeDate = Date.parse(market.closeTime);
        return !Number.isNaN(closeDate) && closeDate <= closingBefore;
      });
    }
  }

  const limit = filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_LIMIT;
  return filtered.slice(0, limit);
}

function normalizeFilters(input: unknown): PolymarketMarketFilters {
  const filters: PolymarketMarketFilters = {};

  if (input && typeof input === "object") {
    const maybeFilters = input as Record<string, unknown>;

    if (Array.isArray(maybeFilters.categories)) {
      filters.categories = maybeFilters.categories
        .map((category) => (typeof category === "string" ? category : null))
        .filter(Boolean) as string[];
    }

    if (typeof maybeFilters.minLiquidity === "number") {
      filters.minLiquidity = maybeFilters.minLiquidity;
    }

    if (typeof maybeFilters.minVolume24h === "number") {
      filters.minVolume24h = maybeFilters.minVolume24h;
    }

    if (typeof maybeFilters.closingAfter === "string") {
      filters.closingAfter = maybeFilters.closingAfter;
    }

    if (typeof maybeFilters.closingBefore === "string") {
      filters.closingBefore = maybeFilters.closingBefore;
    }

    if (typeof maybeFilters.limit === "number") {
      filters.limit = maybeFilters.limit;
    }

    if (Array.isArray(maybeFilters.marketIds)) {
      filters.marketIds = maybeFilters.marketIds
        .map((value) => (typeof value === "string" ? value : null))
        .filter(Boolean) as string[];
    }
  }

  return filters;
}

function normalizeMarket(raw: unknown): PolymarketMarket {
  const market = (raw ?? {}) as Record<string, unknown>;
  const rawOutcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
  const rawOutcomePrices = Array.isArray((market as Record<string, unknown>).outcomePrices)
    ? (market as Record<string, unknown>).outcomePrices
    : [];

  const tokens = Array.isArray((market as Record<string, unknown>).tokens)
    ? ((market as Record<string, unknown>).tokens as Array<Record<string, unknown>>)
    : [];

  const outcomes: PolymarketOutcome[] = rawOutcomes.map((outcome, index) => {
    const outcomeName = typeof outcome === "string"
      ? outcome
      : typeof outcome === "object" && outcome !== null && "name" in outcome
        ? String((outcome as Record<string, unknown>).name)
        : `Outcome ${index + 1}`;

    const tokenPrice = tokens[index]?.price;
    const mappedPrice = typeof tokenPrice === "string" || typeof tokenPrice === "number"
      ? Number(tokenPrice)
      : undefined;

    const priceFromList = typeof rawOutcomePrices[index] === "string" || typeof rawOutcomePrices[index] === "number"
      ? Number(rawOutcomePrices[index])
      : undefined;

    const price = Number.isFinite(mappedPrice) ? Number(mappedPrice) : Number(priceFromList ?? 0);

    const volume = tokens[index]?.volume;
    const volumeAsNumber = typeof volume === "string" || typeof volume === "number" ? Number(volume) : undefined;

    return {
      id: `${market.id ?? "market"}-${index}`,
      name: outcomeName,
      price: Number.isFinite(price) ? price : 0,
      probability: Number.isFinite(price) ? price : 0,
      volume24h: Number.isFinite(volumeAsNumber ?? NaN) ? volumeAsNumber : undefined,
    };
  });

  const categories = Array.isArray(market.categories)
    ? (market.categories as unknown[]).map((category) => String(category))
    : Array.isArray(market.tags)
      ? (market.tags as unknown[]).map((tag) => String(tag))
      : [];

  const liquidity = toNumber(market.liquidity ?? market.liquidityNum ?? market.liquidityUsd);
  const volume24h = toNumber(market.volume24h ?? market.volume ?? market.volumeUsd24h);

  const closeTime = typeof market.endDate === "string"
    ? market.endDate
    : typeof market.closeTime === "string"
      ? market.closeTime
      : undefined;

  const createdTime = typeof market.createdTime === "string"
    ? market.createdTime
    : typeof market.createdAt === "string"
      ? market.createdAt
      : undefined;

  return {
    id: String(market.id ?? market.slug ?? crypto.randomUUID()),
    question: typeof market.question === "string"
      ? market.question
      : typeof market.title === "string"
        ? market.title
        : "Unknown market",
    description: typeof market.description === "string" ? market.description : undefined,
    categories,
    liquidity: Number.isFinite(liquidity) ? liquidity : 0,
    volume24h: Number.isFinite(volume24h) ? volume24h : 0,
    closeTime,
    createdTime,
    outcomes,
    url: typeof market.url === "string"
      ? market.url
      : typeof market.clobUrl === "string"
        ? market.clobUrl
        : undefined,
    isResolved: typeof market.resolved === "boolean"
      ? market.resolved
      : typeof market.closed === "boolean"
        ? market.closed
        : undefined,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function respond(
  markets: PolymarketMarket[],
  fetchedAt: number,
  cacheHit: boolean,
  status = 200,
  warning?: string,
) {
  const body = {
    markets,
    fetchedAt: new Date(fetchedAt).toISOString(),
    cacheHit,
    warning,
  };

  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
