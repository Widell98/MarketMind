// Simple currency conversion utility
// In a real application, you would fetch live exchange rates from an API

export interface ExchangeRates {
  [key: string]: number;
}

// Base rates to SEK (Swedish Krona)
// These should be updated regularly from a real API in production
export const EXCHANGE_RATES: ExchangeRates = {
  SEK: 1.0,
  USD: 10.5,   // 1 USD = ~10.5 SEK
  EUR: 11.4,   // 1 EUR = ~11.4 SEK
  GBP: 13.2,   // 1 GBP = ~13.2 SEK
  NOK: 0.95,   // 1 NOK = ~0.95 SEK
  DKK: 1.53,   // 1 DKK = ~1.53 SEK
  JPY: 0.07,   // 1 JPY = ~0.07 SEK
  CHF: 11.8,   // 1 CHF = ~11.8 SEK
  CAD: 7.8,    // 1 CAD = ~7.8 SEK
  AUD: 7.0,    // 1 AUD = ~7.0 SEK
};

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
export const getNormalizedValue = (holding: any): number => {
  const value = holding.current_value || 0;
  const currency = holding.currency || 'SEK';
  
  return convertToSEK(value, currency);
};

/**
 * Calculate total portfolio value in SEK from mixed currency holdings
 */
export const calculateTotalPortfolioValue = (holdings: any[]): number => {
  return holdings.reduce((total, holding) => {
    return total + getNormalizedValue(holding);
  }, 0);
};