import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = "gpt-5.1";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabaseClient = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
const textEncoder = new TextEncoder();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await readJsonBody(req);
    const type = typeof body?.type === "string" ? body.type : "news";

    switch (type) {
      case "momentum": {
        const items = await generateMarketMomentum();
        return jsonResponse(items);
      }
      case "news":
      default: {
        const forceRefresh = body?.forceRefresh === true;
        const shouldPersist = body?.persist !== false;
        const latestStored = await getLatestStoredBrief();
        const now = new Date();

        if (!forceRefresh && latestStored && isSameUtcDay(new Date(latestStored.morningBrief.generatedAt), now)) {
          return jsonResponse(latestStored);
        }

        const generated = await generateMorningBrief();

        if (shouldPersist) {
          await storeMorningBrief(generated);
        }

        return jsonResponse({ morningBrief: generated.morningBrief, news: generated.news });
      }
    }
  } catch (error) {
    console.error("fetch-news-data error", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return jsonResponse({ error: message }, 500);
  }
});

async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    if (req.body === null) {
      return null;
    }
    return await req.json();
  } catch (_error) {
    return null;
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<string> {
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_output_tokens: maxTokens,
      reasoning: { effort: "medium" },
      text: { verbosity: "medium" },
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = extractText(data);
  if (!text || text.trim().length === 0) {
    console.error("OpenAI raw response", data);
    throw new Error("OpenAI response did not contain text output");
  }
  return text;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (_error) {
    return "<failed to read body>";
  }
}

type MorningSection = { title: string; body: string };
type MorningBrief = {
  id: string;
  headline: string;
  overview: string;
  keyHighlights: string[];
  focusToday: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  generatedAt: string;
  sections: MorningSection[];
};

type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
};

type GeneratedMorningBrief = {
  morningBrief: MorningBrief;
  news: NewsItem[];
  rawPayload: Record<string, unknown>;
  digestHash: string;
};

async function generateMorningBrief(): Promise<GeneratedMorningBrief> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const systemPrompt =
    "Du är en svensk finansredaktör som skriver morgonbrev och strukturerade nyhetssammanfattningar. Du svarar alltid med giltig JSON.";

  const userPrompt = `Skriv ett kort AI-genererat morgonbrev för datumet ${today.toLocaleDateString("sv-SE")}.
Inkludera både sammanfattning och 6–8 nyhetsrubriker relevanta för svenska investerare.
Fokusera på händelser och sentiment från ${yesterday.toLocaleDateString("sv-SE")} (gårdagen). Ange tider och datum i svensk tidszon där det är relevant.

FORMAT (måste följas exakt):
{
  "morning_brief": {
    "headline": "string",
    "overview": "2-3 meningar",
    "key_highlights": ["bullet"],
    "focus_today": ["tema"],
    "sentiment": "bullish"|"bearish"|"neutral",
    "generated_at": "ISO timestamp",
    "sections": [
      { "title": "string", "body": "korta stycken" }
    ]
  },
  "news_items": [
    {
      "id": "slug",
      "headline": "string",
      "summary": "1-2 meningar",
      "category": "macro|tech|earnings|sweden|global|commodities",
      "source": "string",
      "published_at": "ISO timestamp",
      "url": "https://"
    }
  ]
}

Regler:
- Fakta ska vara plausibla för Q4 2024 / början 2025.
- Blanda svenska och internationella perspektiv.
- Inga procenttal eller siffror som känns orimliga.
- Hitta inte på verkliga URL:er – använd \"#\" som placeholder.`;

  const raw = await callOpenAI(systemPrompt, userPrompt, 2200);
  logAiResponse("morning_brief", raw);
  const parsed = parseJsonPayload(raw);
  const morningBrief = normalizeMorningBrief(parsed?.morning_brief ?? parsed?.brief ?? parsed?.newsletter ?? {});
  const news = normalizeNewsItems(parsed?.news_items ?? parsed?.news ?? []);
  const digestHash = await computeDigestHash({ morningBrief, news });
  return { morningBrief, news, rawPayload: parsed ?? {}, digestHash };
}

