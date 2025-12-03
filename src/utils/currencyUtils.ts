// Simple currency conversion utility
// Exchange rates are fetched from Google Sheets and can be updated dynamically

import { fetchExchangeRatesFromSheet } from './sheetExchangeRates';

export interface ExchangeRates {
  [key: string]: number;
}

// Base rates to SEK (Swedish Krona)
// These are fallback values used when Google Sheets data is unavailable
const FALLBACK_EXCHANGE_RATES: ExchangeRates = {
  SEK: 1,
  USD: 9.40,
  EUR: 10.92,
  GBP: 12.52,
  NOK: 0.94,
  DKK: 1.46,
  JPY: 0.062,
  CHF: 11.82,
  CAD: 6.70,
  AUD: 6.13,
};

// Current exchange rates (can be updated dynamically)
let currentExchangeRates: ExchangeRates = { ...FALLBACK_EXCHANGE_RATES };

// Cache for exchange rates
const EXCHANGE_RATES_CACHE_KEY = 'marketmind_exchange_rates';
const EXCHANGE_RATES_CACHE_TIMESTAMP_KEY = 'marketmind_exchange_rates_timestamp';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached exchange rates from localStorage
 */
const getCachedExchangeRates = (): ExchangeRates | null => {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
    const timestamp = localStorage.getItem(EXCHANGE_RATES_CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_DURATION_MS) {
      // Cache expired
      return null;
    }
    
    const rates = JSON.parse(cached);
    return rates && typeof rates === 'object' ? rates : null;
  } catch (error) {
    console.error('Error reading cached exchange rates:', error);
    return null;
  }
};

/**
 * Save exchange rates to cache
 */
const saveCachedExchangeRates = (rates: ExchangeRates): void => {
  try {
    localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(EXCHANGE_RATES_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving cached exchange rates:', error);
  }
};

/**
 * Fetch exchange rates from Google Sheets and update current rates
 * Falls back to cached rates if fetch fails, then to static fallback values
 */
export const updateExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const rates = await fetchExchangeRatesFromSheet();
    
    // If we got valid rates (at least SEK should be present)
    if (rates && Object.keys(rates).length > 0 && rates.SEK === 1) {
      currentExchangeRates = { ...rates };
      saveCachedExchangeRates(rates);
      return rates;
    }
    
    // If fetch returned empty or invalid, try cache
    const cached = getCachedExchangeRates();
    if (cached) {
      currentExchangeRates = { ...cached };
      return cached;
    }
    
    // Fallback to static values
    currentExchangeRates = { ...FALLBACK_EXCHANGE_RATES };
    return FALLBACK_EXCHANGE_RATES;
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    
    // Try cache on error
    const cached = getCachedExchangeRates();
    if (cached) {
      currentExchangeRates = { ...cached };
      return cached;
    }
    
    // Fallback to static values
    currentExchangeRates = { ...FALLBACK_EXCHANGE_RATES };
    return FALLBACK_EXCHANGE_RATES;
  }
};

/**
 * Initialize exchange rates from cache or fallback
 * Should be called on app startup
 */
export const initializeExchangeRates = (): ExchangeRates => {
  const cached = getCachedExchangeRates();
  if (cached) {
    currentExchangeRates = { ...cached };
    return cached;
  }
  
  currentExchangeRates = { ...FALLBACK_EXCHANGE_RATES };
  return FALLBACK_EXCHANGE_RATES;
};

/**
 * Get current exchange rates
 * Returns the currently active exchange rates
 */
export const getExchangeRates = (): ExchangeRates => {
  return { ...currentExchangeRates };
};

// Export for backward compatibility
// This now returns the current dynamic rates instead of static values
export const EXCHANGE_RATES: ExchangeRates = new Proxy({} as ExchangeRates, {
  get(target, prop: string) {
    return currentExchangeRates[prop];
  },
  ownKeys() {
    return Object.keys(currentExchangeRates);
  },
  has(target, prop: string) {
    return prop in currentExchangeRates;
  },
  getOwnPropertyDescriptor(target, prop: string) {
    return {
      enumerable: true,
      configurable: true,
      value: currentExchangeRates[prop],
    };
  },
});

/**
 * Convert amount from one currency to SEK
 */
export const convertToSEK = (amount: number, fromCurrency: string): number => {
  if (!amount || amount === 0) return 0;

  const currency = fromCurrency?.trim()?.toUpperCase() || 'SEK';
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

  const currency = toCurrency?.trim()?.toUpperCase() || 'SEK';
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
