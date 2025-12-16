export interface ParsedCsvHolding {
  name: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  currencyProvided: boolean;
  holdingType?: 'stock' | 'fund' | 'crypto' | 'bonds' | 'real_estate' | 'other';
}

export const normalizeShareClassTicker = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();

  const suffixMatch = upper.match(/^(.*?)(\.(ST|OL|CO|HE|L))$/);
  const base = suffixMatch ? suffixMatch[1] : upper;
  const suffix = suffixMatch ? suffixMatch[2] : '';

  const alreadySeparated = base.match(/^(.*?)[\s\-]([ABCD])$/i);
  if (alreadySeparated) {
    const [, main, shareClass] = alreadySeparated;
    return `${main.trim()}-${shareClass.toUpperCase()}${suffix}`;
  }

  const compactMatch = base.match(/^(.*?)([ABCD])$/i);
  const hasNordicSuffix = Boolean(suffix);
  const isLongEnoughToAvoidCommonUS = base.length >= 5;

  if (compactMatch && (hasNordicSuffix || isLongEnoughToAvoidCommonUS)) {
    const [, main, shareClass] = compactMatch;
    if (main.length >= 2) {
      return `${main}-${shareClass.toUpperCase()}${suffix}`;
    }
  }

  return `${base}${suffix}`;
};

const parseLocaleNumber = (value: string) => {
  const sanitized = value
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/kr/gi, '')
    .replace(/\u00a0/g, '');

  if (!sanitized) {
    return NaN;
  }

  let normalized = sanitized;

  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');

  if (hasComma && hasDot) {
    normalized = sanitized.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasComma) {
    normalized = sanitized.replace(/,/g, '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeHeader = (header: string) => {
  const normalized = header.trim().toLowerCase();

  if (!normalized) return null;

  if (/(typ|type|kategori|category|slag|instrument)/.test(normalized) && !/inköpstyp/.test(normalized)) {
    return 'type' as const;
  }

  if (/(symbol|ticker)/.test(normalized)) return 'symbol' as const;
  if (/(kortnamn)/.test(normalized)) return 'symbol' as const;
  if (/(isin)/.test(normalized)) return 'symbol' as const;
  if (/(name|namn|företag|company|bolag)/.test(normalized) && !/kortnamn/.test(normalized)) {
    return 'name' as const;
  }
  if (/(quantity|antal|shares|mängd|aktier|innehav|volym|volume)/.test(normalized)) return 'quantity' as const;
  if (/(purchase|köppris|pris|inköpspris|cost|avg|gav|kurs)/.test(normalized)) return 'purchasePrice' as const;
  if (/(currency|valuta)/.test(normalized)) return 'currency' as const;

  return null;
};

const extractCurrencyFromHeader = (header: string) => {
  const upper = header.toUpperCase();

  const explicitMatch = upper.match(/\b([A-Z]{3})\b/);
  if (explicitMatch) {
    return explicitMatch[1];
  }

  if (/SEK|KRON/iu.test(upper)) return 'SEK';
  if (/USD|DOLLAR/iu.test(upper)) return 'USD';
  if (/EUR|EURO/iu.test(upper)) return 'EUR';
  if (/GBP|POUND/iu.test(upper)) return 'GBP';
  if (/NOK/iu.test(upper)) return 'NOK';
  if (/DKK/iu.test(upper)) return 'DKK';

  return undefined;
};

const inferCurrencyFromSymbol = (symbolRaw: string) => {
  const symbol = symbolRaw.trim().toUpperCase();
  if (symbol.endsWith('.ST')) return 'SEK';
  if (symbol.endsWith('.OL')) return 'NOK';
  if (symbol.endsWith('.CO')) return 'DKK';
  if (symbol.endsWith('.HE')) return 'EUR';
  if (symbol.endsWith('.L')) return 'GBP';
  return undefined;
};

const isLikelyISIN = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(normalized);
};

const trimQuotes = (value: string) => {
  let result = value;
  if (result.startsWith('"')) {
    result = result.slice(1);
  }
  if (result.endsWith('"')) {
    result = result.slice(0, -1);
  }
  return result;
};

