const KNOWN_CURRENCY_CODES = new Set([
  "SEK",
  "USD",
  "EUR",
  "GBP",
  "NOK",
  "DKK",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "CNY",
  "HKD",
  "SGD",
  "INR",
  "KRW",
  "PLN",
  "ZAR",
  "BRL",
]);

type ConfidenceLevel = "high" | "low" | "none";

type ColumnStats = {
  index: number;
  nonEmpty: number;
  numericScore: number;
  percentScore: number;
  tickerScore: number;
  currencyScore: number;
  nameScore: number;
  totalLength: number;
  averageLength: number;
};

type PickResult = {
  index: number;
  stat: ColumnStats;
  score: number;
};

type ColumnDiagnostics = {
  price: ConfidenceLevel;
  ticker: ConfidenceLevel;
  currency: ConfidenceLevel;
  company: ConfidenceLevel;
  change?: ConfidenceLevel;
  warnings: string[];
};

type ListSheetIndices = {
  companyIdx: number;
  tickerIdx: number;
  currencyIdx: number;
  priceIdx: number;
};

type PortfolioSheetIndices = ListSheetIndices & {
  changeIdx: number;
};

type ColumnInferenceResult<T> = {
  indices: T;
  diagnostics: ColumnDiagnostics;
};

const normalizeNumericCandidate = (value: string) =>
  value
    .replace(/[\u2212\u2013]/g, "-")
    .replace(/\s+/g, "")
    .replace(/'+/g, "");

const detectNumericCandidate = (
  value: string,
): { value: number; isPercent: boolean } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = normalizeNumericCandidate(trimmed);
  if (!normalized) return null;

  const percent = normalized.endsWith("%");
  if (percent) {
    normalized = normalized.replace(/%+$/g, "");
  }

  if (!/^[-+0-9.,]+$/.test(normalized)) return null;

  const attempts = new Set<string>();
  attempts.add(normalized);
  attempts.add(normalized.replace(/,/g, ""));
  attempts.add(normalized.replace(/,/g, "."));
  attempts.add(normalized.replace(/\.(?=\d{3}(?:\.|$))/g, ""));
  attempts.add(normalized.replace(/\./g, "").replace(/,/g, "."));

  for (const attempt of attempts) {
    if (!attempt) continue;
    if (!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(attempt)) continue;
    const parsed = Number.parseFloat(attempt);
    if (!Number.isNaN(parsed)) {
      return { value: parsed, isPercent: percent };
    }
  }

  return null;
};

const isLikelyCurrency = (value: string): boolean => {
  const upper = value.trim().toUpperCase();
  if (KNOWN_CURRENCY_CODES.has(upper)) return true;
  if (/^[A-Z]{3}$/.test(upper)) return true;
  if (/^(?:SEK|USD|EUR|GBP|NOK|DKK|JPY|CHF|CAD|AUD|NZD|CNY|HKD|SGD|INR|KRW|PLN|ZAR|BRL)$/i.test(upper)) return true;
  return false;
};

const isLikelyTicker = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 16) return false;
  if (/\s/.test(trimmed)) return false;

  const upper = trimmed.toUpperCase();
  if (isLikelyCurrency(upper)) return false;

  if (/^[A-Z0-9]{1,7}(?:\.[A-Z0-9]{1,4})?$/.test(upper)) return true;
  if (/^[A-Z]{1,5}:[A-Z0-9.-]{1,8}$/.test(upper)) return true;
  if (/^[A-Z0-9]{1,5}-[A-Z0-9]{1,5}$/.test(upper)) return true;
  if (/^[A-Z]{1,3}\d{1,3}$/.test(upper)) return true;
  if (upper.endsWith(".ST")) return true;

  return false;
};

const isLikelyCompanyName = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (/\s/.test(trimmed) && /[A-Za-zÅÄÖåäö]/.test(trimmed)) return true;
  if (/(?:AB|AG|ASA|OY|OYJ|AS|PLC|GROUP|HOLDING|HLDG|KONCERN|BANK|CORP|INC)/i.test(trimmed)) return true;

  if (trimmed.length >= 4 && /[A-Za-zÅÄÖåäö]/.test(trimmed)) {
    return !isLikelyTicker(trimmed) && !isLikelyCurrency(trimmed.toUpperCase());
  }

  return false;
};

