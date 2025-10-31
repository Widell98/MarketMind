import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchYahooFunds } from "../_shared/fund-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let query = "";

    if (req.method === "POST") {
      const payload = await req.json().catch(() => null);
      if (payload && typeof payload.query === "string") {
        query = payload.query;
      }
    } else {
      const url = new URL(req.url);
      query = url.searchParams.get("query") ?? "";
    }

    query = query.trim();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const funds = await searchYahooFunds(query);

    return new Response(
      JSON.stringify({ success: true, source: "yahoo_funds", funds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("list-funds error", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
