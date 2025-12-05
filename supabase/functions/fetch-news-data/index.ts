import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
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
    const contentType = parseContentType(body);

    switch (type) {
      case "momentum": {
        const items = await generateMarketMomentum();
        return jsonResponse(items);
      }
      case "update-news-only": {
        const queries = ["stock market news today", "börsen just nu"];
        const articles = await fetchMultipleTavilySearches(queries, 10, 1);
        const summarized = await Promise.all(articles.map(summarizeArticle));
        await saveNewsArticles(summarized);

        return jsonResponse({ message: `Saved ${summarized.length} articles` });
      }
      case "news":
      default: {
        const forceRefresh = body?.forceRefresh === true;
        const shouldPersist = body?.persist !== false;
        const latestStored = await getLatestStoredBrief();
        const now = new Date();

        if (!forceRefresh && latestStored && isSameUtcDay(new Date(latestStored.morningBrief.generatedAt), now)) {
          return jsonResponse(formatMorningBriefResponse(latestStored, contentType));
        }

        const generated = await generateMorningBrief({ allowRepeats: forceRefresh });

        const persisted = shouldPersist
          ? await storeMorningBrief(generated)
          : null;

        const responsePayload = persisted ?? { morningBrief: generated.morningBrief, news: generated.news };
        return jsonResponse(formatMorningBriefResponse(responsePayload, contentType));
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

type ContentType = "all" | "morning-brief" | "news";

function parseContentType(body: Record<string, unknown> | null): ContentType {
  if (!body || typeof body.contentType !== "string") {
    return "all";
  }

  const normalized = body.contentType.toLowerCase();
  if (normalized === "morning-brief") return "morning-brief";
  if (normalized === "news") return "news";
  return "all";
}

function formatMorningBriefResponse(
  payload: { morningBrief: MorningBrief; news: NewsItem[] },
  contentType: ContentType,
) {
  switch (contentType) {
    case "morning-brief":
      return { morningBrief: payload.morningBrief };
    case "news":
      return { news: payload.news };
    case "all":
    default:
      return { morningBrief: payload.morningBrief, news: payload.news };
  }
}

// --- Date Helper Functions ---

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

function getPreviousWeekday(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  
  // If it's Monday, go back to Friday
  if (prev.getDay() === 1) {
    prev.setDate(prev.getDate() - 3); // Go back 3 more days to Friday
  } else if (prev.getDay() === 0) {
    // If it's Sunday, go back to Friday
    prev.setDate(prev.getDate() - 2);
  } else if (prev.getDay() === 6) {
    // If it's Saturday, go back to Friday
    prev.setDate(prev.getDate() - 1);
  }
  
  return prev;
}

// --- Tavily Helper Functions ---

function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    
    // Map common domains to readable names
    const sourceMap: Record<string, string> = {
      "bloomberg.com": "Bloomberg",
      "reuters.com": "Reuters",
      "cnbc.com": "CNBC",
      "wsj.com": "Wall Street Journal",
      "di.se": "Dagens Industri",
      "svd.se": "Svenska Dagbladet",
      "dn.se": "Dagens Nyheter",
      "affarsvarlden.se": "Affärsvärlden",
      "privataaffarer.se": "Privata Affärer",
      "breakit.se": "Breakit",
      "marketwatch.com": "MarketWatch",
      "investing.com": "Investing.com",
      "ft.com": "Financial Times",
    };
    
    const domain = hostname.split("/")[0];
    return sourceMap[domain] || domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
  } catch {
    return "Okänd källa";
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query parameters and fragments, keep only protocol, hostname, and pathname
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
}

function areHeadlinesSimilar(headline1: string, headline2: string): boolean {
  // Normalize headlines: lowercase, remove extra spaces, remove common punctuation
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  const norm1 = normalize(headline1);
  const norm2 = normalize(headline2);
  
  // Check if headlines are identical after normalization
  if (norm1 === norm2) return true;
  
  // Check if one headline contains the other (for cases like "Stock Market Rises" vs "Stock Market Rises Today")
  if (norm1.length > 10 && norm2.length > 10) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length < norm2.length ? norm2 : norm1;
    // If shorter headline is at least 80% of longer and is contained in longer, consider similar
    if (longer.includes(shorter) && shorter.length / longer.length >= 0.8) {
      return true;
    }
  }
  
  return false;
}

