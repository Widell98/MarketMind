import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? `${supabaseUrl}/functions/v1`;

interface RequestContext {
  userId: string | null;
  isAdmin: boolean;
}

interface NewsItem {
  id?: string;
  headline?: string;
  summary?: string;
  category?: string;
  source?: string;
  publishedAt?: string;
  url?: string;
}

interface CalendarEvent {
  id?: string;
  date?: string;
  time?: string;
  title?: string;
  description?: string;
  importance?: string;
  category?: string;
  company?: string;
  dayOfWeek?: string;
}

interface MarketSnapshot {
  marketIndices?: Array<{ symbol: string; name?: string; price?: number; changePercent?: number }>;
  topStocks?: Array<{ symbol: string; name?: string; changePercent?: number }>;
  bottomStocks?: Array<{ symbol: string; name?: string; changePercent?: number }>;
  lastUpdated?: string;
}

interface MorningBriefPayload {
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  highlights: Array<{
    title: string;
    summary: string;
    source?: string;
    publishedAt?: string;
    url?: string;
  }>;
  focusAreas: string[];
  eventsToWatch: string[];
}

const DEFAULT_SUMMARY =
  "AI sammanfattar gårdagens marknadsrörelser och viktiga nyheter varje morgon vid 07:00. Håll dig uppdaterad med de viktigaste höjdpunkterna innan börsen öppnar.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await safeParseJson(req);
    const forceRefresh = Boolean(body?.forceRefresh);
    const requester = await getRequestContext(req);

    if (forceRefresh && !requester.isAdmin) {
      return new Response(
        JSON.stringify({ error: "Endast administratörer kan generera en ny morgonrapport" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const latestBrief = await getLatestBrief();
    const needsGeneration = !latestBrief || !isFresh(latestBrief.generated_at) || forceRefresh;

    if (!needsGeneration && latestBrief) {
      return respondWithBrief(latestBrief, { fromCache: true });
    }

    if (needsGeneration && !requester.isAdmin) {
      if (latestBrief) {
        return respondWithBrief(latestBrief, {
          fromCache: true,
          status: "stale-admin-refresh-required",
          error: "Morgonrapporten uppdateras när en administratör triggar en ny körning.",
        });
      }

      return new Response(
        JSON.stringify({ error: "Ingen morgonrapport har genererats ännu. Kontakta en administratör." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contextSnapshot = await buildContextSnapshot();
    const payload = await generateBriefPayload(contextSnapshot);
    const stored = await persistBrief(payload, contextSnapshot);

    return respondWithBrief(stored, { fromCache: false });
  } catch (error) {
    console.error("ai-morning-brief failed", error);
    const fallback = await getLatestBrief();
    if (fallback) {
      return respondWithBrief(fallback, {
        fromCache: true,
        status: "stale",
        error: error instanceof Error ? error.message : "Unexpected error",
      });
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function safeParseJson(req: Request) {
  try {
    return await req.json();
  } catch (_err) {
    return {};
  }
}

async function getRequestContext(req: Request): Promise<RequestContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { userId: null, isAdmin: false };
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
          apikey: supabaseServiceKey,
        },
      },
    });

    const {
      data: { user },
      error,
    } = await authClient.auth.getUser();

    if (error || !user) {
      return { userId: null, isAdmin: false };
    }

    const { data: hasAdminRole } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    return {
      userId: user.id,
      isAdmin: Boolean(hasAdminRole),
    };
  } catch (err) {
    console.error("Failed to validate requester context", err);
    return { userId: null, isAdmin: false };
  }
}

async function getLatestBrief() {
  const { data } = await supabase
    .from("morning_briefs")
    .select("id, generated_at, sentiment, payload, source_snapshot, status")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

function isFresh(isoString: string) {
  const generated = new Date(isoString).getTime();
  const now = Date.now();
  const hoursDiff = (now - generated) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

async function buildContextSnapshot() {
  const [news, market, calendar] = await Promise.all([
    invokeSupabaseFunction<NewsItem[]>("fetch-news-data", { type: "news" }),
    invokeSupabaseFunction<MarketSnapshot>("fetch-market-data", {}),
    invokeSupabaseFunction<CalendarEvent[]>("fetch-news-data", { type: "calendar" }),
  ]);

  return {
    news: Array.isArray(news) ? news.slice(0, 8) : [],
    market,
    calendar: Array.isArray(calendar) ? calendar.slice(0, 8) : [],
  };
}

async function invokeSupabaseFunction<T>(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${functionsUrl}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to invoke ${name}: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

async function generateBriefPayload(context: {
  news: NewsItem[];
  market: MarketSnapshot | null;
  calendar: CalendarEvent[];
}): Promise<MorningBriefPayload> {
  if (!openAIApiKey) {
    console.warn("OPENAI_API_KEY missing, returning fallback morning brief");
    return buildFallbackBrief(context);
  }

  const prompt = buildPrompt(context);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "Du är en erfaren nordisk finansredaktör. Leverera morgonbrev på svenska baserat på senaste nyhetsurvalet och marknadsdata. Hitta inte på fakta.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error("OpenAI error", errorPayload);
    return buildFallbackBrief(context);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content ?? "";
  const repaired = jsonrepair(content);
  const parsed = JSON.parse(repaired);
  return normalizePayload(parsed, context);
}

function buildPrompt(context: { news: NewsItem[]; market: MarketSnapshot | null; calendar: CalendarEvent[] }) {
  const newsBlock = context.news
    .map((item, index) =>
      `${index + 1}. ${item.headline ?? ""} (${item.source ?? "Okänd"}) - ${item.summary ?? ""}`.trim(),
    )
    .join("\n");
  const indicesBlock = (context.market?.marketIndices ?? [])
    .map((index) => `${index.symbol} ${index.changePercent ?? 0}%`)
    .join(", ");
  const calendarBlock = context.calendar
    .map((event) => `${event.date ?? ""} ${event.title ?? ""}`.trim())
    .join("\n");

  return `Skapa en kort morgonrapport. RETURNERA ENDAST GILTIG JSON enligt:
{
  "summary": "3 meningar som beskriver dagens marknadsläge på svenska.",
  "sentiment": "bullish" | "bearish" | "neutral",
  "highlights": [
    { "title": "Rubrik", "summary": "Kort sammanfattning", "source": "Källa", "publishedAt": "ISO", "url": "" }
  ],
  "focusAreas": ["tema"],
  "eventsToWatch": ["punkt"],
  "newsReferences": [
    { "headline": "", "source": "", "url": "", "publishedAt": "" }
  ]
}

NYHETER:
${newsBlock}

MARKNAD:
${indicesBlock}

KALENDER:
${calendarBlock}`;
}

function normalizePayload(candidate: Record<string, unknown>, context: { news: NewsItem[]; calendar: CalendarEvent[] }): MorningBriefPayload {
  const highlights = Array.isArray(candidate?.highlights)
    ? candidate.highlights
        .map((item) => ({
          title: String(item?.title ?? item?.headline ?? ""),
          summary: String(item?.summary ?? item?.description ?? ""),
          source: item?.source ? String(item.source) : undefined,
          publishedAt: item?.publishedAt ? String(item.publishedAt) : undefined,
          url: item?.url ? String(item.url) : undefined,
        }))
        .filter((item) => item.title || item.summary)
    : [];

  const focusAreas = Array.isArray(candidate?.focusAreas)
    ? candidate.focusAreas.map((item) => String(item)).filter(Boolean)
    : [];

  const eventsToWatch = Array.isArray(candidate?.eventsToWatch)
    ? candidate.eventsToWatch.map((item) => String(item)).filter(Boolean)
    : context.calendar.slice(0, 3).map((event) => `${event.date ?? ""} ${event.title ?? "Kommande händelse"}`.trim());

  const fallbackHighlights = context.news.slice(0, 3).map((item) => ({
    title: item.headline ?? "Nyhet",
    summary: item.summary ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
    url: item.url,
  }));

  return {
    summary: typeof candidate?.summary === "string" && candidate.summary.trim().length > 0
      ? candidate.summary.trim()
      : DEFAULT_SUMMARY,
    sentiment: candidate?.sentiment === "bullish" || candidate?.sentiment === "bearish" ? candidate.sentiment : "neutral",
    highlights: highlights.length ? highlights : fallbackHighlights,
    focusAreas: focusAreas.length
      ? focusAreas
      : Array.from(new Set(context.news.map((item) => item.category).filter(Boolean))).slice(0, 3) as string[],
    eventsToWatch,
  };
}

function buildFallbackBrief(context: { news: NewsItem[]; calendar: CalendarEvent[]; market: MarketSnapshot | null }): MorningBriefPayload {
  const highlights = context.news.slice(0, 3).map((item) => ({
    title: item.headline ?? "Nyhet",
    summary: item.summary ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
    url: item.url,
  }));

  const focusAreas = Array.from(new Set(context.news.map((item) => item.category).filter(Boolean))).slice(0, 3) as string[];

  const eventsToWatch = context.calendar.slice(0, 3).map((event) => `${event.date ?? ""} ${event.title ?? "Kommande händelse"}`.trim());

  const avgChange = (context.market?.marketIndices ?? [])
    .map((idx) => idx.changePercent ?? 0)
    .reduce((sum, value, _, arr) => sum + value / Math.max(arr.length, 1), 0);

  const sentiment = avgChange > 0.2 ? "bullish" : avgChange < -0.2 ? "bearish" : "neutral";

  return {
    summary: highlights.length
      ? `Marknaden fokuserar på ${highlights[0].title}. Dessutom bevakas ${highlights
          .slice(1)
          .map((item) => item.title)
          .join(", ")}.`
      : DEFAULT_SUMMARY,
    sentiment,
    highlights,
    focusAreas,
    eventsToWatch,
  };
}

async function persistBrief(payload: MorningBriefPayload, context: {
  news: NewsItem[];
  market: MarketSnapshot | null;
  calendar: CalendarEvent[];
}) {
  const hash = await hashPayload(payload, context.news);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("morning_briefs")
    .upsert(
      {
        hash,
        payload,
        source_snapshot: {
          news: context.news,
          market: context.market,
          calendar: context.calendar,
        },
        generated_at: now,
        sentiment: payload.sentiment,
        status: "ready",
      },
      { onConflict: "hash" },
    )
    .select("id, generated_at, sentiment, payload, source_snapshot, status")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to persist morning brief: ${error?.message}`);
  }

  return data;
}

async function hashPayload(payload: MorningBriefPayload, news: NewsItem[]) {
  const encoder = new TextEncoder();
  const source = JSON.stringify(payload) + JSON.stringify(news.map((item) => item.id ?? item.headline ?? ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(source));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function respondWithBrief(
  record: {
    id: string;
    generated_at: string;
    sentiment: string | null;
    payload: MorningBriefPayload;
    source_snapshot: Record<string, unknown>;
    status: string;
  },
  meta: { fromCache: boolean; status?: string; error?: string },
) {
  return new Response(
    JSON.stringify({
      brief: {
        id: record.id,
        generatedAt: record.generated_at,
        sentiment: record.sentiment ?? "neutral",
        ...record.payload,
      },
      status: record.status,
      fromCache: meta.fromCache,
      meta,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