async function generateMarketMomentum() {
  const systemPrompt =
    "Du är en svensk marknadsstrateg som beskriver momentum och sentiment. Svara alltid med giltig JSON.";
  const userPrompt = `Sammanfatta aktuellt marknadsmomentum för globala marknader.
Returnera JSON:
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "trend": "up|down|neutral",
      "change": "+3.2%",
      "timeframe": "24h|vecka|månad",
      "sentiment": "bullish|bearish|neutral|stable"
    }
  ]
}`;

  const raw = await callOpenAI(systemPrompt, userPrompt, 1400);
  logAiResponse("market_momentum", raw);
  const parsed = parseJsonPayload(raw);
  return normalizeMomentumItems(parsed?.items ?? []);
}

function logAiResponse(label: string, content: string) {
  const maxLength = 800;
  const preview = content.length > maxLength ? `${content.slice(0, maxLength)}…` : content;
  console.log(`[AI RESPONSE] ${label}:`, preview);
}

async function computeDigestHash(payload: unknown): Promise<string> {
  const encoded = textEncoder.encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getLatestStoredBrief(): Promise<{ morningBrief: MorningBrief; news: NewsItem[] } | null> {
  if (!supabaseClient) {
    console.warn("Supabase client is not configured; cannot fetch cached morning brief.");
    return null;
  }

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_items"
    )
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to read cached morning brief", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const sectionsArray = Array.isArray(data.sections)
    ? (data.sections as unknown[])
        .map((section) => {
          const record = section as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
          const body = typeof record.body === "string" ? record.body.trim() : "";
          if (!title && !body) {
            return null;
          }
          return { title, body };
        })
        .filter((section): section is MorningSection => !!section)
    : [];

  const morningBrief: MorningBrief = {
    id: data.id,
    headline: data.headline,
    overview: data.overview,
    keyHighlights: Array.isArray(data.key_highlights) ? data.key_highlights : [],
    focusToday: Array.isArray(data.focus_today) ? data.focus_today : [],
    sentiment:
      data.sentiment === "bullish" || data.sentiment === "bearish" || data.sentiment === "neutral"
        ? data.sentiment
        : "neutral",
    generatedAt: data.generated_at,
    sections: sectionsArray,
  };

  const newsItems = Array.isArray(data.news_items) ? (data.news_items as NewsItem[]) : [];

  return { morningBrief, news: newsItems };
}

async function storeMorningBrief(generated: GeneratedMorningBrief) {
  if (!supabaseClient) {
    console.warn("Supabase client is not configured; cannot store morning brief.");
    return;
  }

  const { morningBrief, news, rawPayload, digestHash } = generated;

  const { error } = await supabaseClient
    .from("morning_briefs")
    .upsert(
      {
        generated_at: morningBrief.generatedAt,
        headline: morningBrief.headline,
        overview: morningBrief.overview,
        key_highlights: morningBrief.keyHighlights,
        focus_today: morningBrief.focusToday,
        sentiment: morningBrief.sentiment,
        sections: morningBrief.sections,
        news_items: news,
        digest_hash: digestHash,
        raw_payload: rawPayload,
        status: "ready",
      },
      { onConflict: "digest_hash" }
    );

  if (error) {
    console.error("Failed to store morning brief", error);
  }
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function parseJsonPayload(content: string): Record<string, unknown> {
  const normalized = extractJsonPayload(content);
  try {
    return JSON.parse(normalized);
  } catch (error) {
    try {
      return JSON.parse(jsonrepair(normalized));
    } catch (repairError) {
      console.error("Failed to parse OpenAI JSON", { normalized, error, repairError });
      throw new Error("OpenAI response was not valid JSON");
    }
  }
}

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function extractText(data: unknown): string | null {
  if (typeof (data as { output_text?: unknown })?.output_text === "string") {
    return (data as { output_text: string }).output_text;
  }

  const output = (data as { output?: unknown })?.output;
  if (Array.isArray(output)) {
    for (const block of output) {
      if (typeof block === "object" && block !== null) {
        const content = (block as { content?: unknown })?.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part === "object" && part !== null) {
              const partType = (part as { type?: string }).type;
              if ((partType === "output_text" || partType === "text") && typeof (part as { text?: unknown }).text === "string") {
                return (part as { text: string }).text;
              }
            }
          }
        }
        if (typeof (block as { text?: unknown }).text === "string") {
          return (block as { text: string }).text;
        }
      }
    }
  }

  const content = (data as { content?: unknown })?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (typeof part === "object" && part !== null && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }

  return null;
}

