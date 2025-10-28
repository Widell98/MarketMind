// Simple currency conversion utility with Finnhub-backed rates
// In a real application, you would fetch live exchange rates from an API

export interface ExchangeRates {
  [key: string]: number;
}

// Base rates to SEK (Swedish Krona) used as a static fallback
export const EXCHANGE_RATES: ExchangeRates = {
  SEK: 1.0,
  USD: 10.5,
  EUR: 11.4,
  GBP: 13.2,
  NOK: 0.95,
  DKK: 1.53,
  JPY: 0.07,
  CHF: 11.8,
  CAD: 7.8,
  AUD: 7.0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type ForexRateCacheEntry = {
  base: string;
  fetchedAt: number;
  rates: ExchangeRates;
  source: string;
};

let cachedRates: ForexRateCacheEntry | null = null;

const buildRatesFromFallback = (base: string): ExchangeRates => {
  const normalizedBase = base.toUpperCase();
  if (normalizedBase === 'SEK') {
    return { ...EXCHANGE_RATES };
  }

  const baseRate = EXCHANGE_RATES[normalizedBase];
  if (!baseRate) {
    return { ...EXCHANGE_RATES };
  }

  const derived: ExchangeRates = {};
  for (const [currency, rateToSek] of Object.entries(EXCHANGE_RATES)) {
    if (!rateToSek || rateToSek <= 0) continue;
    if (currency === normalizedBase) {
      derived[currency] = 1;
      continue;
    }
    derived[currency] = rateToSek / baseRate;
  }
  derived[normalizedBase] = 1;
  return derived;
};

export const getForexRates = async (base = 'SEK'): Promise<ForexRateCacheEntry> => {
  const normalizedBase = base.toUpperCase();
  const now = Date.now();

  if (cachedRates && cachedRates.base === normalizedBase && now - cachedRates.fetchedAt < CACHE_TTL_MS) {
    return cachedRates;
  }

  try {
    const response = await fetch(`/api/forex-rates?base=${encodeURIComponent(normalizedBase)}`);
    if (!response.ok) throw new Error(`Failed to load forex rates: ${response.status}`);
    const payload = await response.json();

    if (!payload?.success || typeof payload?.rates !== 'object' || payload.rates === null) {
      throw new Error('Invalid forex rate payload');
    }

    cachedRates = {
      base: typeof payload.base === 'string' ? payload.base.toUpperCase() : normalizedBase,
      fetchedAt: typeof payload.fetchedAt === 'number' ? payload.fetchedAt : now,
      rates: payload.rates as ExchangeRates,
      source: typeof payload.source === 'string' ? payload.source : 'api',
    };

    return cachedRates;
  } catch (error) {
    console.warn('Falling back to static forex rates', error);
    const fallbackRates = buildRatesFromFallback(normalizedBase);
    cachedRates = {
      base: normalizedBase,
      fetchedAt: now,
      rates: fallbackRates,
      source: 'fallback',
    };
    return cachedRates;
  }
};

export const convertToSek = (
  amount: number | null | undefined,
  currency?: string | null,
  rates?: ExchangeRates,
): number | null => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;

  const normalizedCurrency = currency?.toUpperCase() ?? 'SEK';
  if (normalizedCurrency === 'SEK') return amount;

  const activeRates = rates ?? cachedRates?.rates ?? EXCHANGE_RATES;
  const rate = activeRates?.[normalizedCurrency];

  if (typeof rate === 'number' && Number.isFinite(rate)) {
    return amount * rate;
  }

  const fallbackRate = EXCHANGE_RATES[normalizedCurrency];
  return typeof fallbackRate === 'number' && Number.isFinite(fallbackRate) ? amount * fallbackRate : null;
};

export const convertToSEK = convertToSek;

