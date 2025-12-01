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
    const allowRepeats = body?.allowRepeats === true;

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
        const cachedIsStale = latestStored ? isCachedBriefStale(latestStored) : false;

        if (cachedIsStale && latestStored) {
          console.log(
            `[fetch-news-data] Cached brief ${latestStored.morningBrief.id} is empty/incomplete (news length=${latestStored.news.length}).`,
          );
        }

        if (!forceRefresh) {
          if (latestStored && !cachedIsStale) {
            return jsonResponse(latestStored);
          }

          const fallback = await getPreviousDayBrief(new Date());
          if (fallback) {
            if (isCachedBriefStale(fallback)) {
              console.log(
                `[fetch-news-data] Ignoring fallback brief ${fallback.morningBrief.id} because it is stale/empty (news length=${
                  fallback.news.length
                }).`,
              );
            } else {
              console.log(
                `[fetch-news-data] Serving fallback brief ${fallback.morningBrief.id} because cached brief was ${
                  latestStored ? "stale/empty" : "missing"
                }.`,
              );
              return jsonResponse(fallback);
            }
          }
        }

        if (!latestStored && !cachedIsStale) {
          console.log("[fetch-news-data] No cached brief found. Generating new morning brief.");
        } else if (forceRefresh) {
          console.log("[fetch-news-data] forceRefresh requested. Generating new morning brief.");
        } else if (cachedIsStale) {
          console.log("[fetch-news-data] Cached brief is stale and no fallback available. Generating new morning brief.");
        }

        const generated = await generateMorningBrief({ allowRepeats });

        let responsePayload = { morningBrief: generated.morningBrief, news: generated.news };

        if (shouldPersist) {
          const storedId = await storeMorningBrief(generated);
          if (storedId) {
            const stored = await getBriefWithNews(storedId);
            if (stored) {
              // If the stored brief is missing news (e.g., persistence failed), fall back to the in-memory generation
              if (!stored.news || stored.news.length === 0) {
                console.warn(
                  `[fetch-news-data] Stored brief ${storedId} returned without news. Falling back to generated payload (newsCount=${generated.news.length}).`,
                );
              } else {
                responsePayload = stored;
              }
            }
          }
        }

        return jsonResponse(responsePayload);
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
      "finance.yahoo.com": "Yahoo Finance",
      "marketscreener.com": "MarketScreener",
      "seekingalpha.com": "Seeking Alpha",
      "apnews.com": "AP News",
      "axios.com": "Axios",
      "forbes.com": "Forbes",
      "fortune.com": "Fortune",
      "techcrunch.com": "TechCrunch",
      "theverge.com": "The Verge",
      "wired.com": "WIRED",
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

