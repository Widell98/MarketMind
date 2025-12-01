const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?output=csv";

type ColumnIndexes = {
  simpleTickerIdx: number;
  tickerIdx: number;
  currencyIdx: number;
  priceIdx: number;
  peIdx: number;
  dividendIdx: number;
  marketCapIdx: number;
  weekHighIdx: number;
  weekLowIdx: number;
};

export type SheetTickerMetrics = {
  symbol: string;
  price: number | null;
  currency: string | null;
  marketCap: string | null;
  peRatio: string | null;
  dividendYield: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (insideQuotes && text[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (insideQuotes) {
    throw new Error('CSV parse error: unmatched quote');
  }

  currentRow.push(currentValue);
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => (cell ?? '').trim().length > 0));
};

const normalizeSheetValue = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const formatSummaryNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '');
};

const formatDividendYield = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, '');
  const simplePattern = /^-?\d+(?:[.,]\d+)?%?$/u;

  if (!simplePattern.test(compact)) {
    return trimmed;
  }

  const numeric = sanitizeNumber(trimmed);
  if (numeric === null || !Number.isFinite(numeric)) {
    return trimmed;
  }

  if (trimmed.includes('%')) {
    return `${formatSummaryNumber(numeric)}%`;
  }

  if (Math.abs(numeric) <= 1) {
    return `${formatSummaryNumber(numeric * 100)}%`;
  }

  return `${formatSummaryNumber(numeric)}%`;
};

const normalizeTickerKey = (value: string): string => {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return '';
  }
  const withoutPrefix = trimmed.includes(':') ? trimmed.split(':').pop() ?? trimmed : trimmed;
  return withoutPrefix;
};

const buildSheetTickerIndex = (rows: string[][], indexes: ColumnIndexes): Map<string, SheetTickerMetrics> => {
  const index = new Map<string, SheetTickerMetrics>();

  rows.forEach((columns) => {
    if (!columns) {
      return;
    }

    const rawSimpleSymbol = indexes.simpleTickerIdx !== -1
      ? normalizeSheetValue(columns[indexes.simpleTickerIdx])
      : null;
    const rawSymbol = indexes.tickerIdx !== -1 ? normalizeSheetValue(columns[indexes.tickerIdx]) : null;
    const selectedSymbol = rawSimpleSymbol ?? rawSymbol;

    if (!selectedSymbol) {
      return;
    }

    const cleanedSymbol = normalizeTickerKey(selectedSymbol);
    if (!cleanedSymbol) {
      return;
    }

    const rawCurrency = indexes.currencyIdx !== -1
      ? normalizeSheetValue(columns[indexes.currencyIdx])
      : null;
    const currency = rawCurrency ? rawCurrency.toUpperCase() : null;

    const rawPrice = indexes.priceIdx !== -1 ? normalizeSheetValue(columns[indexes.priceIdx]) : null;
    const numericPrice = rawPrice ? sanitizeNumber(rawPrice) : null;
    const price = numericPrice !== null && Number.isFinite(numericPrice)
      ? Number(numericPrice.toFixed(2))
      : null;

    const rawPe = indexes.peIdx !== -1 ? normalizeSheetValue(columns[indexes.peIdx]) : null;
    let peRatio: string | null = null;
    if (rawPe) {
      const parsedPe = sanitizeNumber(rawPe);
      if (parsedPe !== null && Number.isFinite(parsedPe)) {
        peRatio = formatSummaryNumber(parsedPe);
      } else {
        peRatio = rawPe;
      }
    }

    const rawDividend = indexes.dividendIdx !== -1
      ? normalizeSheetValue(columns[indexes.dividendIdx])
      : null;
    const dividendYield = formatDividendYield(rawDividend);

    const rawMarketCap = indexes.marketCapIdx !== -1
      ? normalizeSheetValue(columns[indexes.marketCapIdx])
      : null;

    const rawWeekHigh = indexes.weekHighIdx !== -1
      ? normalizeSheetValue(columns[indexes.weekHighIdx])
      : null;
    const parsedWeekHigh = rawWeekHigh ? sanitizeNumber(rawWeekHigh) : null;
    const weekHigh = parsedWeekHigh !== null && Number.isFinite(parsedWeekHigh)
      ? Number(parsedWeekHigh.toFixed(2))
      : null;

    const rawWeekLow = indexes.weekLowIdx !== -1
      ? normalizeSheetValue(columns[indexes.weekLowIdx])
      : null;
    const parsedWeekLow = rawWeekLow ? sanitizeNumber(rawWeekLow) : null;
    const weekLow = parsedWeekLow !== null && Number.isFinite(parsedWeekLow)
      ? Number(parsedWeekLow.toFixed(2))
      : null;

    const metrics: SheetTickerMetrics = {
      symbol: cleanedSymbol,
      price,
      currency,
      marketCap: rawMarketCap ?? null,
      peRatio,
      dividendYield,
      fiftyTwoWeekHigh: weekHigh,
      fiftyTwoWeekLow: weekLow,
    };

    const variants = new Set<string>();
    variants.add(cleanedSymbol);
    variants.add(cleanedSymbol.replace('-', ''));
    variants.add(cleanedSymbol.replace(/\s+/g, ''));

    if (cleanedSymbol.includes('.')) {
      const [root, suffix] = cleanedSymbol.split('.');
      if (root) {
        variants.add(root);
        variants.add(root.replace('-', ''));
        variants.add(root.replace(/\s+/g, ''));
        if (suffix) {
          variants.add(`${root}-${suffix}`);
        }
      }
    }

    variants.forEach((variant) => {
      if (variant) {
        index.set(variant, metrics);
      }
    });
  });

  return index;
};

