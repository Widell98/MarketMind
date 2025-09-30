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

const parseCsvRecords = (csvText: string) => {
  let headers: string[] = [];

  const records = parse(csvText.replace(/^\ufeff/, ""), {
    skipFirstRow: false,
    columns: (cols: string[]) => {
      headers = cols.map((value, index) => {
        const normalized = value?.trim();
        return normalized && normalized.length > 0 ? normalized : `column_${index}`;
      });
      return headers;
    },
  }) as Array<Record<string, string>>;

  if (!Array.isArray(records)) {
    throw new Error("Kunde inte tolka CSV-innehållet");
  }

  const sanitizedRecords = records.filter((record) =>
    headers.some((header) => normalizeValue(record[header] ?? null))
  );

  return { headers, records: sanitizedRecords };
};

const toNumberOrNull = (value: string | null) => {
  if (!value) return null;
  const parsed = parseFloat(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();
    const { headers, records: rows } = parseCsvRecords(csvText);

    if (!rows.length) {
      throw new Error("CSV innehåller inga rader");
    }

    const companyKey = headers.find((h) => /company/i.test(h));
    const tickerKey = headers.find((h) => /ticker/i.test(h));
    const currencyKey = headers.find((h) => /currency/i.test(h));
    const priceKey = headers.find((h) => /price/i.test(h));

    if (!tickerKey || !priceKey) {
      throw new Error("CSV saknar nödvändiga kolumner (Company, Ticker, Price).");
    }

    const tickerMap = new Map<
      string,
      { name: string; symbol: string; currency: string | null; price: number | null }
    >();

    for (const row of rows) {
      const rawName = normalizeValue(companyKey ? row[companyKey as string] : null);
      const rawSymbol = normalizeValue(row[tickerKey as string]);
      const rawCurrency = normalizeValue(currencyKey ? row[currencyKey as string] : null);
      const rawPrice = normalizeValue(row[priceKey as string]);

      if (!rawSymbol) continue;

      const symbolParts = rawSymbol.split(":");
      const cleanedSymbol = (symbolParts[symbolParts.length - 1] ?? rawSymbol).toUpperCase();
      if (!cleanedSymbol) continue;

      const price = toNumberOrNull(rawPrice);

      tickerMap.set(cleanedSymbol, {
        symbol: cleanedSymbol,
        name: rawName ?? cleanedSymbol,
        currency: rawCurrency ?? null,
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