function deduplicateNewsItems(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();
  
  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url);
    let isDuplicate = false;
    
    // Check if we've seen this normalized URL before
    if (seen.has(normalizedUrl)) {
      isDuplicate = true;
    } else {
      // Check if any existing item has a similar headline
      for (const [url, existingItem] of seen.entries()) {
        if (areHeadlinesSimilar(item.headline, existingItem.headline)) {
          isDuplicate = true;
          break;
        }
      }
    }
    
    // Only add if not a duplicate
    if (!isDuplicate) {
      seen.set(normalizedUrl, item);
    }
  }
  
  return Array.from(seen.values());
}

// Lägg till parametern 'domains' (string array)
async function fetchTavilyNews(query: string, maxResults = 15, days = 1, domains: string[] = []): Promise<TavilyArticle[]> {
  if (!tavilyApiKey) {
    console.warn("TAVILY_API_KEY is not configured. Skipping Tavily search.");
    return [];
  }

  // Standardlista om ingen specifik lista skickas med
  const defaultDomains = [
    "reuters.com",
          "marketwatch.com",
          "investing.com",
          "cnbc.com",
          "ft.com",
          "barrons.com",
          "marketscreener.com",
          "finance.yahoo.com",
          "seekingalpha.com",
          "apnews.com",
          "axios.com",
          "forbes.com",
          "fortune.com",
          "techcrunch.com",
          "theverge.com",
          "wired.com",
        "breakit.se",
          "privataaffarer.se",
          "affarsvarlden.se",
          "svd.se/bors/news.php",
          "placera.se"
          
  ];

  // Använd de specifika domänerna om de finns, annars default
  const targetDomains = domains.length > 0 ? domains : defaultDomains;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        include_domains: targetDomains, // <--- HÄR ÄR ÄNDRINGEN
        topic: "news",
        max_results: maxResults,
        days: days
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tavily API error:", errorText);
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data.results) && data.results.length > 0) {
      return data.results
        .filter((r: any) => r.title && r.url && r.content)
        .map((r: any) => ({
          title: typeof r.title === "string" ? r.title.trim() : "",
          content: typeof r.content === "string" ? r.content.trim() : (typeof r.snippet === "string" ? r.snippet.trim() : ""),
          url: typeof r.url === "string" ? r.url.trim() : "",
          source: extractSourceName(r.url || ""),
          published_date: typeof r.published_date === "string" ? r.published_date : undefined,
          domain: extractDomain(r.url || ""),
        }))
        .filter((article: TavilyArticle) => article.title && article.url && article.content);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch from Tavily:", error);
    return [];
  }
}

async function fetchMultipleTavilySearches(
  queries: string[],
  maxResultsPerQuery = 20,
  days = 1,
  options: GenerateOptions = {},
  domains: string[] = [] // <--- NY PARAMETER
): Promise<TavilyArticle[]> {
  console.log(`[fetchMultipleTavilySearches] Starting ${queries.length} searches`);

  const allArticles: TavilyArticle[] = [];
  const { allowRepeats = false } = options;
  const seenUrls = allowRepeats ? null : new Set<string>();
  
  // Skicka med 'domains' till fetchTavilyNews
  const searchPromises = queries.map(query => fetchTavilyNews(query, maxResultsPerQuery, days, domains));
  
  // ... resten av logiken är samma ...
  const results = await Promise.all(searchPromises);
  
  // Combine and deduplicate when requested
  for (const articles of results) {
    for (const article of articles) {
      if (allowRepeats) {
        allArticles.push(article);
        continue;
      }

      // Use normalized URL for deduplication to catch URLs with different query parameters
      const normalizedUrl = normalizeUrl(article.url);
      if (!seenUrls!.has(normalizedUrl)) {
        seenUrls!.add(normalizedUrl);
        allArticles.push(article);
      }
    }
  }

  const dedupeLabel = allowRepeats ? "(dedupe disabled)" : "unique";
  console.log(`[fetchMultipleTavilySearches] Combined ${allArticles.length} ${dedupeLabel} articles from ${queries.length} searches`);
  
  // Sort by published_date (newest first) if available
  allArticles.sort((a, b) => {
    if (a.published_date && b.published_date) {
      return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
    }
    if (a.published_date) return -1;
    if (b.published_date) return 1;
    return 0;
  });
  
  return allArticles;
}

// --- Article Summarization ---

