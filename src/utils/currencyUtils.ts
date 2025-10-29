// Simple currency conversion utility
// Fetches live exchange rates from Finnhub when possible, while keeping
// sensible fallbacks so calculations keep working offline or during API
// outages.

export interface ExchangeRates {
  [key: string]: number;
}

const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  SEK: 1.0,
};

const SUPPORTED_CURRENCIES = ['SEK', 'USD', 'EUR', 'GBP', 'NOK', 'DKK', 'JPY', 'CHF', 'CAD', 'AUD'];

const EXCHANGE_RATES_STORAGE_KEY = 'marketmind.exchangeRates.sekBase';

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('LocalStorage är inte tillgänglig, sparade växelkurser ignoreras.', error);
    return null;
  }
};

interface PersistedExchangeRates {
  rates: ExchangeRates;
  updatedAt: number;
}

const loadPersistedExchangeRates = (): PersistedExchangeRates | null => {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const stored = storage.getItem(EXCHANGE_RATES_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<PersistedExchangeRates> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (!parsed.rates || typeof parsed.rates !== 'object') {
      return null;
    }

    if (typeof parsed.updatedAt !== 'number' || Number.isNaN(parsed.updatedAt)) {
      return null;
    }

    const normalizedRates: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES };
    for (const currency of SUPPORTED_CURRENCIES) {
      const value = (parsed.rates as ExchangeRates)[currency];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        normalizedRates[currency] = value;
      }
    }

    return {
      updatedAt: parsed.updatedAt,
      rates: normalizedRates,
    };
  } catch (error) {
    console.warn('Kunde inte läsa sparade växelkurser från localStorage.', error);
    return null;
  }
};

const persistExchangeRates = (rates: ExchangeRates) => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    const sanitizedRates: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES };
    for (const currency of SUPPORTED_CURRENCIES) {
      const value = rates[currency];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        sanitizedRates[currency] = value;
      }
    }

    const payload: PersistedExchangeRates = {
      updatedAt: Date.now(),
      rates: sanitizedRates,
    };

    storage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Kunde inte spara växelkurser i localStorage.', error);
  }
};

const persistedExchangeRates = loadPersistedExchangeRates();

export let EXCHANGE_RATES: ExchangeRates =
  persistedExchangeRates?.rates ?? { ...DEFAULT_EXCHANGE_RATES };

const FINNHUB_API_KEY = import.meta.env?.VITE_FINNHUB_API_KEY as string | undefined;
const FINNHUB_BASE_CURRENCY = 'SEK';
const FINNHUB_ENDPOINT = 'https://finnhub.io/api/v1/forex/rates';
const EXCHANGE_REFRESH_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

interface FinnhubRatesResponse {
  base?: string;
  quote?: Record<string, unknown>;
}

let lastSuccessfulRatesUpdate: number | null = persistedExchangeRates?.updatedAt ?? null;
let ongoingRatesFetch: Promise<ExchangeRates> | null = null;

const parseFinnhubRates = (response: FinnhubRatesResponse): ExchangeRates | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (typeof response.base !== 'string' || response.base.toUpperCase() !== FINNHUB_BASE_CURRENCY) {
    return null;
  }

  if (!response.quote || typeof response.quote !== 'object') {
    return null;
  }

  const rates: ExchangeRates = { [FINNHUB_BASE_CURRENCY]: 1 };

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === FINNHUB_BASE_CURRENCY) {
      rates[currency] = 1;
      continue;
    }

    const rawQuote = response.quote[currency];
    if (typeof rawQuote === 'number' && Number.isFinite(rawQuote) && rawQuote > 0) {
      // Finnhub returns how much of the quote currency equals 1 SEK.
      // To get 1 unit of the foreign currency in SEK we invert the quote.
      rates[currency] = 1 / rawQuote;
    } else if (typeof rawQuote === 'string') {
      const parsed = parseFloat(rawQuote);
      if (Number.isFinite(parsed) && parsed > 0) {
        rates[currency] = 1 / parsed;
      }
    }
  }

  return rates;
};

const fetchExchangeRatesFromFinnhub = async (): Promise<ExchangeRates | null> => {
  if (typeof fetch !== 'function') {
    return null;
  }

  if (!FINNHUB_API_KEY) {
    console.warn('FINNHUB_API_KEY saknas – använder sparade eller fallbackkurser.');
    return null;
  }

  try {
    const url = new URL(FINNHUB_ENDPOINT);
    url.searchParams.set('base', FINNHUB_BASE_CURRENCY);
    url.searchParams.set('token', FINNHUB_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Finnhub exchange rate request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as FinnhubRatesResponse;
    const parsed = parseFinnhubRates(json);

    if (!parsed) {
      throw new Error('Finnhub exchange rate response saknar giltiga data.');
    }

    return { ...DEFAULT_EXCHANGE_RATES, ...EXCHANGE_RATES, ...parsed };
  } catch (error) {
    console.warn('Kunde inte hämta växelkurser från Finnhub, använder sparade eller fallbackkurser.', error);
    return null;
  }
};

const shouldRefreshRates = (): boolean => {
  if (!lastSuccessfulRatesUpdate) {
    return true;
  }

  return Date.now() - lastSuccessfulRatesUpdate > EXCHANGE_REFRESH_INTERVAL_MS;
};

export const refreshExchangeRates = async (force = false): Promise<ExchangeRates> => {
  if (!force && !shouldRefreshRates()) {
    return EXCHANGE_RATES;
  }

  if (!ongoingRatesFetch) {
    ongoingRatesFetch = fetchExchangeRatesFromFinnhub()
      .then((rates) => {
        if (rates) {
          EXCHANGE_RATES = rates;
          lastSuccessfulRatesUpdate = Date.now();
          persistExchangeRates(EXCHANGE_RATES);
        }

        return EXCHANGE_RATES;
      })
      .finally(() => {
        ongoingRatesFetch = null;
      });
  }

  const activeFetch = ongoingRatesFetch;

  if (!activeFetch) {
    return EXCHANGE_RATES;
  }

  try {
    return await activeFetch;
  } catch (error) {
    console.warn('Fel vid hämtning av växelkurser från Finnhub:', error);
    return EXCHANGE_RATES;
  }
};

const triggerBackgroundRefresh = () => {
  if (shouldRefreshRates()) {
    void refreshExchangeRates();
  }
};

// Kick off an initial background refresh as soon as the module is loaded in a browser
if (typeof window !== 'undefined') {
  triggerBackgroundRefresh();
}

/**
 * Convert amount from one currency to SEK
 */
export const convertToSEK = (amount: number, fromCurrency: string): number => {
  if (!amount || amount === 0) return 0;

  triggerBackgroundRefresh();

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

  triggerBackgroundRefresh();

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