const findSheetTickerMetrics = (
  ticker: string,
  index: Map<string, SheetTickerMetrics>,
): SheetTickerMetrics | null => {
  if (!ticker) {
    return null;
  }

  const normalized = normalizeTickerKey(ticker);
  if (!normalized) {
    return null;
  }

  const candidates = new Set<string>();
  candidates.add(normalized);
  candidates.add(normalized.replace('-', ''));
  candidates.add(normalized.replace(/\s+/g, ''));

  if (normalized.includes('.')) {
    const [root, suffix] = normalized.split('.');
    if (root) {
      candidates.add(root);
      candidates.add(root.replace('-', ''));
      candidates.add(root.replace(/\s+/g, ''));
      if (suffix) {
        candidates.add(`${root}-${suffix}`);
      }
    }
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const metrics = index.get(candidate);
    if (metrics) {
      return metrics;
    }
  }

  return null;
};

export const fetchSheetTickerMetrics = async (
  ticker: string,
  options?: { signal?: AbortSignal },
): Promise<SheetTickerMetrics | null> => {
  if (!ticker) {
    return null;
  }

  const response = await fetch(SHEET_CSV_URL, {
    signal: options?.signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet data: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);

  if (!rows.length) {
    return null;
  }

  const headers = rows[0].map((header) => header.trim());
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim().length > 0));

  if (!headers.length || !dataRows.length) {
    return null;
  }

  const lowerHeaders = headers.map((header) => header.toLowerCase());

  const indexes: ColumnIndexes = {
    simpleTickerIdx: lowerHeaders.findIndex((header) => /simple\s*ticker/.test(header)),
    tickerIdx: lowerHeaders.findIndex((header) => header.includes('ticker') && !header.includes('simple')),
    currencyIdx: lowerHeaders.findIndex((header) => /(currency|valuta)/.test(header)),
    priceIdx: lowerHeaders.findIndex((header) => /(price|senast|last)/.test(header)),
    peIdx: lowerHeaders.findIndex((header) => {
      return header.includes('p/e')
        || header.includes('pe-tal')
        || header.includes('pe ratio')
        || header.includes('p e');
    }),
    dividendIdx: lowerHeaders.findIndex((header) => {
      return header.includes('dividend')
        || header.includes('yield')
        || header.includes('utdelning')
        || header.includes('direktavkastning');
    }),
    marketCapIdx: lowerHeaders.findIndex((header) => {
      return header.includes('market cap')
        || header.includes('marketcapitalization')
        || header.includes('marketcapitalisation')
        || header.includes('börsvärde')
        || header.includes('borsvarde');
    }),
    weekHighIdx: lowerHeaders.findIndex((header) => {
      return header.includes('52')
        && (header.includes('högsta') || header.includes('hogsta') || header.includes('high'));
    }),
    weekLowIdx: lowerHeaders.findIndex((header) => {
      return header.includes('52')
        && (header.includes('lägsta') || header.includes('lagsta') || header.includes('low'));
    }),
  };

  if (indexes.tickerIdx === -1 && indexes.simpleTickerIdx === -1) {
    throw new Error('Google Sheet saknar kolumner för ticker-data.');
  }

  const index = buildSheetTickerIndex(dataRows, indexes);

  return findSheetTickerMetrics(ticker, index);
};
