import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Din publicerade CSV-URL
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvOPfg5tZjaFqCu7b3Li80oPEEuje4tQTcnr6XjxCW_ItVbOGWCvfQfFvWDXRH544MkBKeI1dPyzJG/pub?output=csv";

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();

    // Splitta rader och kolumner
    const [headerLine, ...lines] = csvText.split("\n").filter((l) => l.trim() !== "");
    const headers = headerLine.split(",").map((h) => h.trim());

    const companyIdx = headers.findIndex((h) => /company/i.test(h));
    const tickerIdx = headers.findIndex((h) => /ticker/i.test(h));
    const simpleTickerIdx = headers.findIndex((h) => /simple\s*ticker/i.test(h));
    const currencyIdx = headers.findIndex((h) => /currency/i.test(h));
    const priceIdx = headers.findIndex((h) => /price/i.test(h));

    if (companyIdx === -1 || tickerIdx === -1 || priceIdx === -1) {
      throw new Error("CSV saknar nödvändiga kolumner (Company, Ticker, Price).");
    }

    const tickerMap = new Map<
      string,
      { name: string; symbol: string; currency: string | null; price: number | null }
    >();

    for (const line of lines) {
      const cols = line.split(",").map((c) => c.trim());
      if (cols.length <= priceIdx) continue;

      const rawName = normalizeValue(cols[companyIdx]);
      const rawTicker = normalizeValue(cols[tickerIdx]);
      const rawSimpleTicker =
        simpleTickerIdx !== -1 ? normalizeValue(cols[simpleTickerIdx]) : null;
      const rawCurrency =
        currencyIdx !== -1 ? normalizeValue(cols[currencyIdx]) : null;
      const rawPrice = normalizeValue(cols[priceIdx]);

      const baseSymbol = rawSimpleTicker ?? rawTicker;
      if (!baseSymbol || !rawPrice) continue;

      let cleanedSymbol: string;
      if (rawSimpleTicker) {
        cleanedSymbol = rawSimpleTicker.toUpperCase();
      } else {
        // Ta bort ev. "STO:" prefix
        cleanedSymbol = rawTicker!.includes(":")
          ? rawTicker!.split(":")[1].toUpperCase()
          : rawTicker!.toUpperCase();
      }

      const price = parseFloat(rawPrice.replace(/\s/g, "").replace(",", "."));
      if (isNaN(price)) continue;

      tickerMap.set(cleanedSymbol, {
        symbol: cleanedSymbol,
        name: rawName ?? cleanedSymbol,
        currency: rawCurrency ?? null,
        price,
      });
    }

    const tickers = Array.from(tickerMap.values());

    console.log("Antal tickers:", tickers.length);

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