export const convertFromSEK = (amountInSEK: number, toCurrency: string, rates?: ExchangeRates): number => {
  if (!amountInSEK || amountInSEK === 0) return 0;

  const normalizedCurrency = toCurrency?.toUpperCase() || 'SEK';
  const activeRates = rates ?? cachedRates?.rates ?? EXCHANGE_RATES;
  const rate = activeRates?.[normalizedCurrency];

  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${normalizedCurrency}, defaulting to SEK`);
    return amountInSEK;
  }

  return amountInSEK / rate;
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates?: ExchangeRates): number => {
  if (!amount || amount === 0) return 0;

  const amountInSEK = convertToSek(amount, fromCurrency, rates) ?? 0;
  return convertFromSEK(amountInSEK, toCurrency, rates);
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export interface HoldingLike {
  quantity?: number | string | null;
  current_price_per_unit?: number | string | null;
  price_currency?: string | null;
  currency?: string | null;
  current_value?: number | string | null;
}

export interface HoldingValueBreakdown {
  quantity: number;
  pricePerUnit: number | null;
  priceCurrency: string;
  valueInOriginalCurrency: number;
  valueCurrency: string;
  valueInSEK: number;
  pricePerUnitInSEK: number | null;
  hasDirectPrice: boolean;
}

export const resolveHoldingValue = (holding: HoldingLike, rates?: ExchangeRates): HoldingValueBreakdown => {
  const quantity = parseNumericValue(holding?.quantity) ?? 0;

  const pricePerUnit = parseNumericValue(holding?.current_price_per_unit);
  const baseCurrencyRaw =
    typeof holding?.price_currency === 'string' && holding.price_currency.trim().length > 0
      ? holding.price_currency.trim().toUpperCase()
      : typeof holding?.currency === 'string' && holding.currency.trim().length > 0
        ? holding.currency.trim().toUpperCase()
        : 'SEK';

  const fallbackValue = parseNumericValue(holding?.current_value) ?? 0;
  const fallbackCurrency = baseCurrencyRaw;

  const hasDirectPrice = pricePerUnit !== null && quantity > 0;
  const rawValue = hasDirectPrice ? pricePerUnit * quantity : fallbackValue;
  const valueCurrency = hasDirectPrice ? baseCurrencyRaw : fallbackCurrency;
  const valueInSEK = convertToSek(rawValue, valueCurrency, rates) ?? 0;

  const pricePerUnitInSEK = pricePerUnit !== null
    ? convertToSek(pricePerUnit, baseCurrencyRaw, rates)
    : quantity > 0
      ? valueInSEK / quantity
      : null;

  return {
    quantity,
    pricePerUnit,
    priceCurrency: baseCurrencyRaw,
    valueInOriginalCurrency: rawValue,
    valueCurrency,
    valueInSEK,
    pricePerUnitInSEK,
    hasDirectPrice,
  };
};

export const formatCurrency = (amount: number, currency: string = 'SEK', locale: string = 'sv-SE'): string => {
  if (!amount && amount !== 0) return '0 kr';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch (error) {
    const symbols = {
      SEK: 'kr',
      USD: '$',
      EUR: '€',
      GBP: '£',
      NOK: 'kr',
      DKK: 'kr',
      JPY: '¥',
      CHF: 'CHF',
      CAD: 'C$',
      AUD: 'A$',
    } as const;

    const symbol = symbols[currency as keyof typeof symbols] || currency;
    return `${Math.round(amount).toLocaleString()} ${symbol}`;
  }
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols = {
    SEK: 'kr',
    USD: '$',
    EUR: '€',
    GBP: '£',
    NOK: 'kr',
    DKK: 'kr',
    JPY: '¥',
    CHF: 'CHF',
    CAD: 'C$',
    AUD: 'A$',
  } as const;

  return symbols[currency as keyof typeof symbols] || currency;
};

export const getNormalizedValue = (holding: HoldingLike, rates?: ExchangeRates): number => {
  return resolveHoldingValue(holding, rates).valueInSEK;
};

export const calculateTotalPortfolioValue = (holdings: HoldingLike[], rates?: ExchangeRates): number => {
  return holdings.reduce((total, holding) => {
    return total + resolveHoldingValue(holding, rates).valueInSEK;
  }, 0);
};

export const __internal = {
  buildRatesFromFallback,
  getCachedRates: () => cachedRates,
  setCachedRates: (entry: ForexRateCacheEntry | null) => {
    cachedRates = entry;
  },
};
