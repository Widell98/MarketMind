import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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

const EXCHANGE_RATES_CACHE_TABLE = "exchange_rates_cache";
const CACHE_BASE_CURRENCY = "SEK";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? null;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials are not configured. Skipping exchange rate caching.");
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }

  return supabaseClient;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const normalizeRates = (rates: Record<string, number> | null | undefined): Record<string, number> => {
  const normalized: Record<string, number> = { ...DEFAULT_EXCHANGE_RATES };

  if (!rates) {
    return normalized;
  }

  for (const [currency, defaultRate] of Object.entries(DEFAULT_EXCHANGE_RATES)) {
    const incoming = rates[currency];
    if (isNumber(incoming) && incoming > 0) {
      normalized[currency] = incoming;
    } else {
      normalized[currency] = defaultRate;
    }
  }

  return normalized;
};

interface CachedExchangeRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

interface ExchangeRatesCacheRow {
  base_currency: string;
  rates: Record<string, number> | null;
  fetched_at: string | null;
}

const getCachedExchangeRates = async (): Promise<CachedExchangeRates | null> => {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from<ExchangeRatesCacheRow>(EXCHANGE_RATES_CACHE_TABLE)
      .select("rates, fetched_at")
      .eq("base_currency", CACHE_BASE_CURRENCY)
      .maybeSingle();

    if (error) {
      console.error("Failed to read cached exchange rates:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const fetchedAt = data.fetched_at ? Date.parse(data.fetched_at) : NaN;
    if (!Number.isFinite(fetchedAt)) {
      return null;
    }

    return {
      rates: normalizeRates(data.rates ?? null),
      fetchedAt,
    };
  } catch (error) {
    console.error("Error retrieving cached exchange rates:", error);
    return null;
  }
};

const cacheExchangeRates = async (rates: Record<string, number>) => {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    const { error } = await client
      .from(EXCHANGE_RATES_CACHE_TABLE)
      .upsert({
        base_currency: CACHE_BASE_CURRENCY,
        rates,
        fetched_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to cache exchange rates:", error);
    }
  } catch (error) {
    console.error("Error while caching exchange rates:", error);
  }
};

interface FinnhubResult {
  rates: Record<string, number>;
  fetchedFromFinnhub: boolean;
}

export const fetchExchangeRatesFromFinnhub = async (): Promise<FinnhubResult> => {
  const apiKey = Deno.env.get("FINNHUB_API_KEY");
  if (!apiKey) {
    console.warn("FINNHUB_API_KEY is not configured. Falling back to default exchange rates.");
    return { rates: { ...DEFAULT_EXCHANGE_RATES }, fetchedFromFinnhub: false };
  }

  const url = new URL("https://finnhub.io/api/v1/forex/rates");
  url.searchParams.set("base", CACHE_BASE_CURRENCY);
  url.searchParams.set("token", apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub exchange rates request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as FinnhubRatesResponse;
    const quotes = isRecord(data) && isRecord(data.quote) ? data.quote : null;

    if (!quotes) {
      throw new Error("Finnhub response did not contain quote data");
    }

    const rates: Record<string, number> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency === CACHE_BASE_CURRENCY) {
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

    return { rates: normalizeRates(rates), fetchedFromFinnhub: true };
  } catch (error) {
    console.error("Failed to fetch exchange rates from Finnhub:", error);
    return { rates: { ...DEFAULT_EXCHANGE_RATES }, fetchedFromFinnhub: false };
  }
};

export const getExchangeRates = async (): Promise<Record<string, number>> => {
  const cached = await getCachedExchangeRates();
  if (cached && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) {
    return cached.rates;
  }

  const { rates: freshRates, fetchedFromFinnhub } = await fetchExchangeRatesFromFinnhub();

  if (fetchedFromFinnhub) {
    await cacheExchangeRates(freshRates);
    return freshRates;
  }

  if (cached) {
    return cached.rates;
  }

  await cacheExchangeRates(freshRates);
  return freshRates;
};
