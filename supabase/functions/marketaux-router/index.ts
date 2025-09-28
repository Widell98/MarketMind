import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type MarketauxIntent = "news" | "report";

type MarketauxRequestPayload = {
  query?: string;
  symbol?: string;
  intent?: MarketauxIntent;
  limit?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const marketauxApiKey = Deno.env.get("MARKETAUX_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!marketauxApiKey) {
    return createErrorResponse("MARKETAUX_API_KEY saknas i miljövariablerna", 500);
  }

  try {
    const { query, symbol, intent = "news", limit = 3 }: MarketauxRequestPayload = await req.json();

    if (!query && !symbol) {
      return createErrorResponse("Ange minst en fråga eller ticker-symbol för att hämta MarketAux-data", 400);
    }

    const upperSymbol = symbol?.trim().toUpperCase();
    const cacheKey = await createCacheKey(intent, upperSymbol, query);
    const cachedResponse = await readFromCache(cacheKey);

    if (cachedResponse) {
      console.log(`[marketaux-router] returning cached payload for ${cacheKey}`);
      return createSuccessResponse(cachedResponse);
    }

    const payload = await fetchAndTransformFromMarketaux({
      intent,
      symbol: upperSymbol,
      query,
      limit,
    });

    await writeToCache(cacheKey, payload, intent);

    return createSuccessResponse(payload);
  } catch (error) {
    console.error("[marketaux-router] Unexpected error", error);
    return createErrorResponse(error?.message ?? "Okänt fel vid MarketAux-anrop", 500);
  }
});

type MarketauxResponsePayload = {
  source: "marketaux";
  intent: MarketauxIntent;
  symbol?: string | null;
  query?: string;
  fetchedAt: string;
  summary: string[];
  items: NormalizedItem[];
  raw: unknown;
};

async function createCacheKey(intent: MarketauxIntent, symbol?: string | null, query?: string) {
  const encoder = new TextEncoder();
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${intent}|${symbol ?? ""}|${normalizedQuery}`),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer)).slice(0, 8);
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${intent}:${symbol ?? "general"}:${hash}`;
}

