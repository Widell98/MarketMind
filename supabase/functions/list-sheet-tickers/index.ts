import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Din publicerade CSV-URL
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?gid=2130484499&single=true&output=csv";

const normalizeValue = (value: string | null | undefined) => {
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

    // Använd stdlib CSV-parsern
    const rawRows = parse(csvText, {
      skipFirstRow: false,
      columns: false,
    }) as string[][];

    if (!rawRows.length) throw new Error("CSV saknar rader.");

    const headers = rawRows[0].map((h) =>
      typeof h === "string" ? h.trim() : String(h).trim()
    );
    const dataRows = rawRows.slice(1);

    console.log("=== DEBUG START ===");
    console.log("Antal rader i rå CSV:", rawRows.length);
    console.log("Headers:", headers);
    console.log("Exempel rad 1:", dataRows[0]);
    console.log("Exempel rad 200:", dataRows[199]);
    console.log("Exempel rad sista:", dataRows[dataRows.length - 1]);

    const companyIdx = headers.findIndex((h) => /company/i.test(h));
    const simpleTickerIdx = headers.findIndex((h) =>
      /simple\s*ticker/i.test(h)
    );
    const tickerIdx = headers.findIndex((h) =>
      /ticker/i.test(h) && !/simple/i.test(h)
    );
    const currencyIdx = headers.findIndex((h) =>
      /(currency|valuta)/i.test(h)
    );
    const priceIdx = headers.findIndex((h) =>
      /(price|senast|last)/i.test(h)
    );

    if (tickerIdx === -1 && simpleTickerIdx === -1) {
      throw new Error("CSV saknar nödvändiga kolumner (Ticker eller Simpel Ticker).");
    }

    const tickerMap = new Map<string, any>();

    let skippedNoSymbol = 0;
    let skippedNoPrice = 0;

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const cols = row.map((c) =>
        typeof c === "string" ? c.trim() : String(c).trim()
      );

      const rawName = normalizeValue(
        companyIdx !== -1 ? cols[companyIdx] : null,
      );
      const rawSimpleSymbol = simpleTickerIdx !== -1
        ? normalizeValue(cols[simpleTickerIdx])
        : null;
      const rawSymbol = tickerIdx !== -1
        ? normalizeValue(cols[tickerIdx])
        : null;
      const rawCurrency = currencyIdx !== -1
        ? normalizeValue(cols[currencyIdx])
        : null;
      const rawPrice = priceIdx !== -1
        ? normalizeValue(cols[priceIdx])
        : null;

      const selectedSymbol = rawSimpleSymbol ?? rawSymbol;
      if (!selectedSymbol) {
        skippedNoSymbol++;
        continue;
      }

      const cleanedSymbol = selectedSymbol.includes(":")
        ? selectedSymbol.split(":").pop()!.toUpperCase()
        : selectedSymbol.toUpperCase();

      const price = rawPrice
        ? parseFloat(rawPrice.replace(/\s/g, "").replace(",", "."))
        : null;

      if (rawPrice === null) {
        skippedNoPrice++;
      }

      tickerMap.set(cleanedSymbol, {
        symbol: cleanedSymbol,
        name: rawName ?? cleanedSymbol,
        currency: rawCurrency ?? null,
        price,
      });
    }

    const tickers = Array.from(tickerMap.values());

    console.log("Antal tickers byggda:", tickers.length);
    console.log("Första 5 tickers:", tickers.slice(0, 5));
    console.log("Sista 5 tickers:", tickers.slice(-5));
    console.log("Skippade rader utan symbol:", skippedNoSymbol);
    console.log("Rader som saknade pris:", skippedNoPrice);
    console.log("=== DEBUG END ===");

    return new Response(
      JSON.stringify({ success: true, tickers }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Sheet parsing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
