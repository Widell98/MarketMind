import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeleteReportSummaryPayload = {
  id?: string;
};

const createServiceRoleClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration for delete-report-summary");
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
    const payload = (await req.json()) as DeleteReportSummaryPayload;

    if (!payload?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Saknar rapport-id att ta bort." }),
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

    const { error } = await supabase
      .from("discover_report_summaries")
      .delete()
      .eq("id", payload.id);

    if (error) {
      console.error("Failed to delete discover report summary", error);
      return new Response(
        JSON.stringify({ success: false, error: "Kunde inte ta bort rapporten." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    console.error("Unexpected error deleting report summary", error);
    return new Response(
      JSON.stringify({ success: false, error: "Ett oväntat fel uppstod." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
