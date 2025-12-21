import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UpdateReportSummaryPayload = {
  id?: string;
  report_title?: string;
  company_name?: string;
  summary?: string;
  key_points?: string[];
  key_metrics?: Array<{
    label?: string;
    value?: string;
    trend?: string | null;
    beatPercent?: number | null;
  }>;
  ceo_commentary?: string | null;
  source_url?: string | null;
  company_logo_url?: string | null;
};

type DiscoverReportSummaryRow = {
  id: string;
  company_name: string;
  report_title: string;
  summary: string;
  company_logo_url: string | null;
  key_points: unknown;
  key_metrics: unknown;
  ceo_commentary: string | null;
  created_at: string;
  source_type: string | null;
  source_url: string | null;
  source_document_name: string | null;
  source_document_id: string | null;
};

type GeneratedReportResponse = {
  id: string;
  companyName: string;
  reportTitle: string;
  companyLogoUrl?: string | null;
  summary: string;
  keyPoints: string[];
  keyMetrics: Array<{
    label: string;
    value: string;
    trend?: string;
    beatPercent?: number | null;
  }>;
  ceoCommentary?: string;
  createdAt: string;
  sourceUrl?: string | null;
  sourceType?: "text" | "url" | "document";
  sourceDocumentName?: string | null;
  sourceDocumentId?: string | null;
};

const normalizeKeyPointsInput = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const normalizeKeyMetricsInput = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as Array<{ label: string; value: string; trend?: string; beatPercent?: number | null }>;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const metric = entry as Record<string, unknown>;
      const label = typeof metric.label === "string" ? metric.label.trim() : "";
      const metricValue = typeof metric.value === "string" ? metric.value.trim() : "";
      const trendValue = typeof metric.trend === "string" ? metric.trend.trim() : "";
      const beatPercentValue = typeof metric.beatPercent === "number" 
        ? metric.beatPercent 
        : (typeof metric.beatPercent === "string" && metric.beatPercent.trim() 
          ? parseFloat(metric.beatPercent.trim()) 
          : null);
      const beatPercent = beatPercentValue !== null && !isNaN(beatPercentValue) ? beatPercentValue : null;

      if (!label && !metricValue && !trendValue && beatPercent === null) {
        return null;
      }

      return {
        label: label || "Nyckeltal",
        value: metricValue || (label ? "" : "Saknas"),
        trend: trendValue || undefined,
        beatPercent: beatPercent,
      };
    })
    .filter((metric): metric is { label: string; value: string; trend?: string; beatPercent?: number | null } => !!metric);
};

const normalizeKeyPointsFromRow = (value: unknown): string[] => {
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

const normalizeKeyMetricsFromRow = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as GeneratedReportResponse["keyMetrics"];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const metric = entry as Record<string, unknown>;
      const label = typeof metric.label === "string"
        ? metric.label.trim()
        : typeof metric.metric === "string"
          ? metric.metric.trim()
          : "";
      const metricValue = typeof metric.value === "string" ? metric.value.trim() : "";
      const trendValue = typeof metric.trend === "string"
        ? metric.trend.trim()
        : typeof metric.description === "string"
          ? metric.description.trim()
          : "";
      const beatPercentValue = typeof metric.beatPercent === "number"
        ? metric.beatPercent
        : (typeof metric.beatPercent === "string" && metric.beatPercent.trim()
          ? parseFloat(metric.beatPercent.trim())
          : null);
      const beatPercent = beatPercentValue !== null && !isNaN(beatPercentValue) ? beatPercentValue : null;

      if (!label && !metricValue && !trendValue && beatPercent === null) {
        return null;
      }

      return {
        label: label || "Nyckeltal",
        value: metricValue || (label ? "" : "Saknas"),
        trend: trendValue || undefined,
        beatPercent: beatPercent,
      };
    })
    .filter((metric): metric is GeneratedReportResponse["keyMetrics"][number] => !!metric);
};

const mapRowToGeneratedReport = (row: DiscoverReportSummaryRow): GeneratedReportResponse => ({
  id: row.id,
  companyName: row.company_name,
  reportTitle: row.report_title,
  companyLogoUrl: row.company_logo_url ?? undefined,
  summary: row.summary,
  keyPoints: normalizeKeyPointsFromRow(row.key_points),
  keyMetrics: normalizeKeyMetricsFromRow(row.key_metrics),
  ceoCommentary: row.ceo_commentary ?? undefined,
  createdAt: row.created_at,
  sourceUrl: row.source_url,
  sourceType: (row.source_type as GeneratedReportResponse["sourceType"]) ?? undefined,
  sourceDocumentName: row.source_document_name,
  sourceDocumentId: row.source_document_id,
});

const createServiceRoleClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration for update-report-summary");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as UpdateReportSummaryPayload;

    if (!payload?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Saknar rapport-id att uppdatera." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabase = createServiceRoleClient();

    if (!supabase) {
      return new Response(
        JSON.stringify({ success: false, error: "Servern saknar Supabase-konfiguration." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const updates: Record<string, unknown> = {};

    if (payload.report_title !== undefined) {
      updates.report_title = payload.report_title.trim();
    }

    if (payload.company_name !== undefined) {
      updates.company_name = payload.company_name.trim();
    }

    if (payload.summary !== undefined) {
      updates.summary = payload.summary.trim();
    }

    if (payload.key_points !== undefined) {
      updates.key_points = normalizeKeyPointsInput(payload.key_points);
    }

    if (payload.key_metrics !== undefined) {
      updates.key_metrics = normalizeKeyMetricsInput(payload.key_metrics);
    }

    if (payload.ceo_commentary !== undefined) {
      const commentary = payload.ceo_commentary?.toString().trim();
      updates.ceo_commentary = commentary && commentary.length > 0 ? commentary : null;
    }

    if (payload.source_url !== undefined) {
      const sourceUrl = payload.source_url?.toString().trim();
      updates.source_url = sourceUrl && sourceUrl.length > 0 ? sourceUrl : null;
    }

    if (payload.company_logo_url !== undefined) {
      const logoUrl = payload.company_logo_url?.toString().trim();
      updates.company_logo_url = logoUrl && logoUrl.length > 0 ? logoUrl : null;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Inga fält angavs för uppdatering." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data, error } = await supabase
      .from("discover_report_summaries")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, company_name, report_title, summary, key_points, key_metrics, ceo_commentary, created_at, source_type, source_url, source_document_name, source_document_id, company_logo_url",
      )
      .single();

    if (error || !data) {
      console.error("Failed to update discover report summary", error);
      return new Response(
        JSON.stringify({ success: false, error: "Kunde inte uppdatera rapporten." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, report: mapRowToGeneratedReport(data as DiscoverReportSummaryRow) }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    console.error("Unexpected error updating report summary", error);
    return new Response(
      JSON.stringify({ success: false, error: "Ett oväntat fel uppstod." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
