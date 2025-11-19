import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.6.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GenerateReportSummaryPayload = {
  company_name?: string | null;
  report_title?: string | null;
  source_url?: string | null;
  source_content?: string | null;
  source_type?: "text" | "url" | "document";
  source_document_name?: string | null;
  source_document_id?: string | null;
  created_by?: string | null;
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

type ParsedMetric = {
  label: string;
  value: string;
  trend?: string;
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

const normalizeKeyMetrics = (value: unknown): ParsedMetric[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const trimmed = item.trim();
          if (!trimmed) {
            return null;
          }
          const [labelPart, ...valueParts] = trimmed.split(":");
          if (valueParts.length > 0) {
            return {
              label: labelPart.trim() || "Nyckeltal",
              value: valueParts.join(":").trim(),
            } as ParsedMetric;
          }
          return {
            label: "Nyckeltal",
            value: trimmed,
          } as ParsedMetric;
        }

        if (item && typeof item === "object") {
          const candidate = item as Record<string, unknown>;
          const label = typeof candidate.label === "string"
            ? candidate.label.trim()
            : typeof candidate.metric === "string"
              ? candidate.metric.trim()
              : "";
          const valueText = typeof candidate.value === "string"
            ? candidate.value.trim()
            : "";
          const trend = typeof candidate.trend === "string"
            ? candidate.trend.trim()
            : typeof candidate.description === "string"
              ? candidate.description.trim()
              : "";

          if (!label && !valueText && !trend) {
            return null;
          }

          return {
            label: label || "Nyckeltal",
            value: valueText || (label ? "" : "Saknas"),
            trend: trend || undefined,
          } as ParsedMetric;
        }

        return null;
      })
      .filter((metric): metric is ParsedMetric => !!metric && (!!metric.label || !!metric.value));
  }

  if (typeof value === "string" && value.trim()) {
    return [
      {
        label: "Nyckeltal",
        value: value.trim(),
      },
    ];
  }

  return [];
};

const truncateContent = (content: string, limit = 12000) => {
  if (content.length <= limit) {
    return content;
  }

  return `${content.slice(0, limit)}...`; // Append ellipsis to indicate truncation
};