function normalizeMorningBrief(raw: Record<string, unknown>): MorningBrief {
  const headline = typeof raw?.headline === "string" && raw.headline.trim().length > 0 ? raw.headline.trim() : "Morgonrapporten";
  const overview = typeof raw?.overview === "string" && raw.overview.trim().length > 0
    ? raw.overview.trim()
    : "AI-genererad morgonbrief saknar beskrivning.";

  return {
    id: typeof raw?.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : `brief_${crypto.randomUUID()}`,
    headline,
    overview,
    keyHighlights: normalizeStringArray(raw?.key_highlights ?? raw?.highlights ?? raw?.keyHighlights),
    focusToday: normalizeStringArray(raw?.focus_today ?? raw?.focus ?? raw?.focusToday),
    sentiment: normalizeSentiment(raw?.sentiment),
    generatedAt: normalizeIsoString(raw?.generated_at) ?? new Date().toISOString(),
    sections: Array.isArray(raw?.sections)
      ? (raw.sections as unknown[])
          .map((section) => {
            const record = section as Record<string, unknown>;
            const title = typeof record.title === "string" ? record.title.trim() : "";
            const body = typeof record.body === "string" ? record.body.trim() : "";
            if (!title && !body) {
              return null;
            }
            return { title, body };
          })
          .filter((section): section is MorningSection => !!section)
      : [],
  };
}

function normalizeNewsItems(items: unknown[]): NewsItem[] {
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => {
      const id = typeof item.id === "string" && item.id.trim().length > 0 ? item.id.trim() : `news_${index}`;
      return {
        id,
        headline: typeof item.headline === "string" ? item.headline.trim() : "Okänd rubrik",
        summary: typeof item.summary === "string" ? item.summary.trim() : "Sammanfattning saknas.",
        category: typeof item.category === "string" ? item.category.trim().toLowerCase() : "global",
        source: typeof item.source === "string" ? item.source.trim() : "AI-genererat",
        publishedAt: normalizeIsoString((item as { published_at?: string }).published_at) ?? new Date().toISOString(),
        url: typeof item.url === "string" && item.url.trim().length > 0 ? item.url.trim() : "#",
      };
    });
}

function normalizeMomentumItems(items: unknown[]): Array<Record<string, string>> {
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id.trim().length > 0 ? item.id : `momentum_${index}`,
      title: typeof item.title === "string" ? item.title.trim() : "Marknadspuls",
      description: typeof item.description === "string" ? item.description.trim() : "Beskrivning saknas",
      trend: typeof item.trend === "string" ? item.trend : "neutral",
      change: typeof item.change === "string" ? item.change : "0%",
      timeframe: typeof item.timeframe === "string" ? item.timeframe : "24h",
      sentiment: typeof item.sentiment === "string" ? item.sentiment : "neutral",
    }));
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(/\n|\r|•|-/)
      .map((entry) => entry.replace(/^\s*[-•]\s*/, "").trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function normalizeIsoString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSentiment(value: unknown): "bullish" | "bearish" | "neutral" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "bullish" || normalized === "bearish" || normalized === "neutral") {
      return normalized;
    }
  }
  return "neutral";
}