export const parsePortfolioHoldingsFromCSV = (text: string): ParsedCsvHolding[] => {
  const sanitizedText = text.replace(/\uFEFF/g, '');

  const lines = sanitizedText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const detectDelimiter = (line: string) => {
    const tabCount = (line.match(/\t/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;

    // Om vi har flest tabbar, anta att det är en tabb-separerad fil (Nordnet)
    if (tabCount > semicolonCount && tabCount > commaCount) {
      return '\t';
    }

    if (semicolonCount === 0 && commaCount === 0) {
      return ',';
    }
    return semicolonCount >= commaCount ? ';' : ',';
  };

  const headerLine = lines[0];
  let delimiter = detectDelimiter(headerLine);
  let headerParts = headerLine
    .split(delimiter)
    .map(part => trimQuotes(part).replace(/^\uFEFF/, ''));

  if (headerParts.length === 1 && delimiter === ',' && headerLine.includes(';')) {
    delimiter = ';';
    headerParts = headerLine.split(delimiter).map(part => trimQuotes(part));
  } else if (headerParts.length === 1 && !headerLine.includes(delimiter) && headerLine.includes('\t')) {
    // Fallback för tabbar om detekteringen missade första försöket
    delimiter = '\t';
    headerParts = headerLine.split(delimiter).map(part => trimQuotes(part));
  }

  const mappedHeaders = headerParts.map(part => normalizeHeader(part));
  const headerCurrencyHints = headerParts.map(part => extractCurrencyFromHeader(part));
  const hasHeaderRow = mappedHeaders.some(Boolean);

  const columnIndices: Record<'name' | 'symbol' | 'quantity' | 'purchasePrice' | 'currency'| 'type', number[]> = {
    name: [],
    symbol: [],
    quantity: [],
    purchasePrice: [],
    currency: [],
    type: []
  };

  if (hasHeaderRow) {
    mappedHeaders.forEach((field, index) => {
      if (field) {
        columnIndices[field].push(index);
      }
    });
  } else {
    const defaultOrder: Array<'name' | 'symbol' | 'quantity' | 'purchasePrice' | 'currency'> = [
      'name',
      'symbol',
      'quantity',
      'purchasePrice',
      'currency'
    ];
    headerParts.forEach((_, index) => {
      if (index < defaultOrder.length) {
        columnIndices[defaultOrder[index]].push(index);
      }
    });
  }

  const startIndex = hasHeaderRow ? 1 : 0;

  const prioritizePurchasePriceIndices = (indices: number[]): number[] => {
    if (!indices || indices.length === 0) return indices;

    const exactGav: number[] = [];
    const gavSek: number[] = [];
    const otherGav: number[] = [];

    indices.forEach(index => {
      const header = headerParts[index]?.trim().toLowerCase() ?? '';

      if (header === 'gav') {
        exactGav.push(index);
      } else if (/^gav\s*\(/.test(header)) {
        gavSek.push(index);
      } else if (/gav/.test(header)) {
        otherGav.push(index);
      }
    });

    if (exactGav.length > 0) return exactGav;
    if (gavSek.length > 0) return gavSek;
    if (otherGav.length > 0) return otherGav;

    return indices;
  };

  const parsedHoldings: ParsedCsvHolding[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line
      .split(delimiter)
      .map(part => trimQuotes(part).replace(/^\uFEFF/, '').trim());

    const getValue = (field: 'name' | 'symbol' | 'quantity' | 'purchasePrice'| 'currency' | 'type') => {
      const rawIndices = columnIndices[field];
      const indices = field === 'purchasePrice' ? prioritizePurchasePriceIndices(rawIndices) : rawIndices;
      if (!indices || indices.length === 0) {
        return '';
      }

      for (const index of indices) {
        if (typeof index !== 'number') continue;
        const value = parts[index];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value;
        }
      }

      const [firstIndex] = indices;
      return typeof firstIndex === 'number' ? parts[firstIndex] ?? '' : '';
    };

    const typeRaw = getValue('type');
    let detectedType: ParsedCsvHolding['holdingType'] = 'stock'; // Default till stock

    if (typeRaw) {
      const lowerType = typeRaw.toLowerCase().trim();
      
      if (lowerType === 'funds' || lowerType.includes('fund') || lowerType.includes('fond') || lowerType.includes('etf')) {
        detectedType = 'fund';
      } else if (lowerType === 'stocks' || lowerType.includes('stock') || lowerType.includes('aktie')) {
        detectedType = 'stock';
      } else if (/(krypto|crypto|bitcoin|ethereum|btc|eth)/.test(lowerType)) {
        detectedType = 'crypto';
      } else if (/(certifikat|warrant|mini)/.test(lowerType)) {
        detectedType = 'other';
      } else if (/(obligation|bond|ränta)/.test(lowerType)) {
        detectedType = 'bonds';
      } else if (/(fastighet|real estate)/.test(lowerType)) {
        detectedType = 'real_estate';
      } else {
        detectedType = 'stock';
      }
    } else {
        const nameVal = getValue('name').toLowerCase();
        if (nameVal.includes('fond') || nameVal.includes('fund') || nameVal.includes('etf')) {
            detectedType = 'fund';
        }
    }

    const quantityIndices = columnIndices.quantity;
    let quantity = NaN;
    for (const index of quantityIndices) {
      if (typeof index !== 'number') continue;
      const raw = parts[index] ?? '';
      const parsed = parseLocaleNumber(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        quantity = parsed;
        break;
      }
    }

    const purchasePriceCandidates = prioritizePurchasePriceIndices(columnIndices.purchasePrice);
    let purchasePrice = NaN;
    let priceCurrencyHint: string | undefined;
    for (const index of purchasePriceCandidates) {
      if (typeof index !== 'number') continue;
      const raw = parts[index] ?? '';
      const parsed = parseLocaleNumber(raw);

      if (Number.isFinite(parsed) && parsed > 0) {
        purchasePrice = parsed;
        priceCurrencyHint = headerCurrencyHints[index];
        break;
      }
    }

    if (Number.isNaN(quantity)) {
      const fallbackRaw = getValue('quantity');
      const fallbackParsed = parseLocaleNumber(fallbackRaw);
      if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
        quantity = fallbackParsed;
      }
    }

    if (Number.isNaN(purchasePrice)) {
      const fallbackRaw = getValue('purchasePrice');
      const fallbackParsed = parseLocaleNumber(fallbackRaw);
      if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
        purchasePrice = fallbackParsed;
      }
    }

    const nameRaw = getValue('name');
    const symbolRaw = (() => {
      const indices = columnIndices.symbol;
      if (!indices || indices.length === 0) {
        return '';
      }

      let fallback = '';
      for (const index of indices) {
        if (typeof index !== 'number') continue;
        const raw = parts[index];
        if (typeof raw !== 'string') continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;

        if (!isLikelyISIN(trimmed)) {
          return trimmed;
        }

        if (!fallback) {
          fallback = trimmed;
        }
      }

      return fallback;
    })();
    const currencyRaw = getValue('currency');

    const hasValidQuantity = Number.isFinite(quantity) && quantity > 0;
    const hasValidPrice = Number.isFinite(purchasePrice) && purchasePrice > 0;
    const hasNameOrSymbol = Boolean(nameRaw.trim() || symbolRaw.trim());

    if (!hasValidQuantity || !hasValidPrice || !hasNameOrSymbol) {
      continue;
    }

    const currencyFromValue = currencyRaw
      ? currencyRaw.replace(/[^a-zA-Z]/g, '').toUpperCase() || undefined
      : undefined;
      
    let normalizedSymbol = normalizeShareClassTicker(symbolRaw);

    const detectedCurrency = currencyFromValue || priceCurrencyHint;
    if (normalizedSymbol && !normalizedSymbol.includes('.')) {
      if (detectedCurrency === 'DKK') {
        normalizedSymbol += '.CO';
      } else if (detectedCurrency === 'NOK') {
        normalizedSymbol += '.OL';
      }
    }

    const normalizedNameFallback = normalizeShareClassTicker(symbolRaw);
    const inferredFromSymbol = inferCurrencyFromSymbol(normalizedSymbol);
    const resolvedCurrency = (
      currencyFromValue ||
      priceCurrencyHint ||
      inferredFromSymbol ||
      'SEK'
    );
    const currencyProvided = Boolean(currencyFromValue || priceCurrencyHint || inferredFromSymbol);

    parsedHoldings.push({
      name: nameRaw.trim() || normalizedNameFallback,
      symbol: normalizedSymbol,
      quantity,
      purchasePrice,
      currency: resolvedCurrency,
      currencyProvided,
      holdingType: detectedType,
    });
  }

  return parsedHoldings;
};