const buildPrompt = (
  reportContent: string,
  sourceDescriptor: string,
  options: { companyHint?: string | null; reportTitleHint?: string | null } = {},
) => {
  const hints: string[] = [];

  if (options.companyHint) {
    hints.push(`Föreslaget bolagsnamn: ${options.companyHint}`);
  }

  if (options.reportTitleHint) {
    hints.push(`Föreslagen rapporttitel: ${options.reportTitleHint}`);
  }

  const hintsBlock = hints.length
    ? `Du kan använda följande ledtrådar om de verkar rimliga:\n${hints
        .map((hint) => `- ${hint}`)
        .join("\n")}\n\n`
    : "";

 const objectives = [
  "Genomför följande uppgifter baserat uteslutande på fakta i rapporttexten:",
  "",
  "1. Identifiera bolagsnamnet – exakt som det förekommer i dokumentet (använd inte tolkningar).",
  "2. Identifiera rapporttiteln – exakt enligt dokumentets rubrik eller formella titel.",
  "3. Formulera en kondenserad och faktadriven sammanfattning (3–4 meningar) som beskriver rapportens kärnbudskap utan tolkningar eller spekulation.",
  "4. Extrahera minst tre kvantitativa nyckelsiffror – etiketter och värden ska vara ordagranna från rapporten. Om rapporten anger förändringstal (t.ex. “+14% y/y”) ska detta placeras i fältet 'trend'.",
  "5. Identifiera 3–6 objektiva datapunkter som framgår tydligt i rapportens text, exempelvis trender, segmentprestationer eller väsentliga händelser.",
  "6. Sammanfatta VD-kommentaren i 1–2 meningar om en sådan sektion finns. Om ingen VD-kommentar förekommer ska värdet vara: \"Ingen VD-kommentar identifierad\".",
].join("\n");

   const importantNotes = [
  "VIKTIGA PRINCIPER:",
  "- Hitta aldrig på siffror, etiketter eller trender. Alla nyckeltal måste förekomma ordagrant i rapporten.",
  "- Gissa aldrig bolagsnamn eller rapporttitel. Om osäkerhet föreligger, använd exakt det som står tydligast i dokumentets inledning.",
  "- Tolkningar, slutsatser, rekommendationer eller spekulativa utsagor är inte tillåtna.",
  "- Om rapporten innehåller flera segment (exempelvis Retail, Automotive, Software), inkludera endast segmentdata om det uttryckligen anges.",
  "- Sammanfattningen ska vara kort, tydlig, neutral och lämpad för ett professionellt finansiellt gränssnitt.",
  "- All output måste vara strikt giltig JSON utan text före eller efter JSON-strukturen.",
].join("\n");

   const jsonFormat = [
  "RETURNERA ENDAST FÖLJANDE GILTIGA JSON-STRUKTUR:",
  "",
  "{",
  "  \"company_name\": \"...\",",
  "  \"report_title\": \"...\",",
  "  \"summary\": \"3–4 meningar som sammanfattar rapportens kärna.\",",
  "  \"key_metrics\": [",
  "    {",
  "      \"label\": \"etikett exakt som i rapporten\",",
  "      \"value\": \"värde exakt som i rapporten\",",
  "      \"trend\": \"t.ex. +14% y/y om det förekommer\"",
  "    }",
  "  ],",
  "  \"key_points\": [",
  "    \"kort objektiv datapunkt baserad på rapportens innehåll\"",
  "  ],",
  "  \"ceo_commentary\": \"1–2 meningar eller 'Ingen VD-kommentar identifierad'\"",
  "}",
  "",
  `UNDERLAG (${sourceDescriptor}):`,
  "\"\"\"",
  reportContent,
  "\"\"\"",
].join("\n");

    const promptSections = [
      "Du är en senior finansanalytiker som analyserar års- och kvartalsrapporter.",
      "Du svarar alltid med giltig JSON, aldrig text utanför JSON-strukturen.",
      "",
      hintsBlock ? `${hintsBlock}${objectives}`.trim() : objectives,
      "",
      importantNotes,
      "",
      jsonFormat,
    ];

    return promptSections.join("\n");
  };

const createServiceRoleClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration for report summaries");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const fetchDocumentContent = async (documentId: string) => {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return { content: null, documentName: null } as { content: string | null; documentName: string | null };
  }

  const { data: document, error: documentError } = await supabase
    .from("chat_documents")
    .select("id, name, status")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    console.warn("Failed to fetch chat document", { documentId, error: documentError });
    return { content: null, documentName: null };
  }

  if (document.status !== "processed") {
    console.warn("Document not processed", { documentId, status: document.status });
    return { content: null, documentName: document.name as string };
  }

  const { data: chunks, error: chunkError } = await supabase
    .from("chat_document_chunks")
    .select("content, chunk_index")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true })
    .limit(200);

  if (chunkError || !chunks || chunks.length === 0) {
    console.warn("No chunks found for document", { documentId, error: chunkError });
    return { content: null, documentName: document.name as string };
  }

  const combined = chunks
    .map((chunk) => chunk.content)
    .join("\n\n");

  return { content: combined, documentName: document.name as string };
};

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

  const companyHint = payload?.company_name?.trim() || null;
  const reportTitleHint = payload?.report_title?.trim() || null;
  const sourceUrl = payload?.source_url?.trim() || null;
  let sourceContent = payload?.source_content?.trim() || null;
  let resolvedDocumentName = payload?.source_document_name?.trim() || null;

  if (!sourceContent && sourceUrl) {
    sourceContent = await fetchSourceContent(sourceUrl);
  }

  if (!sourceContent && payload?.source_document_id) {
    const { content, documentName } = await fetchDocumentContent(payload.source_document_id);
    sourceContent = content;
    if (!resolvedDocumentName && documentName) {
      resolvedDocumentName = documentName;
    }
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

  const sourceDescriptor = sourceUrl
    ? `från ${sourceUrl}`
    : resolvedDocumentName
      ? `från dokumentet ${resolvedDocumentName}`
      : payload?.source_type === "document"
        ? "från det uppladdade dokumentet"
        : "inklistrad text";

  const prompt = buildPrompt(truncateContent(sourceContent), sourceDescriptor, {
    companyHint,
    reportTitleHint,
  });

  try {
 const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${openAIApiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-5-mini",
    max_output_tokens: 600,
    reasoning: {
      effort: "medium"   // bättre struktur, mindre hallucinationer
    },
    text: {
      verbosity: "medium" // bäst för JSON-output
    },
    input: [
      {
        role: "system",
        content:
          "Du är en erfaren finansanalytiker som levererar koncisa, professionella rapportsammanfattningar på svenska. Du returnerar alltid strikt giltig JSON utan någon text utanför JSON-strukturen."
      },
      {
        role: "user",
        content: prompt
      }
    ]
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

const data = await response.json();
const content = data.output_text;

    if (!content) {
      console.error("OpenAI response missing content", data);
      return new Response(JSON.stringify({ success: false, error: "AI-svaret saknade innehåll" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseOpenAIResponse(content);
    const parsedCompanyName = typeof parsed?.company_name === "string"
      ? parsed.company_name.trim()
      : "";
    const parsedReportTitle = typeof parsed?.report_title === "string"
      ? parsed.report_title.trim()
      : "";
    const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
    const keyPoints = normalizeKeyPoints(parsed?.key_points);
    const keyMetrics = normalizeKeyMetrics(parsed?.key_metrics);
    const ceoCommentary = typeof parsed?.ceo_commentary === "string"
      ? parsed.ceo_commentary.trim()
      : "";

    const companyName = parsedCompanyName || companyHint || "Okänt bolag";
    const reportTitle = parsedReportTitle || reportTitleHint || `${companyName} rapport`;

    if (!summary) {
      return new Response(JSON.stringify({ success: false, error: "Sammanfattningen kunde inte skapas" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceRoleClient();

    if (!supabase) {
      console.error("Supabase client missing for storing discover report summary");
      return new Response(JSON.stringify({ success: false, error: "Serverkonfiguration saknas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportId = crypto.randomUUID();
    const sourceType = payload?.source_type ?? (sourceUrl ? "url" : "text");

    const { data: insertedReport, error: insertError } = await supabase
      .from("discover_report_summaries")
      .insert({
        id: reportId,
        company_name: companyName,
        report_title: reportTitle,
        summary,
        key_points: keyPoints,
        key_metrics: keyMetrics,
        ceo_commentary: ceoCommentary || null,
        source_url: sourceUrl,
        source_type: sourceType,
        source_document_name: resolvedDocumentName,
        source_document_id: payload?.source_document_id ?? null,
        created_by: payload?.created_by ?? null,
      })
      .select()
      .single();

    if (insertError || !insertedReport) {
      console.error("Failed to store discover report summary", insertError);
      return new Response(JSON.stringify({ success: false, error: "Kunde inte spara rapporten" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseReport = {
      id: insertedReport.id,
      companyName: insertedReport.company_name,
      reportTitle: insertedReport.report_title,
      summary: insertedReport.summary,
      keyPoints: normalizeKeyPoints(insertedReport.key_points ?? keyPoints),
      keyMetrics: normalizeKeyMetrics(insertedReport.key_metrics ?? keyMetrics),
      ceoCommentary: insertedReport.ceo_commentary ?? undefined,
      createdAt: insertedReport.created_at,
      sourceUrl: insertedReport.source_url,
      sourceType: (insertedReport.source_type as "text" | "url" | "document" | null) ?? undefined,
      sourceDocumentName: insertedReport.source_document_name,
      sourceDocumentId: insertedReport.source_document_id,
    };

    return new Response(JSON.stringify({ success: true, report: responseReport }), {
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