const analyzeColumns = (rows: string[][]): ColumnStats[] => {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const stats: ColumnStats[] = Array.from({ length: columnCount }, (_, index) => ({
    index,
    nonEmpty: 0,
    numericScore: 0,
    percentScore: 0,
    tickerScore: 0,
    currencyScore: 0,
    nameScore: 0,
    totalLength: 0,
    averageLength: 0,
  }));

  for (const row of rows) {
    for (let column = 0; column < columnCount; column++) {
      const cell = row[column];
      if (typeof cell !== "string") continue;
      const trimmed = cell.trim();
      if (!trimmed) continue;

      const stat = stats[column];
      stat.nonEmpty += 1;
      stat.totalLength += trimmed.length;

      const numeric = detectNumericCandidate(trimmed);
      if (numeric) {
        if (numeric.isPercent) {
          stat.percentScore += 2;
        } else {
          stat.numericScore += 2;
        }
      } else if (/%/.test(trimmed)) {
        stat.percentScore += 1;
      }

      const uppercase = trimmed.toUpperCase();
      if (isLikelyCurrency(uppercase)) {
        stat.currencyScore += 3;
      }

      if (isLikelyTicker(trimmed)) {
        stat.tickerScore += 3;
      }

      if (isLikelyCompanyName(trimmed)) {
        stat.nameScore += 2;
      }
    }
  }

  for (const stat of stats) {
    stat.averageLength = stat.nonEmpty > 0 ? stat.totalLength / stat.nonEmpty : 0;
  }

  return stats;
};

const pickIndex = (
  stats: ColumnStats[],
  used: Set<number>,
  scorer: (stat: ColumnStats) => number,
  minScore: number,
): PickResult | null => {
  let best: PickResult | null = null;

  for (const stat of stats) {
    if (used.has(stat.index) || stat.nonEmpty === 0) continue;
    const score = scorer(stat);
    if (score < minScore) continue;

    if (
      !best ||
      score > best.score ||
      (score === best.score && stat.nonEmpty > best.stat.nonEmpty) ||
      (score === best.score && stat.nonEmpty === best.stat.nonEmpty && stat.averageLength > best.stat.averageLength)
    ) {
      best = { index: stat.index, stat, score };
    }
  }

  return best;
};

type PickOutcome = {
  index: number;
  confidence: ConfidenceLevel;
};

const choosePriceColumn = (
  stats: ColumnStats[],
  used: Set<number>,
  warnings: string[],
): PickOutcome => {
  const primary = pickIndex(
    stats,
    used,
    (stat) => stat.numericScore * 3 - stat.percentScore * 2,
    2,
  );
  if (primary) {
    return {
      index: primary.index,
      confidence: primary.stat.numericScore >= 2 ? "high" : "low",
    };
  }

  const fallback = pickIndex(
    stats,
    used,
    (stat) => stat.numericScore + Math.max(0, stat.percentScore - 1),
    1,
  );
  if (fallback) {
    warnings.push(
      "Price column inferred heuristically because numeric cells were ambiguous. Include the header row in GOOGLE_SHEET_RANGE for reliable detection.",
    );
    return {
      index: fallback.index,
      confidence: fallback.stat.numericScore > 0 ? "low" : "low",
    };
  }

  const positional = [...stats]
    .filter((stat) => !used.has(stat.index) && stat.nonEmpty > 0)
    .sort((a, b) => a.index - b.index)
    .pop();

  if (positional) {
    warnings.push(
      "Price column guessed based on column order due to ambiguous sheet data. Ensure GOOGLE_SHEET_RANGE includes the header row.",
    );
    return { index: positional.index, confidence: "low" };
  }

  return { index: -1, confidence: "none" };
};

const chooseTickerColumn = (
  stats: ColumnStats[],
  used: Set<number>,
  priceIndex: number,
  warnings: string[],
): PickOutcome => {
  const primary = pickIndex(
    stats,
    used,
    (stat) => stat.tickerScore * 3 + Math.max(0, stat.nonEmpty - stat.numericScore - stat.percentScore),
    2,
  );
  if (primary) {
    return {
      index: primary.index,
      confidence: primary.stat.tickerScore >= 3 ? "high" : "low",
    };
  }

  const fallback = pickIndex(
    stats,
    used,
    (stat) => Math.max(0, stat.nonEmpty - stat.numericScore - stat.percentScore),
    1,
  );
  if (fallback) {
    warnings.push(
      "Ticker column inferred using generic heuristics. Include the sheet header row in GOOGLE_SHEET_RANGE for consistent parsing.",
    );
    return { index: fallback.index, confidence: "low" };
  }

  let positionalIndex = -1;
  if (priceIndex !== -1) {
    const before = [...stats]
      .filter((stat) => stat.index < priceIndex && !used.has(stat.index) && stat.nonEmpty > 0)
      .sort((a, b) => b.index - a.index)[0];
    if (before) positionalIndex = before.index;
  }
  if (positionalIndex === -1) {
    const any = stats.find((stat) => !used.has(stat.index) && stat.nonEmpty > 0);
    if (any) positionalIndex = any.index;
  }

  if (positionalIndex !== -1) {
    warnings.push(
      "Ticker column guessed based on proximity to the price column. Include the header row in GOOGLE_SHEET_RANGE for robust detection.",
    );
    return { index: positionalIndex, confidence: "low" };
  }

  return { index: -1, confidence: "none" };
};

