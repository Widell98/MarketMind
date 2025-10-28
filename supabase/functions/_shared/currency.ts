const FALLBACK_SEK_RATES: Record<string, number> = {
  SEK: 1,
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

type CacheEntry = {
  fetchedAt: number;
  base: string;
  rates: Record<string, number>;
  source: "finnhub" | "fallback";
};

const rateCache = new Map<string, CacheEntry>();

const getGlobalEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process?.env?.[key]) {
    return process.env[key];
  }

  const globalWithDeno = globalThis as globalThis & {
    Deno?: {
      env?: {
        get?: (k: string) => string | undefined;
      };
    };
  };

  const denoEnvGetter = globalWithDeno.Deno?.env?.get;
  return typeof denoEnvGetter === "function" ? denoEnvGetter(key) ?? undefined : undefined;
};

const buildRatesFromFallback = (base: string): Record<string, number> => {
  const normalizedBase = base.toUpperCase();
  const baseToSek = FALLBACK_SEK_RATES[normalizedBase];
  if (!baseToSek) {
    return { ...FALLBACK_SEK_RATES };
  }

  const result: Record<string, number> = {};
  for (const [currency, rateToSek] of Object.entries(FALLBACK_SEK_RATES)) {
    if (!rateToSek || rateToSek <= 0) continue;
    if (currency === normalizedBase) {
      result[currency] = 1;
      continue;
    }
    result[currency] = rateToSek / baseToSek;
  }
  result[normalizedBase] = 1;
  return result;
};

const normaliseRatesToSek = (
  base: string,
  quote: Record<string, number> | undefined,
): Record<string, number> | null => {
  if (!quote) return null;

  const normalizedBase = base.toUpperCase();
  const result: Record<string, number> = { SEK: 1 };

  if (normalizedBase === "SEK") {
    for (const [currency, value] of Object.entries(quote)) {
      const upper = currency.toUpperCase();
      if (upper === "SEK") {
        result.SEK = 1;
        continue;
      }
      if (typeof value === "number" && value > 0) {
        result[upper] = 1 / value;
      }
    }
    result.SEK = 1;
    return result;
  }

  const sekPerBase = quote.SEK;
  if (typeof sekPerBase !== "number" || sekPerBase <= 0) {
    return null;
  }

  result[normalizedBase] = sekPerBase;

  for (const [currency, value] of Object.entries(quote)) {
    const upper = currency.toUpperCase();
    if (upper === "SEK") continue;
    if (typeof value !== "number" || value <= 0) continue;

    if (upper === normalizedBase) {
      result[upper] = sekPerBase;
      continue;
    }

    result[upper] = (1 / value) * sekPerBase;
  }

  return result;
};

export type ExchangeRateResult = {
  base: string;
  fetchedAt: number;
  rates: Record<string, number>;
  source: "finnhub" | "fallback" | "cache";
};

export const getExchangeRates = async (base = "SEK"): Promise<ExchangeRateResult> => {
  const normalizedBase = base.toUpperCase();
  const now = Date.now();
  const cached = rateCache.get(normalizedBase);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      base: cached.base,
      fetchedAt: cached.fetchedAt,
      rates: cached.rates,
      source: "cache",
    };
  }

  const apiKey = getGlobalEnv("FINNHUB_API_KEY");
  if (!apiKey) {
    const fallbackRates = buildRatesFromFallback(normalizedBase);
    const entry: CacheEntry = {
      base: normalizedBase,
      fetchedAt: now,
      rates: fallbackRates,
      source: "fallback",
    };
    rateCache.set(normalizedBase, entry);
    return { ...entry, source: "fallback" };
  }

  const url = `https://finnhub.io/api/v1/forex/rates?base=${encodeURIComponent(normalizedBase)}&token=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Finnhub request failed with status ${response.status}`);
    const payload: { base?: string; quote?: Record<string, number> } = await response.json();
    const rates = normaliseRatesToSek(payload.base ?? normalizedBase, payload.quote);

    if (!rates || Object.keys(rates).length === 0) {
      throw new Error("Missing exchange rate data from Finnhub");
    }

    const entry: CacheEntry = {
      base: normalizedBase,
      fetchedAt: now,
      rates,
      source: "finnhub",
    };
    rateCache.set(normalizedBase, entry);

    return { ...entry };
  } catch (error) {
    console.warn("Failed to load exchange rates from Finnhub", error);
    const fallbackRates = buildRatesFromFallback(normalizedBase);
    const entry: CacheEntry = {
      base: normalizedBase,
      fetchedAt: now,
      rates: fallbackRates,
      source: "fallback",
    };
    rateCache.set(normalizedBase, entry);
    return { ...entry };
  }
};

export const convertToSek = (
  amount: number | null | undefined,
  currency?: string | null,
  rates?: Record<string, number>,
): number | null => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;

  const normalizedCurrency = currency?.toUpperCase() ?? "SEK";
  if (normalizedCurrency === "SEK") return amount;

  const activeRates = rates ?? rateCache.get("SEK")?.rates ?? buildRatesFromFallback("SEK");
  const rate = activeRates?.[normalizedCurrency];

  if (typeof rate === "number" && Number.isFinite(rate)) {
    return amount * rate;
  }

  const fallback = buildRatesFromFallback("SEK");
  const fallbackRate = fallback[normalizedCurrency];

  return typeof fallbackRate === "number" && Number.isFinite(fallbackRate) ? amount * fallbackRate : null;
};

export const __internal = {
  buildRatesFromFallback,
  rateCache,
};
