import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/csv/parse.ts";
import { buildTickersFromParsedCsv } from "./parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Din publicerade CSV-URL
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvOPfg5tZjaFqCu7b3Li80oPEEuje4tQTcnr6XjxCW_ItVbOGWCvfQfFvWDXRH544MkBKeI1dPyzJG/pub?output=csv";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();

    const rawRows = await parse(csvText);
    const rows = (Array.isArray(rawRows) ? rawRows : [])
      .filter((row): row is unknown[] => Array.isArray(row))
      .map((row) =>
        row.map((value) =>
          typeof value === "string"
            ? value
            : value === null || value === undefined
            ? undefined
            : String(value)
        )
      );

    if (rows.length === 0) {
      throw new Error("CSV-filen saknar innehåll.");
    }

    const [headerRow, ...dataRows] = rows;
    const { tickers, symbolCounts } = buildTickersFromParsedCsv(
      headerRow,
      dataRows,
    );

    for (const [symbol, occurrence] of symbolCounts.entries()) {
      if (occurrence > 1) {
        console.info(
          `Duplicate ticker symbol detected for ${symbol}; preserving occurrence #${occurrence}.`,
        );
      }
    }

    return new Response(JSON.stringify({ success: true, tickers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sheet parsing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

