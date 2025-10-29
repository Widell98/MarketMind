import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRates {
  [key: string]: number;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
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

export let EXCHANGE_RATES: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES };

const REFRESH_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
let lastFetchedAt: number | null = null;
let fetchPromise: Promise<ExchangeRates> | null = null;

interface ExchangeRatesResponse {
  success?: boolean;
  rates?: ExchangeRates;
}

const normalizeRates = (rates: ExchangeRates | null | undefined): ExchangeRates => {
  if (!rates) {
    return { ...DEFAULT_EXCHANGE_RATES };
  }

  const normalized: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES };
  for (const [currency, defaultRate] of Object.entries(DEFAULT_EXCHANGE_RATES)) {
    const incoming = rates[currency];
    if (typeof incoming === 'number' && Number.isFinite(incoming) && incoming > 0) {
      normalized[currency] = incoming;
    } else {
      normalized[currency] = defaultRate;
    }
  }

  return normalized;
};

const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  if (typeof window === 'undefined') {
    return EXCHANGE_RATES;
  }

  try {
    const { data, error } = await supabase.functions.invoke<ExchangeRatesResponse>('get-exchange-rates');
    if (error) {
      throw error;
    }

    const updatedRates = normalizeRates(data?.rates);
    EXCHANGE_RATES = updatedRates;
    lastFetchedAt = Date.now();
    return EXCHANGE_RATES;
  } catch (error) {
    console.warn('Failed to refresh exchange rates, using cached values.', error);
    if (!lastFetchedAt) {
      EXCHANGE_RATES = { ...DEFAULT_EXCHANGE_RATES };
    }
    return EXCHANGE_RATES;
  } finally {
    fetchPromise = null;
  }
};

const shouldRefreshRates = (force?: boolean) => {
  if (force) return true;
  if (!lastFetchedAt) return true;
  return Date.now() - lastFetchedAt > REFRESH_INTERVAL_MS;
};

export const refreshExchangeRates = async (options: { force?: boolean } = {}): Promise<ExchangeRates> => {
  if (typeof window === 'undefined') {
    return EXCHANGE_RATES;
  }

  if (!shouldRefreshRates(options.force)) {
    return EXCHANGE_RATES;
  }

  if (!fetchPromise) {
    fetchPromise = fetchExchangeRates();
  }

  return fetchPromise;
};

export const getExchangeRates = (): ExchangeRates => ({ ...EXCHANGE_RATES });

if (typeof window !== 'undefined') {
  void refreshExchangeRates().catch(() => {
    // Errors are logged in fetchExchangeRates; suppress unhandled rejection warnings.
  });
}

/**
 * Convert amount from one currency to SEK
 */
export const convertToSEK = (amount: number, fromCurrency: string): number => {
  if (!amount || amount === 0) return 0;
  
  const currency = fromCurrency?.toUpperCase() || 'SEK';
  const rate = EXCHANGE_RATES[currency];
  
  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${currency}, defaulting to SEK`);
    return amount;
  }
  
  return amount * rate;
};

/**
 * Convert amount from SEK to target currency
 */
export const convertFromSEK = (amountInSEK: number, toCurrency: string): number => {
  if (!amountInSEK || amountInSEK === 0) return 0;
  
  const currency = toCurrency?.toUpperCase() || 'SEK';
  const rate = EXCHANGE_RATES[currency];
  
  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${currency}, defaulting to SEK`);
    return amountInSEK;
  }
  
  return amountInSEK / rate;
};

/**
 * Convert between any two currencies
 */
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (!amount || amount === 0) return 0;

  // First convert to SEK, then to target currency
  const amountInSEK = convertToSEK(amount, fromCurrency);
  return convertFromSEK(amountInSEK, toCurrency);
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

/**
 * Resolve holding value information including normalized SEK totals
 */
export const resolveHoldingValue = (holding: HoldingLike): HoldingValueBreakdown => {
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
  const valueInSEK = convertToSEK(rawValue, valueCurrency);

  const pricePerUnitInSEK = pricePerUnit !== null
    ? convertToSEK(pricePerUnit, baseCurrencyRaw)
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

/**
 * Format currency amount with proper symbol and locale
 */
export const formatCurrency = (amount: number, currency: string = 'SEK', locale: string = 'sv-SE'): string => {
  if (!amount && amount !== 0) return '0 kr';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
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
      AUD: 'A$'
    };
    
    const symbol = symbols[currency as keyof typeof symbols] || currency;
    return `${Math.round(amount).toLocaleString()} ${symbol}`;
  }
};

/**
 * Get currency symbol
 */
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
    AUD: 'A$'
  };
  
  return symbols[currency as keyof typeof symbols] || currency;
};

/**
 * Calculate normalized value for portfolio calculations
 * Converts all holdings to SEK for fair comparison
 */
export const getNormalizedValue = (holding: HoldingLike): number => {
  return resolveHoldingValue(holding).valueInSEK;
};

/**
 * Calculate total portfolio value in SEK from mixed currency holdings
 */
export const calculateTotalPortfolioValue = (holdings: HoldingLike[]): number => {
  return holdings.reduce((total, holding) => {
    return total + resolveHoldingValue(holding).valueInSEK;
  }, 0);
};
