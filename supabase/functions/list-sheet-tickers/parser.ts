export interface SheetTicker {
  name: string;
  symbol: string;
  currency: string | null;
  price: number | null;
}

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

interface HeaderIndexes {
  companyIdx: number;
  tickerIdx: number;
  currencyIdx: number;
  priceIdx: number;
}

const resolveHeaderIndexes = (
  headers: (string | undefined)[],
): HeaderIndexes => {
  const normalizedHeaders = headers.map((header) =>
    typeof header === "string" ? header.trim() : ""
  );

  const companyIdx = normalizedHeaders.findIndex((h) => /company/i.test(h));
  const tickerIdx = normalizedHeaders.findIndex((h) => /ticker/i.test(h));
  const currencyIdx = normalizedHeaders.findIndex((h) => /currency/i.test(h));
  const priceIdx = normalizedHeaders.findIndex((h) => /price/i.test(h));

  if (companyIdx === -1 || tickerIdx === -1 || priceIdx === -1) {
    throw new Error("CSV saknar nödvändiga kolumner (Company, Ticker, Price).");
  }

  return { companyIdx, tickerIdx, currencyIdx, priceIdx };
};

export interface BuildTickersResult {
  tickers: SheetTicker[];
  symbolCounts: Map<string, number>;
}

const cleanSymbol = (rawSymbol: string): string => {
  const trimmedSymbol = rawSymbol.trim();
  if (trimmedSymbol.includes(":")) {
    const segments = trimmedSymbol.split(":");
    return segments[segments.length - 1].toUpperCase();
  }
  return trimmedSymbol.toUpperCase();
};

const parsePrice = (rawPrice: string | null): number | null => {
  if (!rawPrice) return null;
  const sanitized = rawPrice.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
};

export const buildTickersFromParsedCsv = (
  headerRow: (string | undefined)[],
  dataRows: (string | undefined)[][],
): BuildTickersResult => {
  const { companyIdx, tickerIdx, currencyIdx, priceIdx } =
    resolveHeaderIndexes(headerRow);

  const tickers: SheetTicker[] = [];
  const symbolCounts = new Map<string, number>();

  for (const row of dataRows) {
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawSymbol =
      tickerIdx >= 0 && tickerIdx < row.length ? normalizeValue(row[tickerIdx]) :
        null;
    if (!rawSymbol) continue;

    const cleanedSymbol = cleanSymbol(rawSymbol);

    const rawName =
      companyIdx >= 0 && companyIdx < row.length
        ? normalizeValue(row[companyIdx])
        : null;

    const rawCurrency =
      currencyIdx >= 0 && currencyIdx < row.length
        ? normalizeValue(row[currencyIdx])
        : null;

    const rawPrice =
      priceIdx >= 0 && priceIdx < row.length ? normalizeValue(row[priceIdx]) :
        null;

    const ticker: SheetTicker = {
      symbol: cleanedSymbol,
      name: rawName ?? cleanedSymbol,
      currency: rawCurrency ?? null,
      price: parsePrice(rawPrice),
    };

    tickers.push(ticker);

    const occurrence = (symbolCounts.get(cleanedSymbol) ?? 0) + 1;
    symbolCounts.set(cleanedSymbol, occurrence);
  }

  return { tickers, symbolCounts };
};

