export const normalizeValue = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  let trimmed = value.trim();
  if (!trimmed.length) return null;

  const quotedWithDouble = trimmed.startsWith('"') && trimmed.endsWith('"');
  const quotedWithSingle = trimmed.startsWith("'") && trimmed.endsWith("'");
  if ((quotedWithDouble || quotedWithSingle) && trimmed.length >= 2) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  const lower = trimmed.toLowerCase();
  if (["n/a", "na", "#n/a", "null", "undefined", "--", "-"].includes(lower)) {
    return null;
  }

  return trimmed;
};

export const normalizeSymbol = (value?: string | null): string | null => {
  const normalized = normalizeValue(value);
  if (!normalized) return null;
  return normalized
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
};

export const normalizeName = (value?: string | null): string | null => {
  const normalized = normalizeValue(value);
  return normalized ? normalized.toUpperCase() : null;
};

export const cleanSheetSymbol = (symbol?: string | null): string | null => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  const colonIndex = normalized.indexOf(":");
  if (colonIndex < 0) return normalized;
  const withoutPrefix = normalized.slice(colonIndex + 1);
  return withoutPrefix.length > 0 ? withoutPrefix : normalized;
};

const detectDelimiter = (input: string): string => {
  const firstLine = input.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  if (semicolonCount > commaCount) return ";";
  return ",";
};

export const parseCsv = (input: string): string[][] => {
  if (!input) return [];

  const delimiter = detectDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let insideQuotes = false;
  let negativeFromParens = false;

  const pushValue = () => {
    row.push(value);
    value = "";
    negativeFromParens = false;
  };

  const pushRow = () => {
    pushValue();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      if (insideQuotes && input[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      pushRow();
      continue;
    }

    if (!insideQuotes && char === delimiter) {
      pushValue();
      continue;
    }

    if (!insideQuotes && char === '(') {
      negativeFromParens = true;
      continue;
    }

    if (!insideQuotes && char === ')' && negativeFromParens) {
      if (value && !value.startsWith("-")) value = `-${value}`;
      negativeFromParens = false;
      continue;
    }

    value += char;
  }

  pushRow();

  const filtered = rows.filter((cols) => cols.some((cell) => cell.trim().length > 0));
  if (filtered.length === 0) return [];

  filtered[0][0] = filtered[0][0].replace(/^\uFEFF/, "");
  return filtered;
};

const stripDiacritics = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const sanitizeHeader = (header: string): string => {
  const normalized = normalizeValue(header) ?? "";
  const lower = stripDiacritics(normalized.toLowerCase());
  return lower.replace(/[^a-z0-9%]+/g, " ").trim();
};

export const findHeaderIndex = (
  headers: string[],
  ...candidates: Array<string | RegExp>
): number => {
  const normalizedHeaders = headers.map((header) => sanitizeHeader(header));

  for (const candidate of candidates) {
    if (candidate instanceof RegExp) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (candidate.test(normalizedHeaders[i])) return i;
      }
    } else {
      const normalizedCandidate = sanitizeHeader(candidate);
      const idx = normalizedHeaders.findIndex((header) => header === normalizedCandidate);
      if (idx !== -1) return idx;
    }
  }

  for (const candidate of candidates) {
    if (candidate instanceof RegExp) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (candidate.test(normalizedHeaders[i])) return i;
      }
    } else {
      const normalizedCandidate = sanitizeHeader(candidate);
      const idx = normalizedHeaders.findIndex((header) => header.includes(normalizedCandidate));
      if (idx !== -1) return idx;
    }
  }

  return -1;
};

const normalizeNumericString = (value: string): string => {
  let sanitized = stripDiacritics(value)
    .replace(/\u2212/g, "-")
    .replace(/\s+/g, "");

  const hasParensNegative = /^-?\(?[0-9]/.test(sanitized) && sanitized.includes("(") && sanitized.includes(")");
  if (hasParensNegative) {
    sanitized = sanitized.replace(/[()]/g, "");
    if (!sanitized.startsWith("-")) sanitized = `-${sanitized}`;
  }

  sanitized = sanitized.replace(/[^0-9,.-]/g, "");
  if (!sanitized) return "";

  let sign = "";
  if (sanitized.startsWith("-")) {
    sign = "-";
    sanitized = sanitized.slice(1);
  }

  sanitized = sanitized.replace(/-/g, "");

  const commaCount = (sanitized.match(/,/g) ?? []).length;
  const dotCount = (sanitized.match(/\./g) ?? []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (sanitized.lastIndexOf(",") > sanitized.lastIndexOf(".")) {
      sanitized = sanitized.replace(/\./g, "").replace(/,/g, ".");
    } else {
      sanitized = sanitized.replace(/,/g, "");
    }
  } else if (commaCount > 0 && dotCount === 0) {
    sanitized = sanitized.replace(/,/g, ".");
  } else {
    sanitized = sanitized.replace(/,/g, "");
  }

  return `${sign}${sanitized}`;
};

export const parseNumeric = (value?: string | null): number | null => {
  const normalized = normalizeValue(value);
  if (!normalized) return null;
  const numericString = normalizeNumericString(normalized);
  if (!numericString || numericString === "-") return null;
  const parsed = Number.parseFloat(numericString);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parsePrice = (value?: string | null): number | null => parseNumeric(value);

export const parseChangePercent = (value?: string | null): number | null => parseNumeric(value);

export const getSymbolVariants = (symbol: string | null | undefined): string[] => {
  if (!symbol) return [];
  const base = normalizeSymbol(symbol);
  if (!base) return [];

  const variants = new Set<string>();
  const addVariant = (candidate?: string | null) => {
    const normalized = normalizeSymbol(candidate);
    if (normalized) variants.add(normalized);
  };

  addVariant(base);
  if (base.includes(":")) {
    const suffix = base.split(":").pop();
    if (suffix) addVariant(suffix);
  }

  if (base.endsWith(".ST")) {
    addVariant(base.replace(/\.ST$/, ""));
  } else {
    addVariant(`${base}.ST`);
  }

  addVariant(base.replace(/-/g, "."));
  addVariant(base.replace(/\./g, "-"));
  addVariant(base.replace(/[-.]/g, ""));

  return [...variants];
};