async function readFromCache(cacheKey: string) {
  const { data, error } = await supabase
    .from("marketaux_cache")
    .select("data, expires_at")
    .eq("cache_key", cacheKey)
    .single();

  if (error) {
    console.warn(`[marketaux-router] Cache lookup failed for ${cacheKey}`, error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const { data: payload, expires_at: expiresAt } = data as { data: MarketauxResponsePayload; expires_at: string };

  if (expiresAt && new Date(expiresAt) > new Date()) {
    return payload;
  }

  console.log(`[marketaux-router] Cache expired for ${cacheKey}`);
  return null;
}

async function writeToCache(cacheKey: string, payload: MarketauxResponsePayload, intent: MarketauxIntent) {
  const ttlMs = intent === "report" ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  const { error } = await supabase
    .from("marketaux_cache")
    .upsert({
      cache_key: cacheKey,
      data: payload,
      expires_at: expiresAt,
    });

  if (error) {
    console.warn(`[marketaux-router] Failed to write cache for ${cacheKey}`, error.message);
  }
}

type FetchParams = {
  intent: MarketauxIntent;
  symbol?: string | null;
  query?: string;
  limit: number;
};

async function fetchAndTransformFromMarketaux({ intent, symbol, query, limit }: FetchParams): Promise<MarketauxResponsePayload> {
  const endpoint = buildEndpoint(intent, symbol, query, limit);
  const response = await fetch(endpoint);

  if (!response.ok) {
    const errorBody = await safeJson(response);
    console.error("[marketaux-router] MarketAux error", { status: response.status, errorBody });
    throw new Error(`MarketAux svarade med status ${response.status}`);
  }

  const json = await response.json();
  const normalized = intent === "report"
    ? normalizeReports(json, limit)
    : normalizeNews(json, limit);

  const summary = buildSummary(normalized, intent);

  return {
    source: "marketaux",
    intent,
    symbol: symbol ?? null,
    query,
    fetchedAt: new Date().toISOString(),
    summary,
    items: normalized,
    raw: json,
  };
}

function buildEndpoint(intent: MarketauxIntent, symbol?: string | null, query?: string, limit = 3) {
  const params = new URLSearchParams({
    api_token: marketauxApiKey!,
  });

  const normalizedLimit = Math.max(1, Math.min(limit, 10));
  params.set("limit", String(normalizedLimit));

  if (intent === "report") {
    const baseUrl = "https://api.marketaux.com/v1/earnings/announcements";

    if (symbol) {
      params.set("symbols", symbol);
    } else if (query) {
      params.set("search", query);
    }

    params.set("language", "en");

    return `${baseUrl}?${params.toString()}`;
  }

  const baseUrl = "https://api.marketaux.com/v1/news/all";

  params.set("language", "en");
  params.set("filter_entities", "true");

  if (symbol) {
    params.set("symbols", symbol);
  } else if (query) {
    params.set("query", query);
  }

  return `${baseUrl}?${params.toString()}`;
}

type MarketauxNewsItem = {
  uuid?: string;
  id?: string;
  title?: string;
  description?: string;
  snippet?: string;
  summary?: string;
  url?: string;
  published_at?: string;
  source?: string;
  author?: string;
  image_url?: string;
  entities?: Array<{
    name?: string;
    symbol?: string;
    type?: string;
  }>;
  relevance_score?: number;
};

type MarketauxReportItem = {
  id?: string | number;
  symbol?: string;
  company_name?: string;
  fiscal_period?: string;
  fiscal_year?: string | number;
  eps_actual?: number;
  eps_estimate?: number;
  revenue_actual?: number;
  revenue_estimate?: number;
  announcement_date?: string;
  report_date?: string;
  updated_at?: string;
  currency?: string;
  url?: string;
};

type NormalizedItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  source?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeNews(json: unknown, limit: number): NormalizedItem[] {
  const articles = Array.isArray((json as { data?: MarketauxNewsItem[] })?.data)
    ? ((json as { data?: MarketauxNewsItem[] }).data as MarketauxNewsItem[])
    : [];

  return articles.slice(0, limit).map((item) => ({
    id: item.uuid ?? item.id ?? item.url ?? crypto.randomUUID(),
    title: item.title ?? "Okänd titel",
    subtitle: item.description ?? item.summary ?? item.snippet ?? null,
    url: item.url ?? null,
    publishedAt: item.published_at ?? null,
    source: item.source ?? item.author ?? null,
    imageUrl: item.image_url ?? null,
    metadata: {
      entities: item.entities?.map((entity) => ({
        name: entity.name,
        symbol: entity.symbol,
        type: entity.type,
      })),
      relevanceScore: item.relevance_score ?? null,
    },
  }));
}

function normalizeReports(json: unknown, limit: number): NormalizedItem[] {
  const reports = Array.isArray((json as { data?: MarketauxReportItem[] })?.data)
    ? ((json as { data?: MarketauxReportItem[] }).data as MarketauxReportItem[])
    : [];

  return reports.slice(0, limit).map((item) => ({
    id: String(item.id ?? `${item.symbol}-${item.announcement_date ?? crypto.randomUUID()}`),
    title: `${item.company_name ?? item.symbol ?? "Okänt bolag"} – ${item.fiscal_period ?? "Senaste rapport"}`,
    subtitle: buildReportSubtitle(item),
    url: item.url ?? null,
    publishedAt: item.announcement_date ?? item.report_date ?? item.updated_at ?? null,
    source: "MarketAux Earnings",
    metadata: {
      symbol: item.symbol,
      companyName: item.company_name,
      fiscalPeriod: item.fiscal_period,
      fiscalYear: item.fiscal_year,
      epsActual: item.eps_actual,
      epsEstimate: item.eps_estimate,
      revenueActual: item.revenue_actual,
      revenueEstimate: item.revenue_estimate,
      currency: item.currency,
    },
  }));
}

function buildSummary(items: NormalizedItem[], intent: MarketauxIntent): string[] {
  if (!items.length) {
    return ["Ingen relevant MarketAux-data hittades för frågan just nu."];
  }

  return items.map((item) => {
    const publishedText = item.publishedAt ? formatRelativeTime(item.publishedAt) : "okänt datum";
    const sourceText = item.source ? ` via ${item.source}` : "";

    if (intent === "report") {
      return `${item.title}${sourceText} (${publishedText}). ${item.subtitle ?? ""}`.trim();
    }

    return `${item.title}${sourceText} (${publishedText}).`;
  });
}

function buildReportSubtitle(report: MarketauxReportItem): string {
  const eps = buildMetricComparison("EPS", report.eps_actual, report.eps_estimate);
  const revenue = buildMetricComparison("Intäkter", report.revenue_actual, report.revenue_estimate, report.currency);
  const parts = [eps, revenue].filter(Boolean);
  return parts.length ? parts.join(" • ") : "";
}

function buildMetricComparison(
  label: string,
  actual?: number,
  estimate?: number,
  currency?: string,
) {
  if (actual == null && estimate == null) {
    return "";
  }

  const actualText = actual != null ? formatNumber(actual, currency) : "–";
  const estimateText = estimate != null ? formatNumber(estimate, currency) : "–";

  return `${label}: ${actualText} (est ${estimateText})`;
}

function formatNumber(value: number, currency?: string) {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  };

  if (currency) {
    options.style = "currency";
    options.currency = currency;
  } else {
    options.style = "decimal";
  }

  const formatter = new Intl.NumberFormat("sv-SE", options);

  return formatter.format(value);
}

function formatRelativeTime(isoDate: string) {
  const published = new Date(isoDate);
  if (Number.isNaN(published.getTime())) {
    return "okänt datum";
  }

  const diffMs = Date.now() - published.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `${diffMinutes} min sedan`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h sedan`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} d sedan`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} mån sedan`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} år sedan`;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

function createSuccessResponse(payload: MarketauxResponsePayload) {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function createErrorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