async function categorizeArticle(title: string, content: string): Promise<string> {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  if (lowerTitle.includes("kvartalsrapport") || lowerTitle.includes("earnings") || lowerTitle.includes("resultat") || lowerContent.includes("kvartalsrapport")) {
    return "earnings";
  }
  if (lowerTitle.includes("tech") || lowerTitle.includes("teknologi") || lowerContent.includes("tech") || lowerContent.includes("ai ") || lowerContent.includes("artificiell")) {
    return "tech";
  }
  if (lowerTitle.includes("sverige") || lowerTitle.includes("svensk") || lowerContent.includes("sverige") || lowerContent.includes("svensk")) {
    return "sweden";
  }
  if (lowerTitle.includes("råvara") || lowerTitle.includes("commodit") || lowerTitle.includes("guld") || lowerTitle.includes("olja")) {
    return "commodities";
  }
  if (lowerTitle.includes("makro") || lowerTitle.includes("ekonomi") || lowerTitle.includes("ränta") || lowerContent.includes("makro")) {
    return "macro";
  }
  return "global";
}

async function summarizeArticle(article: TavilyArticle): Promise<NewsItem> {
  const category = await categorizeArticle(article.title, article.content);

  // Om OpenAI inte finns, använd originaltitel som fallback
  if (!openAIApiKey) {
    const summary = article.content.length > 200
      ? article.content.slice(0, 200) + "..."
      : article.content;

    return {
      id: `news_${crypto.randomUUID()}`,
      headline: article.title, // Fallback
      summary,
      category,
      source: article.source,
      publishedAt: article.published_date ? new Date(article.published_date).toISOString() : new Date().toISOString(),
      url: article.url,
    };
  }

  try {
    // 1. Uppdaterad System-prompt: Vi ber om JSON med både rubrik och text
    const systemPrompt =
      "Du är en svensk finansredaktör. Din uppgift är att läsa en råtext och skapa en kort, slagkraftig nyhetsnotis. Du svarar ALLTID med giltig JSON i formatet: { \"headline\": \"...\", \"summary\": \"...\" }.";

    // 2. Uppdaterad User-prompt: Instruktioner för att sätta en BRA rubrik
    const userPrompt = `Analysera följande text och skapa:
1. En beskrivande rubrik (max 7-8 ord). Den får INTE vara generisk som "Omni Ekonomi" eller "Dagens Nyheter", utan måste beskriva innehållet (t.ex. "Musk köper Tesla-aktier för en miljard").
2. En sammanfattning på svenska (max 2-3 meningar).

Originaltitel: ${article.title}

Innehåll:
${article.content.slice(0, 1200)}

Svara med JSON.`;

    // Vi ökar maxTokens lite eftersom vi nu vill ha JSON
    const rawResponse = await callOpenAI(systemPrompt, userPrompt, 400);

    // 3. Parsa JSON-svaret (Vi återanvänder din befintliga hjälpfunktion)
    let parsed;
    try {
      parsed = parseJsonPayload(rawResponse);
    } catch (e) {
      console.warn("JSON parse failed for summary, using raw text fallback");
      parsed = { headline: article.title, summary: rawResponse };
    }

    // Säkerställ att vi har värden, annars fallback
    const newHeadline = typeof parsed?.headline === "string" && parsed.headline.length > 5
      ? parsed.headline
      : article.title;
        
    const newSummary = typeof parsed?.summary === "string" && parsed.summary.length > 10
      ? parsed.summary
      : (typeof parsed?.headline === "string" ? rawResponse.replace(parsed.headline, "") : rawResponse);

    return {
      id: `news_${crypto.randomUUID()}`,
      headline: newHeadline, // HÄR använder vi nu den AI-genererade rubriken
      summary: newSummary.trim(),
      category,
      source: article.source,
      publishedAt: article.published_date ? new Date(article.published_date).toISOString() : new Date().toISOString(),
      url: article.url,
    };
  } catch (error) {
    console.error("Failed to summarize article:", error);
    // Fallback vid fel
    return {
      id: `news_${crypto.randomUUID()}`,
      headline: article.title,
      summary: article.content.slice(0, 200) + "...",
      category,
      source: article.source,
      publishedAt: article.published_date ? new Date(article.published_date).toISOString() : new Date().toISOString(),
      url: article.url,
    };
  }
}