async function fetchTavilyNews(query: string, maxResults = 15, days = 1): Promise<TavilyArticle[]> {
  if (!tavilyApiKey) {
    console.warn("TAVILY_API_KEY is not configured. Skipping Tavily search.");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        include_domains: [
            // Global finance & markets
            "bloomberg.com",
            "reuters.com",
            "marketwatch.com",
            "investing.com",
            "finance.yahoo.com",
            "marketscreener.com",
            "seekingalpha.com",
            "cnbc.com",
            "wsj.com",
            "ft.com",

            // Macro, economy, business
            "apnews.com",
            "axios.com",
            "forbes.com",
            "fortune.com",

            // Tech & AI
            "techcrunch.com",
            "theverge.com",
            "wired.com",

            // Swedish open sources
            "di.se",
            "svd.se/naringsliv",
            "dn.se/ekonomi",
            "affarsvarlden.se",
            "privataaffarer.se",
            "breakit.se",
        ],
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
  allowRepeats = false,
): Promise<TavilyArticle[]> {
  console.log(`[fetchMultipleTavilySearches] Starting ${queries.length} searches`);
  
  const allArticles: TavilyArticle[] = [];
  const seenUrls = new Set<string>();
  
  // Run all searches in parallel
  const searchPromises = queries.map(query => fetchTavilyNews(query, maxResultsPerQuery, days));
  const results = await Promise.all(searchPromises);
  
  // Combine and deduplicate
  for (const articles of results) {
    for (const article of articles) {
      if (allowRepeats || !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        allArticles.push(article);
      }
    }
  }
  
  console.log(`[fetchMultipleTavilySearches] Combined ${allArticles.length} unique articles from ${queries.length} searches`);
  
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
  
  // If OpenAI is not available, use original content as summary
  if (!openAIApiKey) {
    const summary = article.content.length > 200 
      ? article.content.slice(0, 200) + "..."
      : article.content;
    
    return {
      id: `news_${crypto.randomUUID()}`,
      headline: article.title,
      summary,
      category,
      source: article.source,
      publishedAt: article.published_date ? new Date(article.published_date).toISOString() : new Date().toISOString(),
      url: article.url,
    };
  }

  try {
    const systemPrompt = "Du är en svensk finansjournalist som sammanfattar nyhetsartiklar. Du svarar alltid med en kort sammanfattning på svenska (max 2-3 meningar).";
    
    const userPrompt = `Sammanfatta följande artikel på svenska. Behåll all faktisk information men omskriv texten för att undvika upprepning. Använd inte samma meningar som originalet. Max 2-3 meningar.

Rubrik: ${article.title}

Innehåll:
${article.content.slice(0, 1000)}

Sammanfattning:`;

    const summary = await callOpenAI(systemPrompt, userPrompt, 150);
    
    return {
      id: `news_${crypto.randomUUID()}`,
      headline: article.title,
      summary: summary.trim() || article.content.slice(0, 200),
      category,
      source: article.source,
      publishedAt: article.published_date ? new Date(article.published_date).toISOString() : new Date().toISOString(),
      url: article.url,
    };
  } catch (error) {
    console.error("Failed to summarize article:", error);
    // Fallback to original content
    const summary = article.content.length > 200 
      ? article.content.slice(0, 200) + "..."
      : article.content;
    
    return {
      id: `news_${crypto.randomUUID()}`,
      headline: article.title,
      summary,
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

type NewsArticleRow = {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  published_at: string | null;
  created_at?: string | null;
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

async function generateWeeklySummary(options: GenerateOptions = {}): Promise<GeneratedMorningBrief> {
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
  
  const tavilyArticles = await fetchMultipleTavilySearches(weeklyQueries, 15, 7, options.allowRepeats === true);
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
  
  // 4. Create context from week briefs and articles
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

  const digestHash = await computeDigestHash({ morningBrief, news: summarizedNews });
  console.log(`[generateWeeklySummary] Returning: morningBrief=${!!morningBrief}, newsCount=${summarizedNews.length}`);
  return { morningBrief, news: summarizedNews, rawPayload: {}, digestHash };
}

async function generateMorningBrief(options: GenerateOptions = {}): Promise<GeneratedMorningBrief> {
  const today = new Date();

  // Check if it's weekend - if so, generate weekly summary
  if (isWeekend(today)) {
    console.log(`[generateMorningBrief] Weekend detected, generating weekly summary`);
    return await generateWeeklySummary(options);
  }
  
  const yesterday = getPreviousWeekday(today);
  
  // 1. Get previous day's brief for context
  const previousBrief = await getPreviousDayBrief(today);
  const previousKeywords = previousBrief ? extractKeywordsFromBrief(previousBrief.morningBrief) : [];
  console.log(`[generateMorningBrief] Previous day brief found: ${!!previousBrief}, keywords: ${previousKeywords.slice(0, 5).join(", ")}`);
  
  // 2. Build search queries based on categories and previous day's context
  const baseQueries = [
    "central bank interest rates inflation GDP economic data",
    "stock market earnings reports company results",
    "technology stocks AI tech companies innovation",
    "sweden stock market swedish economy",
    "oil prices commodities gold metals",
    "global markets international trade geopolitics"
  ];
  
  // Add follow-up queries based on previous day if available
  const followUpQueries: string[] = [];
  if (previousBrief && previousBrief.morningBrief.headline) {
    followUpQueries.push(`follow-up ${previousBrief.morningBrief.headline}`);
    if (previousKeywords.length > 0) {
      followUpQueries.push(previousKeywords.slice(0, 3).join(" "));
    }
  }
  
  const allQueries = [...baseQueries, ...followUpQueries];
  
  // 3. Fetch news from multiple Tavily searches
  const tavilyArticles = await fetchMultipleTavilySearches(allQueries, 20, 1, options.allowRepeats === true);
  console.log(`[generateMorningBrief] Fetched ${tavilyArticles.length} articles from Tavily`);
  
  // 4. Summarize each article with AI (up to 20 articles)
  const summarizedNews: NewsItem[] = [];
  for (const article of tavilyArticles.slice(0, 20)) {
    try {
      const summarized = await summarizeArticle(article);
      summarizedNews.push(summarized);
      console.log(`[generateMorningBrief] Successfully summarized article: ${summarized.headline.substring(0, 50)}...`);
    } catch (error) {
      console.error("Failed to summarize article:", error);
      // Skip this article if summarization fails
    }
  }
  console.log(`[generateMorningBrief] Total summarized news: ${summarizedNews.length}`);

  // 3. Create context string for morning brief generation
  const tavilyContext = tavilyArticles.length > 0
    ? tavilyArticles.map((a) => `- ${a.title} (${a.source}): ${a.content.slice(0, 300)}...`).join("\n")
    : "";
  
  const previousDayContext = previousBrief
    ? `Gårdagens huvudnyhet: ${previousBrief.morningBrief.headline}\n` +
      `Gårdagens översikt: ${previousBrief.morningBrief.overview}\n` +
      `Gårdagens teman: ${previousBrief.morningBrief.focusToday.join(", ")}\n`
    : "";

  const systemPrompt =
    "Du är en svensk finansredaktör som skriver morgonbrev och strukturerade nyhetssammanfattningar baserat på faktiska nyhetsartiklar. Du svarar alltid med giltig JSON.";

  const userPrompt = `Skriv ett detaljerat morgonbrev för datumet ${today.toLocaleDateString("sv-SE")} baserat på följande faktiska nyhetsartiklar.

VIKTIGT: Du ska INTE skapa egna nyheter. Använd endast informationen från artiklarna nedan.

${previousDayContext ? `KONTEKST FRÅN GÅRDAGEN:\n---\n${previousDayContext}---\n\nAnvänd detta som bakgrund för att förstå utvecklingen, men fokusera på DAGENS nyheter.\n\n` : ""}Faktiska nyhetsartiklar för idag:
---
${tavilyContext || "Inga nyhetsartiklar tillgängliga för idag."}
---

Baserat på dessa artiklar, skapa:
- En huvudrubrik som sammanfattar den viktigaste nyheten
- En översikt (3-4 meningar) för Hero-kortet
- 5 korta nyhetspunkter för "Snabbkollen"
- 3 teman för "Fokus idag"
- Exakt 3 fördjupande sektioner (t.ex. Makro, Tech, Marknad) baserat på artiklarna
- Ett sentiment (bullish/bearish/neutral) baserat på artiklarnas innehåll

Fokusera på händelser och sentiment från ${yesterday.toLocaleDateString("sv-SE")} (gårdagen) och natten till idag.

FORMAT (måste följas exakt):
{
  "morning_brief": {
    "headline": "Kort, slagkraftig huvudrubrik (max 6 ord)",
    "overview": "Engagerande ingress för huvudnyheten (3-4 meningar). Detta visas i det stora Hero-kortet.",
    "key_highlights": [
      "Kort nyhetspunkt 1 (max 1 mening)",
      "Kort nyhetspunkt 2",
      "Kort nyhetspunkt 3",
      "Kort nyhetspunkt 4",
      "Kort nyhetspunkt 5"
    ],
    "focus_today": ["Tema 1", "Tema 2", "Tema 3"],
    "sentiment": "bullish"|"bearish"|"neutral",
    "generated_at": "ISO timestamp",
    "sections": [
      { 
        "title": "Rubrik för sektion 1 (t.ex. 'Makroläget')", 
        "body": "Innehållsrik text (2-3 stycken) baserat på artiklarna." 
      },
      { "title": "Rubrik för sektion 2", "body": "..." },
      { "title": "Rubrik för sektion 3", "body": "..." }
    ]
  }
}

Regler:
- Använd endast information från de faktiska artiklarna ovan.
- Var specifik med siffror och fakta från artiklarna.
- Blanda svenska och internationella perspektiv baserat på artiklarna.`;

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

  const digestHash = await computeDigestHash({ morningBrief, news: summarizedNews });
  console.log(`[generateMorningBrief] Returning: morningBrief=${!!morningBrief}, newsCount=${summarizedNews.length}`);
  console.log(`[generateMorningBrief] News items sample:`, summarizedNews.slice(0, 2).map(n => ({ headline: n.headline, source: n.source })));
  return { morningBrief, news: summarizedNews, rawPayload: {}, digestHash };
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

async function getBriefWithNews(briefId: string): Promise<{ morningBrief: MorningBrief; news: NewsItem[] } | null> {
  if (!supabaseClient) {
    console.warn("Supabase client is not configured; cannot fetch brief with news.");
    return null;
  }

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_articles(id, headline, summary, category, source, url, published_at, created_at)"
    )
    .eq("id", briefId)
    .maybeSingle();

  if (error) {
    console.error("Failed to read brief", error);
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

  const newsRows = (data as typeof data & { news_articles?: NewsArticleRow[] }).news_articles;

  return { morningBrief, news: mapNewsRowsToItems(newsRows) };
}

async function getLatestStoredBrief(): Promise<{ morningBrief: MorningBrief; news: NewsItem[] } | null> {
  if (!supabaseClient) {
    console.warn("Supabase client is not configured; cannot fetch cached morning brief.");
    return null;
  }

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections, news_articles(id, headline, summary, category, source, url, published_at, created_at)"
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

  const { data: newsRows, error: newsError } = await supabaseClient
    .from("news_articles")
    .select("id, headline, summary, category, source, url, published_at, created_at")
    .eq("brief_id", data.id)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (newsError) {
    console.error("Failed to read cached news articles", newsError);
  }

  return { morningBrief, news: mapNewsRowsToItems(newsRows) };
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
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections"
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

  const { data: newsRows, error: newsError } = await supabaseClient
    .from("news_articles")
    .select("id, headline, summary, category, source, url, published_at, created_at")
    .eq("brief_id", data.id)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (newsError) {
    console.error("Failed to read previous day news articles", newsError);
  }

  return { morningBrief, news: mapNewsRowsToItems(newsRows) };
}

async function getWeekBriefs(weekStart: Date, weekEnd: Date): Promise<{ morningBrief: MorningBrief; news: NewsItem[] }[]> {
  if (!supabaseClient) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("morning_briefs")
    .select(
      "id, generated_at, headline, overview, key_highlights, focus_today, sentiment, sections"
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

    const newsRows = (item as typeof item & { news_articles?: NewsArticleRow[] }).news_articles;

    return { morningBrief, news: mapNewsRowsToItems(newsRows) };
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

function mapNewsRowsToItems(rows: NewsArticleRow[] | null | undefined): NewsItem[] {
  if (!rows || rows.length === 0) return [];

  return rows.map((row) => ({
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    category: row.category || "global",
    source: row.source || "Okänd källa",
    url: row.url,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : row.created_at
        ? new Date(row.created_at).toISOString()
        : new Date().toISOString(),
  }));
}

async function storeMorningBrief(generated: GeneratedMorningBrief): Promise<string | null> {
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
    .select("id")
    .single();

  if (error) {
    console.error("Failed to store morning brief", error);
    return null;
  }

  const briefId = data?.id;
  if (!briefId) {
    console.error("Stored morning brief but did not receive an id back");
    return null;
  }

  // Replace previous news articles for this brief with the freshly generated set
  const { error: deleteError } = await supabaseClient
    .from("news_articles")
    .delete()
    .eq("brief_id", briefId);

  if (deleteError) {
    console.error("Failed to clear previous news articles", deleteError);
  }

  if (news.length > 0) {
    const insertPayload = news.map((item) => ({
      id: crypto.randomUUID(),
      brief_id: briefId,
      headline: item.headline,
      summary: item.summary,
      category: item.category,
      source: item.source,
      url: item.url,
      published_at: item.publishedAt,
    }));

    const { error: insertError } = await supabaseClient
      .from("news_articles")
      .insert(insertPayload);

    if (insertError) {
      console.error("Failed to store generated news articles", insertError);
      return null;
    }
  }

  return briefId;
}

function isCachedBriefStale(cached: { morningBrief: MorningBrief; news: NewsItem[] }): boolean {
  const hasNoNews = !Array.isArray(cached.news) || cached.news.length === 0;
  const overviewText = typeof cached.morningBrief.overview === "string" ? cached.morningBrief.overview.toLowerCase() : "";
  const isFallbackOverview = overviewText.includes("inga nyheter");

  return hasNoNews || isFallbackOverview;
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
