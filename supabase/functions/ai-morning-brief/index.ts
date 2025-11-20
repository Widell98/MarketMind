import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface NewsItem {
  id?: string;
  headline?: string;
  title?: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
}

interface MorningBriefPayload {
  generatedAt: string;
  headline: string;
  intro: string;
  highlights: NewsItem[];
  focusAreas: string[];
  events: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const authHeader = supabaseServiceRoleKey ?? supabaseAnonKey;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const news = await fetchNewsSnapshot();
    const brief = buildMorningBrief(news);

    return new Response(JSON.stringify(brief), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-morning-brief failed", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function fetchNewsSnapshot(): Promise<NewsItem[]> {
  if (!authHeader) {
    console.warn("Missing Supabase auth key, returning mock news");
    return mockNewsItems();
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/fetch-news-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authHeader}`,
      apikey: authHeader,
    },
    body: JSON.stringify({ type: "news" }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to invoke fetch-news-data: ${response.status} ${body}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : mockNewsItems();
}

function buildMorningBrief(news: NewsItem[]): MorningBriefPayload {
  const published = new Date().toISOString();
  const highlights = news.slice(0, 4);

  return {
    generatedAt: published,
    headline: highlights[0]?.headline || "Morgonens viktigaste marknadspuls",
    intro:
      highlights.length > 0
        ? "Sammanfattning av de senaste marknadsdrivande nyheterna med fokus på nordiska och globala rörelser."
        : "Snabb översikt av marknaden inför öppning med fokus på dagens rörelser.",
    highlights,
    focusAreas: deriveFocusAreas(highlights),
    events: deriveEvents(highlights),
  };
}

function deriveFocusAreas(highlights: NewsItem[]): string[] {
  const areas = new Set<string>();

  for (const item of highlights) {
    const text = `${item.headline} ${item.summary}`.toLowerCase();
    if (text.includes("inflation") || text.includes("ränta")) areas.add("Ränta & inflation");
    if (text.includes("tech") || text.includes("ai")) areas.add("Teknik & AI");
    if (text.includes("olje") || text.includes("energi")) areas.add("Energi & råvaror");
    if (text.includes("bank")) areas.add("Finans & banker");
  }

  if (areas.size === 0) {
    areas.add("Marknadssentiment");
    areas.add("Makro & centralbanker");
  }

  return Array.from(areas).slice(0, 4);
}

function deriveEvents(highlights: NewsItem[]): string {
  const events = highlights
    .filter((item) => item.publishedAt)
    .slice(0, 3)
    .map((item) => `• ${item.headline || "Nyhet"} (${formatTime(item.publishedAt!)})`);

  if (events.length === 0) {
    return "• Inflationsdata och centralbankskommentarer följs för att bedöma räntebanan\n• Bolagsrapporter i fokus inför rapportsäsongen";
  }

  return events.join("\n");
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "senaste dygnet";
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mockNewsItems(): NewsItem[] {
  return [
    {
      id: "mock-1",
      headline: "Global riskaptit lyfter tech medan räntor mattas av",
      summary: "Starkare sentiment i USA:s techsektor ger bredare risk-on samtidigt som långräntor faller något.",
      source: "MarketMock",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      headline: "Svenska bankaktier stabiliseras efter veckans stress",
      summary: "Balansräkningar och kapitalnivåer lugnar marknaden efter oro kring kreditförluster.",
      source: "MarketMock",
      publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      headline: "Oljepriset backar när lagren ökar mer än väntat",
      summary: "Råvarumarknaden prisar in svagare efterfrågan samtidigt som OPEC-samtalen fortsätter.",
      source: "MarketMock",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      headline: "AI-investeringar driver upp värderingar i halvledare",
      summary: "Kraftig orderingång inom datacenter håller uppe guidningen trots makroosäkerhet.",
      source: "MarketMock",
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
