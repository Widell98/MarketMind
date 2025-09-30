import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

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

    const parsedCsv = await parse(csvText, { skipFirstRow: false });
    if (!Array.isArray(parsedCsv) || parsedCsv.length === 0) {
      throw new Error("CSV saknar data.");
    }

    const stringifyCell = (cell: unknown) => (cell ?? "").toString();
    const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim();

    let headerPairs: Array<{ raw: string; normalized: string }> = [];
    let dataRows: string[][] = [];

    const firstRow = parsedCsv[0];
    if (Array.isArray(firstRow)) {
      const table = (parsedCsv as unknown[][]).map((row) => row.map(stringifyCell));
      const [headerRow, ...rows] = table;
      headerPairs = headerRow.map((header) => ({ raw: header, normalized: normalizeHeader(header) }));
      dataRows = rows;
    } else if (firstRow && typeof firstRow === "object") {
      const records = parsedCsv as Record<string, unknown>[];
      const keys = Object.keys(firstRow as Record<string, unknown>);
      headerPairs = keys.map((key) => ({ raw: key, normalized: normalizeHeader(key) }));
      dataRows = records.map((record) => headerPairs.map(({ raw }) => stringifyCell(record[raw])));
    } else {
      throw new Error("CSV-formatet känns inte igen.");
    }

    const headers = headerPairs.map(({ normalized }) => normalized);

    const companyIdx = headers.findIndex((h) => /company/i.test(h));
    const simpleTickerIdx = headers.findIndex((h) => /simple\s*ticker/i.test(h));
    const tickerIdx = headers.findIndex((h, idx) => /ticker/i.test(h) && idx !== simpleTickerIdx);
    const currencyIdx = headers.findIndex((h) => /currency/i.test(h));
    const priceIdx = headers.findIndex((h) => /price/i.test(h));

    if (companyIdx === -1 || priceIdx === -1 || (tickerIdx === -1 && simpleTickerIdx === -1)) {
      throw new Error("CSV saknar nödvändiga kolumner (Company, Ticker/Simpel Ticker, Price).");
    }

    const tickerMap = new Map<
      string,
      { name: string; symbol: string; currency: string | null; price: number | null }
    >();

    const relevantIndices = [companyIdx, simpleTickerIdx, tickerIdx, currencyIdx, priceIdx].filter(
      (idx) => idx !== -1,
    );
    const maxRequiredIdx = relevantIndices.length > 0 ? Math.max(...relevantIndices) : -1;

    const parsePrice = (value: string | null) => {
      if (!value) return null;

      const normalized = value.replace(/\s/g, "").replace(",", ".");
      const parsed = parseFloat(normalized);

      return Number.isFinite(parsed) ? parsed : null;
    };

    for (const cols of dataRows) {
      if (!Array.isArray(cols)) continue;
      if (maxRequiredIdx >= 0 && cols.length <= maxRequiredIdx) continue;

      const rawName = companyIdx !== -1 ? normalizeValue(cols[companyIdx]) : null;
      const rawTicker = tickerIdx !== -1 ? normalizeValue(cols[tickerIdx]) : null;
      const rawSimpleTicker =
        simpleTickerIdx !== -1 ? normalizeValue(cols[simpleTickerIdx]) : null;
      const rawCurrency =
        currencyIdx !== -1 ? normalizeValue(cols[currencyIdx]) : null;
      const rawPrice = priceIdx !== -1 ? normalizeValue(cols[priceIdx]) : null;

      const baseSymbol = rawSimpleTicker ?? rawTicker;
      if (!baseSymbol) continue;

      let cleanedSymbol: string;
      if (rawSimpleTicker) {
        cleanedSymbol = rawSimpleTicker.toUpperCase();
      } else {
        // Ta bort ev. "STO:" prefix
        const tickerValue = rawTicker ?? "";
        const stripped = tickerValue.includes(":")
          ? tickerValue
              .split(":")
              .map((part) => part.trim())
              .filter((part) => part.length > 0)
              .pop()
          : tickerValue;
        cleanedSymbol = (stripped ?? tickerValue).toUpperCase();
      }

      const price = parsePrice(rawPrice);

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