const chooseCurrencyColumn = (
  stats: ColumnStats[],
  used: Set<number>,
  warnings: string[],
): PickOutcome => {
  const primary = pickIndex(
    stats,
    used,
    (stat) => stat.currencyScore * 4 - stat.numericScore,
    3,
  );
  if (primary) {
    return {
      index: primary.index,
      confidence: primary.stat.currencyScore >= 3 ? "high" : "low",
    };
  }

  const fallback = pickIndex(
    stats,
    used,
    (stat) => stat.currencyScore * 3,
    2,
  );
  if (fallback) {
    warnings.push(
      "Currency column inferred heuristically. Add the header row to GOOGLE_SHEET_RANGE for clearer identification.",
    );
    return { index: fallback.index, confidence: "low" };
  }

  return { index: -1, confidence: "none" };
};

const chooseChangeColumn = (
  stats: ColumnStats[],
  used: Set<number>,
): PickOutcome => {
  const primary = pickIndex(
    stats,
    used,
    (stat) => stat.percentScore * 3 + Math.max(0, stat.numericScore - stat.percentScore),
    3,
  );
  if (primary && primary.stat.percentScore >= 2) {
    return {
      index: primary.index,
      confidence: "high",
    };
  }

  const fallback = pickIndex(
    stats,
    used,
    (stat) => stat.percentScore * 2 + stat.numericScore,
    2,
  );
  if (fallback && fallback.stat.percentScore > 0) {
    return { index: fallback.index, confidence: "low" };
  }

  return { index: -1, confidence: "none" };
};

const chooseCompanyColumn = (
  stats: ColumnStats[],
  used: Set<number>,
  warnings: string[],
): PickOutcome => {
  const primary = pickIndex(
    stats,
    used,
    (stat) => stat.nameScore * 2 + stat.averageLength,
    2,
  );
  if (primary) {
    return {
      index: primary.index,
      confidence: primary.stat.nameScore >= 2 ? "high" : "low",
    };
  }

  const fallback = pickIndex(
    stats,
    used,
    (stat) => stat.nonEmpty,
    1,
  );
  if (fallback) {
    warnings.push(
      "Company/name column inferred heuristically. Provide the header row in GOOGLE_SHEET_RANGE for precise matching.",
    );
    return { index: fallback.index, confidence: "low" };
  }

  return { index: -1, confidence: "none" };
};

const inferColumns = (
  rows: string[][],
  includeChange: boolean,
): ColumnInferenceResult<PortfolioSheetIndices> => {
  const stats = analyzeColumns(rows);
  const used = new Set<number>();
  const warnings: string[] = [];

  const price = choosePriceColumn(stats, used, warnings);
  if (price.index !== -1) used.add(price.index);

  const ticker = chooseTickerColumn(stats, used, price.index, warnings);
  if (ticker.index !== -1) used.add(ticker.index);

  const currency = chooseCurrencyColumn(stats, used, warnings);
  if (currency.index !== -1) used.add(currency.index);

  const change = includeChange ? chooseChangeColumn(stats, used) : { index: -1, confidence: "none" as ConfidenceLevel };
  if (includeChange && change.index !== -1) used.add(change.index);

  let company = chooseCompanyColumn(stats, used, warnings);
  if (company.index === -1 && ticker.index !== -1) {
    company = { index: ticker.index, confidence: "low" };
  }

  return {
    indices: {
      companyIdx: company.index,
      tickerIdx: ticker.index,
      currencyIdx: currency.index,
      priceIdx: price.index,
      changeIdx: change.index,
    },
    diagnostics: {
      price: price.confidence,
      ticker: ticker.confidence,
      currency: currency.confidence,
      company: company.confidence,
      change: includeChange ? change.confidence : undefined,
      warnings,
    },
  };
};

export const inferListSheetColumns = (
  rows: string[][],
): ColumnInferenceResult<ListSheetIndices> => {
  const { indices, diagnostics } = inferColumns(rows, false);
  return {
    indices: {
      companyIdx: indices.companyIdx,
      tickerIdx: indices.tickerIdx,
      currencyIdx: indices.currencyIdx,
      priceIdx: indices.priceIdx,
    },
    diagnostics,
  };
};

export const inferPortfolioSheetColumns = (
  rows: string[][],
): ColumnInferenceResult<PortfolioSheetIndices> => inferColumns(rows, true);

