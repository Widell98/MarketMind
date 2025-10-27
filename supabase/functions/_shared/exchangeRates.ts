export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
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

const SUPPORTED_CURRENCIES = Object.keys(DEFAULT_EXCHANGE_RATES);

interface FinnhubRatesResponse {
  base?: string;
  quote?: Record<string, number>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const fetchExchangeRatesFromFinnhub = async (): Promise<Record<string, number>> => {
  const apiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!apiKey) {
    console.warn('FINNHUB_API_KEY is not configured. Falling back to default exchange rates.');
    return { ...DEFAULT_EXCHANGE_RATES };
  }

  const url = new URL('https://finnhub.io/api/v1/forex/rates');
  url.searchParams.set('base', 'SEK');
  url.searchParams.set('token', apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub exchange rates request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as FinnhubRatesResponse;
    const quotes = isRecord(data) && isRecord(data.quote) ? data.quote : null;

    if (!quotes) {
      throw new Error('Finnhub response did not contain quote data');
    }

    const rates: Record<string, number> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency === 'SEK') {
        rates[currency] = 1.0;
        continue;
      }

      const rate = quotes[currency];
      if (isNumber(rate) && rate > 0) {
        rates[currency] = rate;
      } else {
        console.warn(`Finnhub returned invalid rate for ${currency}, using default.`);
        rates[currency] = DEFAULT_EXCHANGE_RATES[currency];
      }
    }

    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates from Finnhub:', error);
    return { ...DEFAULT_EXCHANGE_RATES };
  }
};

export const getExchangeRates = async (): Promise<Record<string, number>> => {
  return await fetchExchangeRatesFromFinnhub();
};
