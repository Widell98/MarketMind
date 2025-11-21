import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? `${supabaseUrl}/functions/v1`;
const functionAuthToken = supabaseServiceKey;

const DEFAULT_SUMMARY =
  "AI sammanfattar gårdagens marknadsrörelser och viktiga nyheter varje morgon vid 07:00. Håll dig uppdaterad med de viktigaste höjdpunkterna innan börsen öppnar.";

const TAVILY_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "tavily_search",
    description:
      "Sök efter senaste marknadsnyheterna (helst senaste 24 timmarna). Använd svenska sökfraser om möjligt.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Vad ska sökas på" },
        days: {
          type: "number",
          description: "Hur många dagar bakåt i tiden (1 = senaste 24 timmarna)",
        },
        maxResults: {
          type: "number",
          description: "Max antal resultat att hämta",
        },
      },
      required: ["query"],
    },
  },
};

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  snippet?: string;
  published_date?: string;
  score?: number;
};

type TavilySearchResponse = {
  query?: string;
  answer?: string;
  results?: TavilySearchResult[];
};

type TavilyFormattedContext = {
  formattedContext: string;
  references: Array<{
    headline: string;
    source?: string;
    url?: string;
    publishedAt?: string;
  }>;
};

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

function extractHostname(url?: string) {
  if (!url || typeof url !== "string") return undefined;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./i, "");
  } catch (_err) {
    return undefined;
  }
}

function filterRecentTavilyResults(results: TavilySearchResult[], maxAgeDays = 1.5) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  return results.filter((result) => {
    if (!result?.published_date) return true;
    const ts = Date.parse(result.published_date);
    return Number.isFinite(ts) ? ts >= cutoff : true;
  });
}

async function fetchTavilyNews(query: string, options?: { days?: number; maxResults?: number }) {
  if (!tavilyApiKey) {
    console.warn("TAVILY_API_KEY saknas, hoppar över realtidssökning.");
    return { formattedContext: "", references: [] } as TavilyFormattedContext;
  }

  const payload: Record<string, unknown> = {
    api_key: tavilyApiKey,
    query,
    search_depth: "advanced",
    include_answer: true,
    max_results: options?.maxResults ?? 6,
    days: options?.days ?? 1,
  };

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tavily API svarade med fel", errorText);
      return { formattedContext: "", references: [] } as TavilyFormattedContext;
    }

    const data = (await response.json()) as TavilySearchResponse;
    const results = Array.isArray(data?.results) ? data.results : [];
    const filtered = filterRecentTavilyResults(results, options?.days ?? 1.5).slice(0, 8);

    if (filtered.length === 0) {
      return { formattedContext: "", references: [] } as TavilyFormattedContext;
    }

    const references = filtered.map((result, index) => ({
      headline: result.title || `Nyhet ${index + 1}`,
      source: extractHostname(result.url),
      url: result.url,
      publishedAt: result.published_date,
    }));

    const formattedLines = filtered.map((result, index) => {
      const title = result.title || `Nyhet ${index + 1}`;
      const snippet = (result.snippet || result.content || "").trim();
      const safeSnippet = snippet.length > 280 ? `${snippet.slice(0, 280)}…` : snippet;
      const published = result.published_date ? ` (${result.published_date})` : "";
      const source = extractHostname(result.url) ? ` - Källa: ${extractHostname(result.url)}` : "";
      return `${index + 1}. ${title}${published}${safeSnippet ? ` – ${safeSnippet}` : ""}${source}`;
    });

    return {
      formattedContext: `Tavily-sökning: ${data?.query ?? query}\n${formattedLines.join("\n")}`,
      references,
    } as TavilyFormattedContext;
  } catch (error) {
    console.error("Kunde inte hämta Tavily-resultat", error);
    return { formattedContext: "", references: [] } as TavilyFormattedContext;
  }
}

