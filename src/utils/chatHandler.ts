import OpenAI from "openai";

type MarketAuxArticle = {
  uuid: string;
  title: string;
  published_at: string;
  url?: string;
  summary?: string;
};

type ChatHandlerResult = {
  answer: string;
  sources?: {
    title: string;
    url?: string;
    published_at: string;
  }[];
};

const KEYWORDS = [
  "nyhet",
  "rapport",
  "earning",
  "resultat",
  "rapporten",
  "analys",
];

const KNOWN_TICKERS: Record<string, string> = {
  tesla: "TSLA",
  apple: "AAPL",
  microsoft: "MSFT",
  google: "GOOGL",
  alphabet: "GOOGL",
  amazon: "AMZN",
  nvidia: "NVDA",
  meta: "META",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const marketauxBaseUrl = "https://api.marketaux.com/v1/news/all";

function shouldTriggerSearch(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return KEYWORDS.some((keyword) => lower.includes(keyword)) || hasTicker(userMessage);
}

function hasTicker(userMessage: string): boolean {
  return Boolean(userMessage.match(/\b[A-Z]{1,5}\b/));
}

function extractTicker(userMessage: string): string | undefined {
  const lower = userMessage.toLowerCase();
  for (const [name, ticker] of Object.entries(KNOWN_TICKERS)) {
    if (lower.includes(name)) {
      return ticker;
    }
  }

  const match = userMessage.match(/\b[A-Z]{1,5}\b/);
  return match?.[0];
}

async function fetchMarketAuxArticles(ticker: string): Promise<MarketAuxArticle[]> {
  if (!process.env.MARKETAUX_KEY) {
    throw new Error("MARKETAUX_KEY is not set");
  }

  const url = new URL(marketauxBaseUrl);
  url.searchParams.set("symbols", ticker);
  url.searchParams.set("filter_entities", "true");
  url.searchParams.set("language", "en");
  url.searchParams.set("api_token", process.env.MARKETAUX_KEY);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MarketAux request failed with status ${response.status}`);
  }

  const payload: { data?: MarketAuxArticle[] } = await response.json();
  const articles = payload.data ?? [];

  return articles
    .filter((article) => article.title && article.published_at)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 3);
}

function buildArticlesContext(articles: MarketAuxArticle[]): string {
  if (articles.length === 0) {
    return "Inga relevanta artiklar hittades.";
  }

  return articles
    .map((article, index) => {
      const lines = [
        `Artikel ${index + 1}: ${article.title}`,
        `Publicerad: ${article.published_at}`,
      ];

      if (article.summary) {
        lines.push(`Sammanfattning: ${article.summary}`);
      }

      if (article.url) {
        lines.push(`Länk: ${article.url}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

async function askOpenAI(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Du är en hjälpsam finansiell assistent som svarar koncist och på svenska. Använd den tillhandahållna källan om sådan finns.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("Inget svar returnerades från GPT-4o");
  }

  return answer;
}

export async function chatHandler(userMessage: string): Promise<ChatHandlerResult> {
  if (!userMessage.trim()) {
    return { answer: "Jag behöver en fråga för att kunna hjälpa dig." };
  }

  const shouldSearch = shouldTriggerSearch(userMessage);

  if (!shouldSearch) {
    const answer = await askOpenAI(userMessage);
    return { answer };
  }

  const ticker = extractTicker(userMessage);

  if (!ticker) {
    const answer = await askOpenAI(
      `${userMessage}\n\nNotera: Användaren frågade efter nyheter eller rapporter men inget specifikt bolag upptäcktes.`,
    );
    return { answer };
  }

  try {
    const articles = await fetchMarketAuxArticles(ticker);

    if (articles.length === 0) {
      const answer = await askOpenAI(
        `${userMessage}\n\nDet fanns inga aktuella MarketAux-artiklar för symbolen ${ticker}. Förklara detta för användaren och föreslå alternativ.`,
      );
      return { answer };
    }

    const context = buildArticlesContext(articles);
    const prompt = `Användarens fråga: ${userMessage}\n\nDATAKÄLLA:\n${context}\n\nSammanfatta svaret på svenska och lyft fram de viktigaste punkterna.`;
    const answer = await askOpenAI(prompt);

    return {
      answer,
      sources: articles.map((article) => ({
        title: article.title,
        url: article.url,
        published_at: article.published_at,
      })),
    };
  } catch (error) {
    const answer = await askOpenAI(
      `${userMessage}\n\nMarketAux-sökningen misslyckades (fel: ${(error as Error).message}). Be om ursäkt och förklara att du inte kunde hämta färska data men erbjud en generell analys om möjligt.`,
    );
    return { answer };
  }
}

export type { ChatHandlerResult };
