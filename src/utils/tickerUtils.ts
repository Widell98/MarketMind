export const normalizeTickerSymbol = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
};

export const stripSymbolPrefix = (symbol?: string | null): string | null => {
  const normalized = normalizeTickerSymbol(symbol);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(':');
  const candidate = parts[parts.length - 1]?.trim();
  return candidate && candidate.length > 0 ? candidate : normalized;
};

export const generateSymbolVariants = (
  ...symbols: Array<string | null | undefined>
): Set<string> => {
  const variants = new Set<string>();
  const queue: string[] = [];

  const addVariant = (value?: string | null) => {
    const normalized = normalizeTickerSymbol(value);
    if (!normalized || variants.has(normalized)) {
      return;
    }

    variants.add(normalized);
    queue.push(normalized);

    const stripped = stripSymbolPrefix(normalized);
    if (stripped && !variants.has(stripped)) {
      variants.add(stripped);
      queue.push(stripped);
    }
  };

  symbols.forEach(addVariant);

  while (queue.length) {
    const current = queue.shift()!;

    if (current.endsWith('.ST')) {
      const base = current.slice(0, -3);
      if (base.length > 0 && !variants.has(base)) {
        variants.add(base);
        queue.push(base);
      }
    } else if (!current.includes(':')) {
      const prefixed = `${current}.ST`;
      if (!variants.has(prefixed)) {
        variants.add(prefixed);
        queue.push(prefixed);
      }
    }
  }

  return variants;
};

interface LookupCandidate {
  symbol: string;
  sheetSymbol?: string | null;
}

export const buildTickerLookupMap = <T extends LookupCandidate>(tickers: T[]): Map<string, T> => {
  const map = new Map<string, T>();

  tickers.forEach((ticker) => {
    const variants = generateSymbolVariants(ticker.symbol, ticker.sheetSymbol);
    variants.forEach((variant) => {
      if (!map.has(variant)) {
        map.set(variant, ticker);
      }
    });
  });

  return map;
};