async function invokeSupabaseFunction(name: string, body: unknown) {
  if (!functionAuthToken) {
    throw new Error(`Missing auth token for invoking ${name}`);
  }

  const response = await fetch(`${functionsUrl}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${functionAuthToken}`,
      apikey: functionAuthToken,
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

  if (!tavilyApiKey) {
    console.warn("TAVILY_API_KEY missing, returning fallback brief without realtidssökning");
    return buildFallbackBrief(context);
  }

  const defaultQuery = "senaste marknadsnyheter från natten och tidig morgon";

  const planningMessages = [
    {
      role: "system",
      content:
        "Du kan använda tavily_search-verktyget för att hämta nattens färska nyheter. Returnera bara JSON i sista svaret.",
    },
    {
      role: "user",
      content:
        "Planera en snabb sökning efter nattens viktigaste marknadsnyheter. Om inget bättre anges, använd standardfrågan.",
    },
  ];

  const planningResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 400,
      messages: planningMessages,
      tools: [TAVILY_SEARCH_TOOL],
      tool_choice: "auto",
    }),
  });

  if (!planningResponse.ok) {
    const errorPayload = await planningResponse.text();
    console.error("OpenAI planning error", errorPayload);
    return buildFallbackBrief(context);
  }

  const planningCompletion = await planningResponse.json();
  const planningMessage = planningCompletion?.choices?.[0]?.message;
  const toolCall = planningMessage?.tool_calls?.[0];

  let queryUsed = defaultQuery;
  let days = 1;
  let maxResults = 6;

  if (toolCall?.function?.arguments) {
    try {
      const parsedArgs = JSON.parse(toolCall.function.arguments);
      queryUsed = typeof parsedArgs?.query === "string" && parsedArgs.query.trim().length > 0 ? parsedArgs.query.trim() : defaultQuery;
      days = Number.isFinite(parsedArgs?.days) ? Math.max(1, Number(parsedArgs.days)) : 1;
      maxResults = Number.isFinite(parsedArgs?.maxResults) ? Math.max(3, Number(parsedArgs.maxResults)) : 6;
    } catch (err) {
      console.warn("Kunde inte tolka tavily_search-argument", err);
    }
  }

  const tavilyContext = await fetchTavilyNews(queryUsed, { days, maxResults });
  const tavilyToolMessage = toolCall
    ? {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ queryUsed, tavilyContext }),
      }
    : null;

  const prompt = buildPrompt(context, tavilyContext.formattedContext, queryUsed);
  const messages: any[] = [
    {
      role: "system",
      content:
        "Du är en erfaren nordisk finansredaktör. Använd Tavily-resultaten och kontexten nedan. RETURNERA ENDAST GILTIG JSON enligt formatet utan extra text.",
    },
    { role: "user", content: prompt },
  ];

  if (planningMessage) {
    messages.splice(1, 0, planningMessage);
  }

  if (tavilyToolMessage) {
    messages.splice(2, 0, tavilyToolMessage);
  }

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
      messages,
      tool_choice: "none",
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error("OpenAI error", errorPayload);
    return buildFallbackBrief(context, tavilyContext.references);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content ?? "";
  const repaired = jsonrepair(content);
  const parsed = JSON.parse(repaired);

  const normalized = normalizePayload(parsed, context, tavilyContext.references);
  context.tavily = tavilyContext;
  context.tavilyQuery = queryUsed;
  return normalized;
}

function buildPrompt(context: any, tavilyContext: string, tavilyQuery: string) {
  const newsBlock = context.news
    .map((item: any, index: number) => `${index + 1}. ${item.headline ?? ""} (${item.source ?? "Okänd"}) - ${item.summary ?? ""}`.trim())
    .join("\n");
  const indicesBlock = (context.market?.marketIndices ?? [])
    .map((index: any) => `${index.symbol} ${index.changePercent ?? 0}%`)
    .join(", ");
  const calendarBlock = context.calendar.map((event: any) => `${event.date ?? ""} ${event.title ?? ""}`.trim()).join("\n");
  const tavilyBlock = tavilyContext?.trim()?.length ? tavilyContext.trim() : "Inga Tavily-resultat";

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

TAVILY (${tavilyQuery}):
${tavilyBlock}

NYHETER (intern källa):
${newsBlock}

MARKNAD:
${indicesBlock}

KALENDER:
${calendarBlock}`;
}

function normalizePayload(
  candidate: any,
  context: any,
  tavilyReferences: TavilyFormattedContext["references"] = [],
) {
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

  const newsReferences = Array.isArray(candidate?.newsReferences)
    ? candidate.newsReferences
        .map((item: any) => ({
          headline: String(item?.headline ?? item?.title ?? ""),
          source: item?.source ? String(item.source) : extractHostname(item?.url),
          url: item?.url ? String(item.url) : undefined,
          publishedAt: item?.publishedAt ? String(item.publishedAt) : undefined,
        }))
        .filter((item: any) => item.headline || item.url)
    : tavilyReferences.length
    ? tavilyReferences
    : context.news.slice(0, 5).map((item: any) => ({
        headline: item.headline ?? "Nyhet",
        source: item.source ?? extractHostname(item.url),
        url: item.url,
        publishedAt: item.publishedAt,
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
    newsReferences,
  };
}

function buildFallbackBrief(
  context: any,
  tavilyReferences: TavilyFormattedContext["references"] = [],
) {
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

  const newsReferences = tavilyReferences.length
    ? tavilyReferences
    : highlights.map((item: any) => ({
        headline: item.title,
        source: item.source ?? extractHostname(item.url),
        url: item.url,
        publishedAt: item.publishedAt,
      }));

  return {
    summary: highlights.length
      ? `Marknaden fokuserar på ${highlights[0].title}. Dessutom bevakas ${highlights.slice(1).map((item: any) => item.title).join(", ")}.`
      : DEFAULT_SUMMARY,
    sentiment,
    highlights,
    focusAreas,
    eventsToWatch,
    newsReferences,
  };
}

async function persistBrief(payload: any, context: any) {
  if (!supabaseServiceKey) {
    const now = new Date().toISOString();
    console.warn("Persist skipped because SUPABASE_SERVICE_ROLE_KEY is missing");
    return {
      id: `temp-${now}`,
      generated_at: now,
      sentiment: payload.sentiment ?? "neutral",
      payload,
      source_snapshot: {
        news: context.news,
        market: context.market,
        calendar: context.calendar,
        tavily: context.tavily,
        tavilyQuery: context.tavilyQuery,
      },
      status: "preview",
    };
  }

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
          tavily: context.tavily,
          tavilyQuery: context.tavilyQuery,
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