// --- OpenAI Helper Functions ---

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<string> {
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Try chat/completions endpoint first (standard for gpt-5.1)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    console.error("OpenAI API error response:", errorText);
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = extractText(data);
  if (!text || text.trim().length === 0) {
    console.error("OpenAI raw response:", JSON.stringify(data, null, 2));
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

type TavilyArticle = {
  title: string;
  content: string;
  url: string;
  source: string;
  published_date?: string;
  domain: string;
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

type GenerateOptions = {
  allowRepeats?: boolean;
};

async function generateWeeklySummary(): Promise<GeneratedMorningBrief> {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  
  console.log(`[generateWeeklySummary] Generating weekly summary for week ${weekStart.toLocaleDateString("sv-SE")} - ${weekEnd.toLocaleDateString("sv-SE")}`);
  
  // 1. Get all briefs from the week
  const weekBriefs = await getWeekBriefs(weekStart, weekEnd);
  console.log(`[generateWeeklySummary] Found ${weekBriefs.length} briefs from the week`);
  
  // 2. Fetch news from the entire week
  const weeklyQueries = [
    "week in review financial markets stock market weekly summary",
    "market performance this week major events",
    "economic data releases this week",
    "financial news sweden global markets this week"
  ];
  
  const tavilyArticles = await fetchMultipleTavilySearches(weeklyQueries, 15, 7);
  console.log(`[generateWeeklySummary] Fetched ${tavilyArticles.length} articles from the week`);
  
  // 3. Summarize top articles
  const summarizedNews: NewsItem[] = [];
  for (const article of tavilyArticles.slice(0, 8)) {
    try {
      const summarized = await summarizeArticle(article);
      summarizedNews.push(summarized);
    } catch (error) {
      console.error("Failed to summarize article for weekly summary:", error);
    }
  }
  
  // 4. Deduplicate summarized news
  const deduplicatedNews = deduplicateNewsItems(summarizedNews);
  console.log(`[generateWeeklySummary] Deduplicated news: ${deduplicatedNews.length} (removed ${summarizedNews.length - deduplicatedNews.length} duplicates)`);

  await saveNewsArticles(deduplicatedNews);

  // 5. Create context from week briefs and articles
  const weekBriefsContext = weekBriefs.length > 0
    ? weekBriefs.map((brief, idx) => 
        `Dag ${idx + 1} (${new Date(brief.morningBrief.generatedAt).toLocaleDateString("sv-SE")}):\n` +
        `Rubrik: ${brief.morningBrief.headline}\n` +
        `Översikt: ${brief.morningBrief.overview}\n` +
        `Höjdpunkter: ${brief.morningBrief.keyHighlights.join(", ")}\n`
      ).join("\n\n")
    : "Inga tidigare briefs tillgängliga för veckan.";
  
  const tavilyContext = tavilyArticles.length > 0
    ? tavilyArticles.map((a) => `- ${a.title} (${a.source}): ${a.content.slice(0, 300)}...`).join("\n")
    : "";
  
  const systemPrompt =
    "Du är en svensk finansredaktör som skriver veckosammanfattningar. Du skriver långa, detaljerade texter som går igenom hela veckan. Du svarar alltid med giltig JSON.";
  
  const userPrompt = `Skriv en omfattande veckosammanfattning för veckan ${weekStart.toLocaleDateString("sv-SE")} - ${weekEnd.toLocaleDateString("sv-SE")}.

VIKTIGT: Detta är en veckosammanfattning, inte dagliga nyheter. Skriv en lång, detaljerad text (5-8 stycken) som går igenom:
- Viktigaste händelserna i veckan
- Marknadens utveckling och trender
- Sentiment och förändringar över veckan
- Utblick mot nästa vecka

Veckans dagliga briefs:
---
${weekBriefsContext}
---

Veckans nyhetsartiklar:
---
${tavilyContext || "Inga nyhetsartiklar tillgängliga för veckan."}
---

FORMAT (måste följas exakt):
{
  "morning_brief": {
    "headline": "Veckosammanfattning: [Kort beskrivning av veckan]",
    "overview": "LÅNG TEXT (5-8 stycken) som går igenom hela veckan. Beskriv viktigaste händelserna, marknadens utveckling, sentiment och trender. Var detaljerad och omfattande.",
    "key_highlights": [
      "Viktigaste händelsen 1 från veckan",
      "Viktigaste händelsen 2",
      "Viktigaste händelsen 3",
      "Viktigaste händelsen 4",
      "Viktigaste händelsen 5",
      "Viktigaste händelsen 6",
      "Viktigaste händelsen 7"
    ],
    "focus_today": ["Tema 1 för nästa vecka", "Tema 2", "Tema 3"],
    "sentiment": "bullish"|"bearish"|"neutral",
    "generated_at": "ISO timestamp",
    "sections": [
      { 
        "title": "Marknadens utveckling", 
        "body": "Detaljerad text (2-3 stycken) om marknadens utveckling under veckan." 
      },
      { 
        "title": "Viktiga händelser", 
        "body": "Detaljerad text (2-3 stycken) om viktiga händelser från veckan." 
      },
      { 
        "title": "Utblick framåt", 
        "body": "Detaljerad text (2-3 stycken) om vad som kan komma nästa vecka." 
      },
      { 
        "title": "Sverige och globalt", 
        "body": "Detaljerad text (2-3 stycken) om svenska och globala perspektiv." 
      }
    ]
  }
}

Regler:
- Skriv en LÅNG, detaljerad overview (5-8 stycken minimum)
- Gå igenom hela veckan, inte bara idag
- Fokusera på trender och utveckling över tid
- Var omfattande och detaljerad`;

  let morningBrief: MorningBrief;
  
  if (openAIApiKey) {
    try {
      const raw = await callOpenAI(systemPrompt, userPrompt, 3000);
      logAiResponse("weekly_summary", raw);
      const parsed = parseJsonPayload(raw);
      morningBrief = normalizeMorningBrief((parsed?.morning_brief ?? parsed?.brief ?? parsed?.newsletter ?? {}) as Record<string, unknown>);
    } catch (error) {
      console.error("Failed to generate weekly summary:", error);
      // Fallback weekly summary
      morningBrief = {
        id: `weekly_${crypto.randomUUID()}`,
        headline: `Veckosammanfattning ${weekStart.toLocaleDateString("sv-SE")} - ${weekEnd.toLocaleDateString("sv-SE")}`,
        overview: weekBriefs.length > 0
          ? `Denna vecka präglades av flera viktiga händelser på finansmarknaderna. ${weekBriefs.map(b => b.morningBrief.headline).join(" ")}. Marknaderna visade varierande sentiment genom veckan med både positiva och negativa signaler.`
          : "Ingen veckosammanfattning tillgänglig.",
        keyHighlights: weekBriefs.flatMap(b => b.morningBrief.keyHighlights).slice(0, 7),
        focusToday: ["Nästa vecka", "Marknadstrender", "Ekonomiska indikatorer"],
        sentiment: "neutral",
        generatedAt: new Date().toISOString(),
        sections: [],
      };
    }
  } else {
    morningBrief = {
      id: `weekly_${crypto.randomUUID()}`,
      headline: `Veckosammanfattning ${weekStart.toLocaleDateString("sv-SE")} - ${weekEnd.toLocaleDateString("sv-SE")}`,
      overview: "Ingen veckosammanfattning tillgänglig.",
      keyHighlights: [],
      focusToday: ["Nästa vecka", "Marknadstrender", "Ekonomiska indikatorer"],
      sentiment: "neutral",
      generatedAt: new Date().toISOString(),
      sections: [],
    };
  }

  const runGeneratedAt = new Date().toISOString();
  const normalizedBrief = { ...morningBrief, generatedAt: runGeneratedAt };

  const digestHash = await computeDigestHash({ morningBrief: normalizedBrief, news: deduplicatedNews });
  console.log(`[generateWeeklySummary] Returning: morningBrief=${!!morningBrief}, newsCount=${deduplicatedNews.length}`);
  return { morningBrief: normalizedBrief, news: deduplicatedNews, rawPayload: {}, digestHash };
}

async function generateMorningBrief(options: GenerateOptions = {}): Promise<GeneratedMorningBrief> {
  const today = new Date();
  const { allowRepeats = false } = options;
  
  // Check if it's weekend - if so, generate weekly summary
  if (isWeekend(today)) {
    console.log(`[generateMorningBrief] Weekend detected, generating weekly summary`);
    return await generateWeeklySummary();
  }
  
  const yesterday = getPreviousWeekday(today);
  
  // 1. Get previous day's brief for context
  const previousBrief = await getPreviousDayBrief(today);
  console.log(`[generateMorningBrief] Previous day brief found: ${!!previousBrief}`);
  
  // --- HÄR ÄR DEN NYA LOGIKEN (SVERIGE VS GLOBALT) ---

  // A. Definiera specifika domäner för att garantera svenska nyheter
  const swedishDomains = [
   "svd.se", "dn.se", "privataaffarer.se", "breakit.se", "omni.se", "placera.se"
  ];
  
  const globalDomains = [
    "cnbc.com", "reuters.com", "bloomberg.com", "ft.com", "marketwatch.com", 
    "techcrunch.com", "wsj.com", "investing.com", "finance.yahoo.com"
  ];

  // B. Dela upp sökningarna
 const swedishQueries = [
    "börsen idag stockholm vinnare förlorare placera",
    "svensk ekonomi nyheter svt ränta",
    "marknadskollen omni ekonomi",
    "aktier analys aktiespararna",
    "svenska storbolag rapport"
  ];
  
  const globalQueries = [
    "us stock market close summary key events",
    "federal reserve interest rates inflation",
    "big tech earnings ai nvidia apple microsoft",
    "oil prices gold commodities market",
    "european markets ecb rates economy"
  ];

  // Lägg till uppföljning från gårdagen i den globala sökningen
  if (previousBrief && previousBrief.morningBrief.headline) {
     globalQueries.push(`follow-up ${previousBrief.morningBrief.headline}`);
  }

  // C. Kör sökningarna SEPARAT (Sverige vs Världen)
  console.log("[generateMorningBrief] Fetching SWEDISH and GLOBAL news separately...");
  
  // OBS: Detta kräver att du har uppdaterat 'fetchMultipleTavilySearches' enligt Steg 2!
  const [swedishArticles, globalArticles] = await Promise.all([
    fetchMultipleTavilySearches(swedishQueries, 5, 1, { allowRepeats }, swedishDomains),
    fetchMultipleTavilySearches(globalQueries, 10, 1, { allowRepeats }, globalDomains)
  ]);

  // D. Slå ihop resultaten (Svenska först så de hamnar högst upp i listan)
  const majorDomains = new Set([
    "cnbc.com",
    "reuters.com",
    "bloomberg.com",
    "ft.com",
    "wsj.com",
  ]);

  const globalMajorArticles = globalArticles.filter((article) => majorDomains.has(article.domain));
  const globalAltArticles = globalArticles.filter((article) => !majorDomains.has(article.domain));

  // Fix: Ta max 5 från varje kategori för att TVINGA fram en blandning
  const tavilyArticles = [
    ...swedishArticles.slice(0, 5), // Max 5 svenska
    ...globalAltArticles.slice(0, 5), // Max 5 analys/tech
    ...globalMajorArticles.slice(0, 5), // Max 5 stora globala (CNBC/Reuters)
  ];
  console.log(`[generateMorningBrief] Fetched total: ${tavilyArticles.length} (SE: ${swedishArticles.length}, GL: ${globalArticles.length}, GL-major: ${globalMajorArticles.length}, GL-alt: ${globalAltArticles.length})`);

  // --- HÄRIFRÅN ÄR DET SAMMA PARALLELL-LOGIK SOM VI FIXADE TIDIGARE ---

  // 4. Summarize articles in PARALLEL
  const articlesToProcess = tavilyArticles;
  console.log(`[generateMorningBrief] Starting parallel summarization of ${articlesToProcess.length} articles...`);

  const summaryPromises = articlesToProcess.map(async (article) => {
    try {
      const summarized = await summarizeArticle(article);
      console.log(`[generateMorningBrief] Summarized: ${summarized.headline.substring(0, 30)}...`);
      return summarized;
    } catch (error) {
      console.error(`Failed to summarize article: ${article.title}`, error);
      return null;
    }
  });

  const results = await Promise.all(summaryPromises);
  const summarizedNews = results.filter((item): item is NewsItem => item !== null);
  
  console.log(`[generateMorningBrief] Total summarized news: ${summarizedNews.length}`);

  // 5. Deduplicate summarized news
  const deduplicatedNews = deduplicateNewsItems(summarizedNews);
  console.log(`[generateMorningBrief] Deduplicated news: ${deduplicatedNews.length} (removed ${summarizedNews.length - deduplicatedNews.length} duplicates)`);

  await saveNewsArticles(deduplicatedNews);

  // 6. Create context and generate brief
  const tavilyContext = tavilyArticles.length > 0
    ? tavilyArticles.map((a) => `- ${a.title} (${a.source}): ${a.content.slice(0, 300)}...`).join("\n")
    : "";
  
  const systemPrompt =
    "Du är chefsanalytiker på en ledande nordisk investmentbank. Du skriver morgonbrev till professionella investerare. Tonen är insiktsfull, objektiv och framåtblickande. Du undviker plattityder.";

  const userPrompt = `Analysera nyhetsläget inför börsöppning ${today.toLocaleDateString("sv-SE")}.

UNDERLAG (Nyheter hämtade senaste dygnet):
${tavilyContext || "Inga specifika nyheter hittades, gör en generell marknadsspaning."}

DIN UPPGIFT:
Skapa ett morgonbrev som ger läsaren ett informationsövertag ("edge").
1. Identifiera det enskilt viktigaste temat just nu (t.ex. "Ränteoro i USA" eller "Tech-rallyt fortsätter").
2. Koppla nyheter till påverkan: Om oljan stiger, nämn vilka sektorer som påverkas.
3. Var konkret med siffror när det finns i texten.

FORMAT (JSON):
{
  "morning_brief": {
    "headline": "Kort, slagkraftig rubrik som sammanfattar marknadsläget (Max 6 ord)",
    "overview": "En stark ingress (3-4 meningar). Börja med det viktigaste. Svara på frågan: 'Vad styr humöret på marknaden just nu?'",
    "sentiment": "bullish"|"bearish"|"neutral",
    "key_highlights": [
      "Punkt 1: Det viktigaste som hänt (t.ex. 'Fed lämnar räntan oförändrad')",
      "Punkt 2: Stor bolagsnyhet eller makrosiffra",
      "Punkt 3: Annan viktig händelse",
      "Punkt 4: ...",
      "Punkt 5: ..."
    ],
    "focus_today": ["Tema 1 (t.ex. Inflation)", "Tema 2 (t.ex. Bankrapporter)", "Tema 3"],
    "agenda": [  // NYTT FÄLT: Hållpunkter
       "08:00 KPI-siffror Sverige",
       "14:30 USA Jobbsiffror" 
       // (Om inga specifika tider finns i texten, lämna tomt eller gissa kvalificerat baserat på kontext)
    ],
    "mentioned_tickers": ["VOLV-B", "ERIC-B", "TSLA"], // NYTT FÄLT: Extrahera tickers om de nämns
    "sections": [
      { 
        "title": "Marknadskollen", 
        "body": "Sammanfattning av indexrörelser (USA/Asien) och vad terminerna indikerar." 
      },
      { 
        "title": "Dagens Spaning", 
        "body": "Din analytiker-kommentar. Varför händer detta? Vad ska man titta extra på? (2 stycken)" 
      },
      { 
        "title": "Sverige & Bolag", 
        "body": "Fokus på svenska aktier och bolagshändelser från nyhetsflödet." 
      }
    ]
  }
}`;

  let morningBrief: MorningBrief;
  
  if (tavilyArticles.length > 0 && openAIApiKey) {
    try {
      const raw = await callOpenAI(systemPrompt, userPrompt, 2000);
      logAiResponse("morning_brief", raw);
      const parsed = parseJsonPayload(raw);
      morningBrief = normalizeMorningBrief((parsed?.morning_brief ?? parsed?.brief ?? parsed?.newsletter ?? {}) as Record<string, unknown>);
    } catch (error) {
      console.error("Failed to generate morning brief:", error);
      // Fallback morning brief
      morningBrief = {
        id: `brief_${crypto.randomUUID()}`,
        headline: "Dagens Nyheter",
        overview: tavilyArticles[0]?.title || "Marknadsläget just nu",
        keyHighlights: tavilyArticles.slice(0, 5).map(a => a.title),
        focusToday: ["Nyheter", "Marknad", "Analys"],
        sentiment: "neutral",
        generatedAt: new Date().toISOString(),
        sections: [],
      };
    }
  } else {
    // Fallback if no articles or OpenAI unavailable
    morningBrief = {
      id: `brief_${crypto.randomUUID()}`,
      headline: "Dagens Nyheter",
      overview: "Inga nyheter tillgängliga för idag.",
      keyHighlights: [],
      focusToday: ["Nyheter", "Marknad", "Analys"],
      sentiment: "neutral",
      generatedAt: new Date().toISOString(),
      sections: [],
    };
  }

  const runGeneratedAt = new Date().toISOString();
  const normalizedBrief = { ...morningBrief, generatedAt: runGeneratedAt };

  const digestHash = await computeDigestHash({ morningBrief: normalizedBrief, news: deduplicatedNews });
  console.log(`[generateMorningBrief] Returning: morningBrief=${!!morningBrief}, newsCount=${deduplicatedNews.length}`);
  console.log(`[generateMorningBrief] News items sample:`, deduplicatedNews.slice(0, 2).map(n => ({ headline: n.headline, source: n.source })));
  return { morningBrief: normalizedBrief, news: deduplicatedNews, rawPayload: {}, digestHash };
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
  return normalizeMomentumItems((parsed?.items ?? []) as unknown[]);
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

async function getPreviousDayBrief(targetDate: Date): Promise<{ morningBrief: MorningBrief; news: NewsItem[] } | null> {
  if (!supabaseClient) {
    return null;
  }

  const previousDay = getPreviousWeekday(targetDate);
  const startOfDay = new Date(previousDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(previousDay);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_items"
    )
    .gte("generated_at", startOfDay.toISOString())
    .lte("generated_at", endOfDay.toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to read previous day brief", error);
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

async function getWeekBriefs(weekStart: Date, weekEnd: Date): Promise<{ morningBrief: MorningBrief; news: NewsItem[] }[]> {
  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_items"
    )
    .gte("generated_at", weekStart.toISOString())
    .lte("generated_at", weekEnd.toISOString())
    .order("generated_at", { ascending: true });

  if (error) {
    console.error("Failed to read week briefs", error);
    return [];
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const sectionsArray = Array.isArray(item.sections)
      ? (item.sections as unknown[])
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
      id: item.id,
      headline: item.headline,
      overview: item.overview,
      keyHighlights: Array.isArray(item.key_highlights) ? item.key_highlights : [],
      focusToday: Array.isArray(item.focus_today) ? item.focus_today : [],
      sentiment:
        item.sentiment === "bullish" || item.sentiment === "bearish" || item.sentiment === "neutral"
          ? item.sentiment
          : "neutral",
      generatedAt: item.generated_at,
      sections: sectionsArray,
    };

    const newsItems = Array.isArray(item.news_items) ? (item.news_items as NewsItem[]) : [];

    return { morningBrief, news: newsItems };
  });
}

function extractKeywordsFromBrief(brief: MorningBrief): string[] {
  const keywords: string[] = [];
  
  // Extract from headline
  if (brief.headline) {
    keywords.push(...brief.headline.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  }
  
  // Extract from overview
  if (brief.overview) {
    const overviewWords = brief.overview.toLowerCase().split(/\s+/);
    keywords.push(...overviewWords.filter(w => w.length > 4));
  }
  
  // Extract from key highlights
  brief.keyHighlights.forEach(highlight => {
    keywords.push(...highlight.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  });
  
  // Extract from focus today
  brief.focusToday.forEach(focus => {
    keywords.push(focus.toLowerCase());
  });
  
  // Remove duplicates and common words
  const commonWords = new Set(['och', 'för', 'att', 'det', 'som', 'är', 'på', 'med', 'av', 'till', 'den', 'en', 'ett', 'har', 'inte', 'kan', 'ska', 'var', 'vid', 'om', 'men', 'eller', 'när', 'så', 'där', 'från', 'genom', 'under', 'över', 'efter', 'innan', 'mellan', 'mot', 'utan', 'hos', 'trots', 'tack', 'vare', 'än', 'ju', 'nog', 'väl', 'bara', 'också', 'redan', 'alltid', 'aldrig', 'nästan', 'ganska', 'mycket', 'lite', 'mer', 'mest', 'mindre', 'minst']);
  
  const uniqueKeywords = Array.from(new Set(keywords))
    .filter(w => !commonWords.has(w))
    .slice(0, 10); // Take top 10 keywords
  
  return uniqueKeywords;
}

async function storeMorningBrief(generated: GeneratedMorningBrief): Promise<{ morningBrief: MorningBrief; news: NewsItem[] } | null> {
  if (!supabaseClient) {
    console.warn("Supabase client is not configured; cannot store morning brief.");
    return null;
  }

  const { morningBrief, news, rawPayload, digestHash } = generated;

  const { data, error } = await supabaseClient
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
    )
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_items"
    )
    .single();

  if (error) {
    console.error("Failed to store morning brief", error);
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

  const storedBrief: MorningBrief = {
    id: data.id,
    headline: data.headline,
    overview: data.overview,
    keyHighlights: Array.isArray(data.key_highlights) ? data.key_highlights : morningBrief.keyHighlights,
    focusToday: Array.isArray(data.focus_today) ? data.focus_today : morningBrief.focusToday,
    sentiment:
      data.sentiment === "bullish" || data.sentiment === "bearish" || data.sentiment === "neutral"
        ? data.sentiment
        : morningBrief.sentiment,
    generatedAt: data.generated_at,
    sections: sectionsArray,
  };

  const storedNews = Array.isArray(data.news_items) ? (data.news_items as NewsItem[]) : news;

  return { morningBrief: storedBrief, news: storedNews };
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
  // Handle chat/completions format (standard for gpt-5.1) - match portfolio-ai-chat pattern
  if (data && typeof data === "object") {
    const rawContent = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
    if (typeof rawContent === "string" && rawContent.trim().length > 0) {
      return rawContent;
    }
  }

  // Fallback: Handle responses API format (legacy)
  if (typeof (data as { output_text?: unknown })?.output_text === "string") {
    return (data as { output_text: string }).output_text;
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

async function saveNewsArticles(articles: NewsItem[]) {
  if (!supabaseClient || articles.length === 0) return;

  const dbRows = articles.map((a) => ({
    headline: a.headline,
    summary: a.summary,
    category: a.category,
    source: a.source,
    url: a.url,
    published_at: a.publishedAt,
  }));

  const { error } = await supabaseClient
    .from("news_articles")
    .upsert(dbRows, { onConflict: "url", ignoreDuplicates: true });

  if (error) console.error("Error saving news:", error);
}
