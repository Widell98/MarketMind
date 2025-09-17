import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  cleanSheetSymbol,
  findHeaderIndex,
  normalizeValue,
  parseCsv,
  parsePrice,
} from "../_shared/sheet-utils.ts";

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

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      throw new Error("CSV saknar data.");
    }

    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map((cell) => normalizeValue(cell) ?? cell ?? "");

    const companyIdx = findHeaderIndex(headers, "company", "name", "bolag", "företag");
    const tickerIdx = findHeaderIndex(headers, "ticker", "symbol");
    const currencyIdx = findHeaderIndex(headers, "currency", "valuta");
    const priceIdx = findHeaderIndex(headers, "price", "pris", "last price", "senaste pris");

    if (tickerIdx === -1 || priceIdx === -1) {
      throw new Error("CSV saknar nödvändiga kolumner (Ticker, Price).");
    }

    const tickerMap = new Map<
      string,
      { name: string; symbol: string; currency: string | null; price: number }
    >();

    const getColumnValue = (row: string[], idx: number) =>
      idx >= 0 && idx < row.length ? normalizeValue(row[idx]) : null;

    for (const row of dataRows) {
      if (!row || row.length <= Math.max(tickerIdx, priceIdx)) continue;

      const rawSymbol = getColumnValue(row, tickerIdx);
      const cleanedSymbol = cleanSheetSymbol(rawSymbol);
      if (!cleanedSymbol) continue;

      const price = parsePrice(getColumnValue(row, priceIdx));
      if (price === null || !Number.isFinite(price) || price <= 0) continue;

      const rawName = companyIdx >= 0 ? getColumnValue(row, companyIdx) : null;
      const rawCurrency = currencyIdx >= 0 ? getColumnValue(row, currencyIdx) : null;

      tickerMap.set(cleanedSymbol, {
        symbol: cleanedSymbol,
        name: rawName ?? cleanedSymbol,
        currency: rawCurrency ? rawCurrency.toUpperCase() : null,
        price,
      });
    }

    const tickers = Array.from(tickerMap.values());

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