export interface TickerSource {
  name?: string | null;
  symbol: string;
  currency?: string | null;
}

export const findTickerByName = (name: string, tickers: TickerSource[]): string | undefined => {
  if (!name || !tickers.length) return undefined;
  
  const cleanName = name.toLowerCase()
    .replace(/ ab$| group$| class [ab]$/g, '')
    .trim();
  
  const exact = tickers.find(t => t.name?.toLowerCase() === name.toLowerCase());
  if (exact) return exact.symbol;

  const startsWith = tickers.find(t => t.name?.toLowerCase().startsWith(cleanName));
  if (startsWith) return startsWith.symbol;

  return undefined;
};

export const enrichHoldingWithTicker = (
  holding: ParsedCsvHolding, 
  tickers: TickerSource[]
): ParsedCsvHolding => {
  if (holding.symbol) {
    return holding;
  }

  const foundTickerSymbol = findTickerByName(holding.name, tickers);
  
  if (foundTickerSymbol) {
    const tickerInfo = tickers.find(t => t.symbol === foundTickerSymbol);
    
    return {
      ...holding,
      symbol: foundTickerSymbol,
      currency: !holding.currencyProvided && tickerInfo?.currency 
        ? tickerInfo.currency 
        : holding.currency,
      currencyProvided: holding.currencyProvided || !!tickerInfo?.currency
    };
  }

  return holding;
};
