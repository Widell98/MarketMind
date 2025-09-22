import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSheetValues } from "../getSheetValues.ts";
import { inferListSheetColumns } from "../_shared/sheetStructure.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeHeader = (header: string) => header.trim().toLowerCase();

const findHeaderIndex = (headers: string[], patterns: RegExp[]) =>
  headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));

const resolveSheetStructure = (rows: string[][]) => {
  const headerRow = rows[0] ?? [];
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header));

  const companyIdx = findHeaderIndex(normalizedHeaders, [
    /company/,
    /bolag/,
    /name/,
    /namn/,
    /företag/,
    /issuer/,
  ]);
  const tickerIdx = findHeaderIndex(normalizedHeaders, [/ticker/, /symbol/, /kortnamn/, /aktie/]);
  const currencyIdx = findHeaderIndex(normalizedHeaders, [/currency/, /valuta/]);
  const priceIdx = findHeaderIndex(normalizedHeaders, [
    /price/,
    /pris/,
    /last/,
    /senast/,
    /kurs/,
    /value/,
    /värde/,
  ]);

  const hasHeader = tickerIdx !== -1 && priceIdx !== -1;

  if (hasHeader) {
    return {
      dataRows: rows.slice(1),
      indices: { companyIdx, tickerIdx, currencyIdx, priceIdx },
      usingFallback: false as const,
      diagnostics: {
        price: "high" as const,
        ticker: "high" as const,
        currency: currencyIdx !== -1 ? ("high" as const) : ("none" as const),
        company: companyIdx !== -1 ? ("high" as const) : ("none" as const),
        warnings: [] as string[],
      },
    };
  }

  const inference = inferListSheetColumns(rows);
  return {
    dataRows: rows,
    indices: inference.indices,
    usingFallback: true as const,
    diagnostics: inference.diagnostics,
  };
};

const getCell = (row: string[], index: number) => {
  if (index < 0 || index >= row.length) return "";
  const value = row[index];
  return typeof value === "string" ? value : String(value ?? "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const values = await getSheetValues();
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Google Sheets API returned no rows for the configured range.");
    }

    const nonEmptyRows = values.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim().length > 0)) as string[][];

    if (nonEmptyRows.length === 0) {
      throw new Error("Google Sheets API returned only empty rows for the configured range.");
    }

    const { dataRows, indices, usingFallback, diagnostics } = resolveSheetStructure(nonEmptyRows);

    if (usingFallback) {
      console.warn(
        "Google Sheets header row was not detected for list-sheet-tickers. Column positions were inferred heuristically from the data.",
      );
      for (const warning of diagnostics.warnings) {
        console.warn(warning);
      }
    }

    if (indices.tickerIdx === -1 || indices.priceIdx === -1) {
      throw new Error(
        "Unable to identify ticker and price columns from Google Sheets. Ensure GOOGLE_SHEET_RANGE includes the header row or adjust the sheet so ticker and price columns are present.",
      );
    }

    const tickerMap = new Map<
      string,
      { name: string; symbol: string; currency: string | null; price: number | null }
    >();

    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;
      const rawName = normalizeValue(getCell(row, indices.companyIdx));
      const rawSymbol = normalizeValue(getCell(row, indices.tickerIdx));
      const rawCurrency = indices.currencyIdx >= 0 ? normalizeValue(getCell(row, indices.currencyIdx)) : null;
      const rawPrice = normalizeValue(getCell(row, indices.priceIdx));

      if (!rawSymbol || !rawPrice) continue;

      // Ta bort ev. "STO:" prefix
      const cleanedSymbol = rawSymbol.includes(":")
        ? rawSymbol.split(":")[1].toUpperCase()
        : rawSymbol.toUpperCase();

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

    if (tickers.length === 0) {
      const rangeHint = usingFallback
        ? "Include the sheet's header row in GOOGLE_SHEET_RANGE or confirm that ticker and price columns contain data."
        : "Verify that the sheet contains at least one row with both ticker and price values.";
      throw new Error(`Google Sheets data did not contain any usable tickers. ${rangeHint}`);
    }

    return new Response(JSON.stringify({ success: true, tickers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
