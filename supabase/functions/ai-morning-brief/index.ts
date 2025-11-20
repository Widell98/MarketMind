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

const DEFAULT_SUMMARY =
  "AI sammanfattar gårdagens marknadsrörelser och viktiga nyheter varje morgon vid 07:00. Håll dig uppdaterad med de viktigaste höjdpunkterna innan börsen öppnar.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const body = await safeParseJson(req);
    const forceRefresh = Boolean(body?.forceRefresh);
    const latestBrief = await getLatestBrief();

    if (latestBrief && !forceRefresh && isFresh(latestBrief.generated_at)) {
      return respondWithBrief(latestBrief, { fromCache: true });
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
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
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
    invokeSupabaseFunction("fetch-news-data", { type: "news" }),
    invokeSupabaseFunction("fetch-market-data", {}),
    invokeSupabaseFunction("fetch-news-data", { type: "calendar" }),
  ]);

  return {
    news: Array.isArray(news) ? news.slice(0, 8) : [],
    market,
    calendar: Array.isArray(calendar) ? calendar.slice(0, 8) : [],
  };
}

async function invokeSupabaseFunction(name: string, body: unknown) {
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

  return await response.json();
}

async function generateBriefPayload(context: any) {
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
        {
          role: "user",
          content: prompt,
        },
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

function buildPrompt(context: any) {
  const newsBlock = context.news
    .map((item: any, index: number) => `${index + 1}. ${item.headline ?? ""} (${item.source ?? "Okänd"}) - ${item.summary ?? ""}`.trim())
    .join("\n");
  const indicesBlock = (context.market?.marketIndices ?? [])
    .map((index: any) => `${index.symbol} ${index.changePercent ?? 0}%`)
    .join(", ");
  const calendarBlock = context.calendar.map((event: any) => `${event.date ?? ""} ${event.title ?? ""}`.trim()).join("\n");

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

function normalizePayload(candidate: any, context: any) {
  const highlights = Array.isArray(candidate?.highlights)
    ? candidate.highlights
        .map((item: any) => ({
          title: String(item?.title ?? item?.headline ?? ""),
          summary: String(item?.summary ?? item?.description ?? ""),
          source: item?.source ? String(item.source) : undefined,
          publishedAt: item?.publishedAt ? String(item.publishedAt) : undefined,
          url: item?.url ? String(item.url) : undefined,
        }))
        .filter((item: any) => item.title || item.summary)
    : [];

  const focusAreas = Array.isArray(candidate?.focusAreas)
    ? candidate.focusAreas.map((item: any) => String(item)).filter(Boolean)
    : [];

  const eventsToWatch = Array.isArray(candidate?.eventsToWatch)
    ? candidate.eventsToWatch.map((item: any) => String(item)).filter(Boolean)
    : context.calendar
        .slice(0, 3)
        .map((event: any) => `${event.date ?? ""} ${event.title ?? "Kommande händelse"}`.trim());

  const fallbackHighlights = context.news.slice(0, 3).map((item: any) => ({
    title: item.headline ?? "Nyhet",
    summary: item.summary ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
    url: item.url,
  }));

  return {
    summary:
      typeof candidate?.summary === "string" && candidate.summary.trim().length > 0
        ? candidate.summary.trim()
        : DEFAULT_SUMMARY,
    sentiment: candidate?.sentiment === "bullish" || candidate?.sentiment === "bearish" ? candidate.sentiment : "neutral",
    highlights: highlights.length ? highlights : fallbackHighlights,
    focusAreas: focusAreas.length
      ? focusAreas
      : Array.from(new Set(context.news.map((item: any) => item.category).filter(Boolean))).slice(0, 3),
    eventsToWatch,
  };
}

function buildFallbackBrief(context: any) {
  const highlights = context.news.slice(0, 3).map((item: any) => ({
    title: item.headline ?? "Nyhet",
    summary: item.summary ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
    url: item.url,
  }));

  const focusAreas = Array.from(new Set(context.news.map((item: any) => item.category).filter(Boolean))).slice(0, 3);
  const eventsToWatch = context.calendar
    .slice(0, 3)
    .map((event: any) => `${event.date ?? ""} ${event.title ?? "Kommande händelse"}`.trim());
  const avgChange = (context.market?.marketIndices ?? [])
    .map((idx: any) => idx.changePercent ?? 0)
    .reduce((sum: number, value: number, _: number, arr: number[]) => sum + value / Math.max(arr.length, 1), 0);

  const sentiment = avgChange > 0.2 ? "bullish" : avgChange < -0.2 ? "bearish" : "neutral";

  return {
    summary: highlights.length
      ? `Marknaden fokuserar på ${highlights[0].title}. Dessutom bevakas ${highlights.slice(1).map((item: any) => item.title).join(", ")}.`
      : DEFAULT_SUMMARY,
    sentiment,
    highlights,
    focusAreas,
    eventsToWatch,
  };
}

async function persistBrief(payload: any, context: any) {
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
      {
        onConflict: "hash",
      },
    )
    .select("id, generated_at, sentiment, payload, source_snapshot, status")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to persist morning brief: ${error?.message}`);
  }

  return data;
}

async function hashPayload(payload: any, news: any[]) {
  const encoder = new TextEncoder();
  const source = JSON.stringify(payload) + JSON.stringify(news.map((item: any) => item.id ?? item.headline ?? ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(source));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function respondWithBrief(record: any, meta: any) {
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
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}
