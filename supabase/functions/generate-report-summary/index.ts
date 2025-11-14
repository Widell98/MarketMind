import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GenerateReportSummaryPayload = {
  company_name: string;
  report_title?: string | null;
  source_url?: string | null;
  source_content?: string | null;
  source_type?: "text" | "url";
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const extractJsonPayload = (content: string): string => {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
};

const normalizeKeyPoints = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|•|-/)
      .map((item) => item.replace(/^\s*[-•]\s*/, "").trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const truncateContent = (content: string, limit = 7000) => {
  if (content.length <= limit) {
    return content;
  }

  return `${content.slice(0, limit)}...`; // Append ellipsis to indicate truncation
};

const buildPrompt = (
  companyName: string,
  reportTitle: string,
  reportContent: string,
  sourceUrl?: string | null,
) => `Du är en erfaren finansanalytiker som sammanfattar rapporter.

Skapa en svensk rapportanalys för bolaget "${companyName}" baserad på underlaget nedan.

Fokusera på att:
- ge en kort bakgrund till rapporten
- lyfta fram de viktigaste drivkrafterna, siffrorna och riskerna
- avsluta med en tydlig slutsats för investerare

Returnera svaret som giltig JSON med följande struktur:
{
  "summary": "3-4 meningar som sammanfattar rapporten",
  "key_points": ["kort punkt"],
  "tone": "kort beskrivning av analysens ton"
}

Underlag (${sourceUrl ? `från ${sourceUrl}` : "inklistrad text"}):
"""
${reportContent}
"""`;

const parseOpenAIResponse = (content: string) => {
  const normalized = extractJsonPayload(content);
  try {
    return JSON.parse(normalized);
  } catch (initialError) {
    try {
      const repaired = jsonrepair(normalized);
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error("Failed to parse OpenAI response", {
        normalized,
        initialError,
        repairError,
      });
      throw new Error("OpenAI-svaret gick inte att tolka");
    }
  }
};

const fetchSourceContent = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      console.warn("Failed to fetch source URL", { status: response.status, url });
      return null;
    }

    const text = await response.text();
    return text.trim() ? text : null;
  } catch (error) {
    console.warn("Error fetching source URL", { url, error });
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: GenerateReportSummaryPayload | null = null;

  try {
    payload = (await req.json()) as GenerateReportSummaryPayload;
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return new Response(JSON.stringify({ success: false, error: "Ogiltig förfrågan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const companyName = payload?.company_name?.trim();
  const reportTitle = payload?.report_title?.trim();
  const sourceUrl = payload?.source_url?.trim() || null;
  let sourceContent = payload?.source_content?.trim() || null;

  if (!companyName) {
    return new Response(JSON.stringify({ success: false, error: "company_name krävs" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!sourceContent && sourceUrl) {
    sourceContent = await fetchSourceContent(sourceUrl);
  }

  if (!sourceContent) {
    return new Response(JSON.stringify({ success: false, error: "Ingen rapporttext tillgänglig" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return new Response(JSON.stringify({ success: false, error: "AI-konfiguration saknas" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const prompt = buildPrompt(companyName, reportTitle ?? `${companyName} rapport`, truncateContent(sourceContent), sourceUrl);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: "Du är en erfaren finansanalytiker som levererar koncisa rapportanalyser på svenska och svarar alltid med giltig JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error", { status: response.status, errorText });
      return new Response(JSON.stringify({ success: false, error: "AI-modellen kunde inte generera en rapport" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("OpenAI response missing content", data);
      return new Response(JSON.stringify({ success: false, error: "AI-svaret saknade innehåll" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseOpenAIResponse(content);
    const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
    const keyPoints = normalizeKeyPoints(parsed?.key_points);

    if (!summary) {
      return new Response(JSON.stringify({ success: false, error: "Sammanfattningen kunde inte skapas" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = {
      id: crypto.randomUUID(),
      companyName,
      reportTitle: reportTitle ?? `${companyName} rapport`,
      summary,
      keyPoints,
      sourceUrl,
      sourceType: payload?.source_type ?? (sourceUrl ? "url" : "text"),
      createdAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to generate report summary", error);
    return new Response(JSON.stringify({ success: false, error: "Internt fel vid generering" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
