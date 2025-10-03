import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CSV_URL =
  Deno.env.get("SENTIMENT_CSV_URL") ||
  Deno.env.get("SHEET_CSV_URL") ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("SENTIMENT_OPENAI_MODEL") || "gpt-4o-mini";

interface SheetStockRow {
  symbol: string;
  name: string;
  change: number;
}

interface TavilySearchResult {
  title?: string;
  content?: string;
  snippet?: string;
  url?: string;
  published_date?: string;
}

interface TavilySearchResponse {
  answer?: string;
  results?: TavilySearchResult[];
}

interface SentimentInsight {
  symbol: string;
  name: string;
  change: string;
  summary: string;
  ai_insight: string;
  follow_up: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const results = await runDailySentimentCheck();

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily sentiment check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function runDailySentimentCheck(): Promise<SentimentInsight[]> {
  const stocks = await fetchSheetStocks();
  const movers = stocks.filter((stock) => Math.abs(stock.change) >= 10);

  if (movers.length === 0) {
    console.log("No significant movers found (±10%).");
    return [];
  }

  const insights: SentimentInsight[] = [];

  for (const stock of movers) {
    try {
      const newsItems = await fetchTavilyNews(stock);
      const aiInsight = await generateAiInsight(stock, newsItems);
      if (aiInsight) {
        insights.push({
          symbol: stock.symbol,
          name: stock.name,
          change: formatChange(stock.change),
          summary: aiInsight.summary,
          ai_insight: aiInsight.ai_insight,
          follow_up: aiInsight.follow_up,
        });
      }
    } catch (error) {
      console.error(`Failed to generate insight for ${stock.symbol}:`, error);
    }
  }

  return insights;
}

async function fetchSheetStocks(): Promise<SheetStockRow[]> {
  console.log("Fetching sheet data from", CSV_URL);
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV data: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const rows = parse(csvText, { skipFirstRow: false, columns: false }) as (string | null)[][];

  if (!rows.length) {
    throw new Error("CSV returned no rows");
  }

  const headers = rows[0].map((header) => (typeof header === "string" ? header.trim() : ""));
  const dataRows = rows.slice(1);

  const symbolIndex = headers.findIndex((h) => /simple\s*ticker/i.test(h) || (/ticker/i.test(h) && !/simple/i.test(h)));
  const companyIndex = headers.findIndex((h) => /(company|name)/i.test(h));
  const changeIndex = headers.findIndex((h) => /change\s*%/i.test(h));

  if (symbolIndex === -1 || changeIndex === -1) {
    throw new Error("CSV is missing required columns (Ticker and Change %)");
  }

  const stocks: SheetStockRow[] = [];

  for (const row of dataRows) {
    const symbolValue = normalizeValue(row[symbolIndex]);
    const changeValue = normalizeValue(row[changeIndex]);

    if (!symbolValue || !changeValue) continue;

    const parsedChange = parseChange(changeValue);
    if (parsedChange === null) continue;

    const nameValue = normalizeValue(companyIndex !== -1 ? row[companyIndex] : null) || symbolValue;

    stocks.push({
      symbol: cleanSymbol(symbolValue),
      name: nameValue,
      change: parsedChange,
    });
  }

  console.log(`Parsed ${stocks.length} stocks from sheet.`);
  return stocks;
}

function normalizeValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanSymbol(symbol: string): string {
  return symbol.includes(":") ? symbol.split(":").pop()!.toUpperCase() : symbol.toUpperCase();
}

function parseChange(value: string): number | null {
  const normalized = value.replace(/%/g, "").replace(/,/g, ".").replace(/\s+/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatChange(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

async function fetchTavilyNews(stock: SheetStockRow): Promise<TavilySearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY saknas – hoppar över nyhetssökning.");
    return [];
  }

  const query = `Latest financial news about ${stock.name} (${stock.symbol})`;
  console.log(`Fetching Tavily news for ${stock.symbol}: ${query}`);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tavily request failed for ${stock.symbol}:`, errorText);
      return [];
    }

    const data = (await response.json()) as TavilySearchResponse;
    const results = Array.isArray(data.results) ? data.results.slice(0, 5) : [];

    console.log(`Tavily returned ${results.length} results for ${stock.symbol}.`);
    return results;
  } catch (error) {
    console.error(`Tavily request threw for ${stock.symbol}:`, error);
    return [];
  }
}

async function generateAiInsight(
  stock: SheetStockRow,
  news: TavilySearchResult[],
): Promise<Pick<SentimentInsight, "summary" | "ai_insight" | "follow_up"> | null> {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY saknas – returnerar förenklad sammanfattning.");
    const shortNews = news.map((item) => item.title || item.snippet || item.content).filter(Boolean).slice(0, 3);
    const summary = shortNews.length > 0
      ? `Aktien rörde sig ${formatChange(stock.change)}. Möjliga orsaker: ${shortNews.join("; ")}.`
      : `Aktien rörde sig ${formatChange(stock.change)} men inga nyheter hittades.`;
    return {
      summary,
      ai_insight: "Ingen AI-analys tillgänglig utan OpenAI-nyckel.",
      follow_up: ["Verifiera rörelsen manuellt", "Uppdatera OpenAI API-nyckel för full funktionalitet"],
    };
  }

  const newsItems = news.slice(0, 5);
  const newsText = newsItems.length > 0
    ? newsItems.map((item, index) => {
      const title = item.title || `Nyhet ${index + 1}`;
      const snippet = item.content || item.snippet || "";
      const url = item.url ? `Källa: ${item.url}` : "";
      const published = item.published_date ? `(${item.published_date})` : "";
      const parts = [title];
      if (published) parts.push(published);
      if (snippet) parts.push(snippet);
      if (url) parts.push(url);
      return `- ${parts.filter(Boolean).join(" ")}`;
    }).join("\n")
    : "Inga relevanta nyheter hittades.";

  const userPrompt = [
    "Du är en finansiell analytiker.",
    `Aktien ${stock.name} (${stock.symbol}) rörde sig ${formatChange(stock.change)} idag.`,
    "Här är relevanta nyheter:",
    newsText,
    "",
    "- Sammanfatta vad som hände (kort).",
    "- Bedöm om marknadsreaktionen verkar rimlig eller en överreaktion.",
    "- Ge 1–2 konkreta uppföljningspunkter för investeraren.",
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: "Du är en finansiell analytiker." },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "daily_sentiment_summary",
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                ai_insight: { type: "string" },
                follow_up: {
                  type: "array",
                  minItems: 1,
                  maxItems: 3,
                  items: { type: "string" },
                },
              },
              required: ["summary", "ai_insight", "follow_up"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI request failed for ${stock.symbol}:`, errorText);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.error("OpenAI response missing content", data);
      return null;
    }

    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary,
      ai_insight: parsed.ai_insight,
      follow_up: Array.isArray(parsed.follow_up) ? parsed.follow_up : [],
    };
  } catch (error) {
    console.error(`OpenAI request threw for ${stock.symbol}:`, error);
    return null;
  }
}
