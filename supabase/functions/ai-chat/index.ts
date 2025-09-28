import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MarketAuxArticle = {
  symbol: string;
  headline: string;
  summary: string;
  url?: string | null;
  published_at: string;
};

type ChatRequestBody = {
  userMessage?: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  sessionSymbol?: string | null;
};

type ChatResponseBody = {
  answer: string;
  sources?: { title: string; url?: string | null; published_at: string }[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANY_TICKER_MAP: Record<string, string> = {
  tesla: "TSLA",
  "tesla, inc": "TSLA",
  spacex: "TSLA",
  amazon: "AMZN",
  "amazon.com": "AMZN",
  microsoft: "MSFT",
  "microsoft corp": "MSFT",
  apple: "AAPL",
  "apple inc": "AAPL",
  google: "GOOGL",
  alphabet: "GOOGL",
  meta: "META",
  "facebook": "META",
  netflix: "NFLX",
  nvidia: "NVDA",
  "berkshire": "BRK.A",
  "berkshire hathaway": "BRK.A",
  "jp morgan": "JPM",
  "jpmorgan": "JPM",
  "bank of america": "BAC",
  "intel": "INTC",
  "adobe": "ADBE",
  "salesforce": "CRM",
  "oracle": "ORCL",
  "paypal": "PYPL",
  "shopify": "SHOP",
  "spotify": "SPOT",
  "volvo": "VOLV-B",
  "ericsson": "ERIC",
};

const KNOWN_TICKERS = new Set<string>(Object.values(COMPANY_TICKER_MAP));

const DEFAULT_SYSTEM_PROMPT =
  "Du är en hjälpsam finansassistent som svarar koncist på svenska och hjälper användare förstå marknaden.";

const buildNewsContext = (articles: MarketAuxArticle[]): string => {
  if (!articles.length) {
    return "";
  }

  const symbol = articles[0]?.symbol ?? "";
  const lines = articles
    .slice(0, 3)
    .map((article) => {
      const datePart = article.published_at ? article.published_at.slice(0, 10) : "Okänt datum";
      const summaryText = article.summary?.replace(/\s+/g, " ").trim() ?? "";
      const truncatedSummary = summaryText
        ? ` — ${summaryText.length > 220 ? `${summaryText.slice(0, 217)}…` : summaryText}`
        : "";
      return `- [${datePart}] ${article.headline}${truncatedSummary}`;
    })
    .join("\n");

  return `---\nLatest News for ${symbol}:\n${lines}\n---`;
};

const detectSymbols = (message: string, sessionSymbol?: string | null): string[] => {
  const detected = new Set<string>();

  if (sessionSymbol) {
    detected.add(sessionSymbol.toUpperCase());
  }

  const lowerMessage = message.toLowerCase();
  for (const [name, ticker] of Object.entries(COMPANY_TICKER_MAP)) {
    if (lowerMessage.includes(name)) {
      detected.add(ticker.toUpperCase());
    }
  }

  const potentialTickers = message
    .toUpperCase()
    .match(/\b[A-Z]{1,5}(?:\.[A-Z])?\b/g);

  if (potentialTickers) {
    for (const candidate of potentialTickers) {
      if (KNOWN_TICKERS.has(candidate)) {
        detected.add(candidate);
      }
    }
  }

  return Array.from(detected);
};

const fetchMarketAuxNews = async (symbol: string, apiKey: string): Promise<MarketAuxArticle[]> => {
  const url = new URL("https://api.marketaux.com/v1/news/all");
  url.searchParams.set("symbols", symbol);
  url.searchParams.set("filter_entities", "true");
  url.searchParams.set("language", "en");
  url.searchParams.set("api_token", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`MarketAux responded with status ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload?.data) ? payload.data : [];

  return items
    .map((item: Record<string, unknown>) => {
      const headline = typeof item.title === "string" ? item.title : typeof item.headline === "string" ? item.headline : "";
      const summary = typeof item.summary === "string"
        ? item.summary
        : typeof item.description === "string"
        ? item.description
        : "";
      const publishedAt = typeof item.published_at === "string"
        ? item.published_at
        : typeof item.publishedAt === "string"
        ? item.publishedAt
        : "";
      const url = typeof item.url === "string"
        ? item.url
        : typeof item.article_url === "string"
        ? item.article_url
        : typeof item.source_url === "string"
        ? item.source_url
        : null;

      if (!headline) {
        return null;
      }

      return {
        symbol,
        headline,
        summary,
        url,
        published_at: publishedAt,
      } as MarketAuxArticle;
    })
    .filter((article: MarketAuxArticle | null): article is MarketAuxArticle => Boolean(article));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ChatRequestBody = await req.json();
    const userMessage = body.userMessage?.trim();

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Missing userMessage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const symbols = detectSymbols(userMessage, body.sessionSymbol);

    let aggregatedContext = "";
    const newsSources: NonNullable<ChatResponseBody["sources"]> = [];

    if (symbols.length > 0) {
      const marketAuxKey = Deno.env.get("MARKETAUX_API_KEY");
      if (!marketAuxKey) {
        throw new Error("MarketAux API key not configured");
      }

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const articles = await fetchMarketAuxNews(symbol, marketAuxKey);
            return { symbol, articles };
          } catch (error) {
            console.error(`Failed to fetch MarketAux news for ${symbol}:`, error);
            return { symbol, articles: [] as MarketAuxArticle[] };
          }
        }),
      );

      const contexts = results
        .filter((result) => result.articles.length > 0)
        .map((result) => {
          const context = buildNewsContext(result.articles.map((article) => ({ ...article, symbol: result.symbol })));
          for (const article of result.articles.slice(0, 3)) {
            newsSources.push({
              title: article.headline,
              url: article.url ?? undefined,
              published_at: article.published_at,
            });
          }
          return context;
        })
        .filter(Boolean);

      aggregatedContext = contexts.join("\n\n");

      if (!aggregatedContext) {
        const fallbackSymbol = results[0]?.symbol ?? symbols[0];
        const responseBody: ChatResponseBody = {
          answer: `I couldn’t find any recent news about ${fallbackSymbol}.`,
        };
        return new Response(JSON.stringify(responseBody), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const systemMessageContent = aggregatedContext
      ? `${systemPrompt}\n\n${aggregatedContext}\n\nPrioritera att sammanfatta och analysera nyheterna ovan i svaret. Avsluta svaret med "Källa: MarketAux".`
      : systemPrompt;

    const messages: ChatMessage[] = [{ role: "system", content: systemMessageContent }];

    if (Array.isArray(body.history)) {
      for (const entry of body.history) {
        if (entry && typeof entry.role === "string" && typeof entry.content === "string") {
          messages.push({ role: entry.role, content: entry.content });
        }
      }
    }

    messages.push({ role: "user", content: userMessage });

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.4,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI API error", errorText);
      throw new Error(`OpenAI API error: ${openAiResponse.status}`);
    }

    const completion = await openAiResponse.json();
    const answer = completion?.choices?.[0]?.message?.content?.trim() ?? "";

    const responseBody: ChatResponseBody = {
      answer,
      sources: newsSources.length > 0 ? newsSources : undefined,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
