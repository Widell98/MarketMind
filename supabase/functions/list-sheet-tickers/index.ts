import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSheetValues } from "../getSheetValues.ts";

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

const resolveSheetStructure = (rows: string[][]) => {
  const headerRow = rows[0] ?? [];
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header));

  const companyIdx = normalizedHeaders.findIndex((header) => /(company|bolag)/i.test(header));
  const tickerIdx = normalizedHeaders.findIndex((header) => /ticker/i.test(header));
  const currencyIdx = normalizedHeaders.findIndex((header) => /(currency|valuta)/i.test(header));
  const priceIdx = normalizedHeaders.findIndex((header) => /(price|pris)/i.test(header));

  const hasHeader = companyIdx !== -1 && tickerIdx !== -1 && priceIdx !== -1;

  if (hasHeader) {
    return {
      dataRows: rows.slice(1),
      indices: { companyIdx, tickerIdx, currencyIdx, priceIdx },
      usingFallback: false as const,
    };
  }

  const firstRowLength = (rows[0] ?? []).length;

  if (firstRowLength >= 5) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: 3,
        priceIdx: 4,
      },
      usingFallback: true as const,
    };
  }

  if (firstRowLength >= 4) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: 2,
        priceIdx: 3,
      },
      usingFallback: true as const,
    };
  }

  if (firstRowLength >= 3) {
    return {
      dataRows: rows,
      indices: {
        companyIdx: 0,
        tickerIdx: 1,
        currencyIdx: -1,
        priceIdx: 2,
      },
      usingFallback: true as const,
    };
  }

  return {
    dataRows: rows,
    indices: {
      companyIdx: firstRowLength > 0 ? 0 : -1,
      tickerIdx: firstRowLength > 1 ? 1 : -1,
      currencyIdx: -1,
      priceIdx: firstRowLength > 2 ? 2 : -1,
    },
    usingFallback: true as const,
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

    const { dataRows, indices, usingFallback } = resolveSheetStructure(nonEmptyRows);

    if (usingFallback) {
      console.warn(
        "Google Sheets header row was not detected for list-sheet-tickers. Falling back to expected column order (Company, Ticker, -, Currency, Price). Update GOOGLE_SHEET_RANGE to include the header row for more robust parsing.",
      );
    }

    if (indices.companyIdx === -1 || indices.tickerIdx === -1 || indices.priceIdx === -1) {
      throw new Error(
        "Google Sheets data is missing required columns (Company, Ticker, Price). Update GOOGLE_SHEET_RANGE so the range includes the header row with these columns.",
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
        ? "Verify that GOOGLE_SHEET_RANGE points to the correct columns (expected order: Company, Ticker, -, Currency, Price)."
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
