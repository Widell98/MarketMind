import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// === Hjälpfunktion för normalisering ===
const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// === Din publicerade Google Sheets som CSV ===
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvOPfg5tZjaFqCu7b3Li80oPEEuje4tQTcnr6XjxCW_ItVbOGWCvfQfFvWDXRH544MkBKeI1dPyzJG/pub?output=csv";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Hämta CSV-data från Google Sheets
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();

    // Parsning av CSV till rader
    const rows = csvText
      .split("\n")
      .map((r) => r.split(",").map((c) => c.trim()))
      .filter((r) => r.length >= 2); // Minst två kolumner (namn, symbol)

    const tickerMap = new Map<string, { name: string | null; symbol: string }>();

    for (const row of rows) {
      const [rawName, rawSymbol] = row;
      const normalizedSymbol = normalizeValue(rawSymbol)?.toUpperCase();
      if (!normalizedSymbol) continue;

      const normalizedName = normalizeValue(rawName);
      tickerMap.set(normalizedSymbol, {
        symbol: normalizedSymbol,
        name: normalizedName ?? null,
      });
    }

    const tickers = Array.from(tickerMap.values()).map(({ symbol, name }) => ({
      symbol,
      name: name ?? symbol,
    }));

    return new Response(JSON.stringify({ success: true, tickers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sheet ticker listing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
