import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __internal, convertToSek, getExchangeRates } from '../currency.ts';

describe('currency helper', () => {
  beforeEach(() => {
    __internal.rateCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.FINNHUB_API_KEY;
    __internal.rateCache.clear();
  });

  it('fetches rates from Finnhub and caches the result', async () => {
    process.env.FINNHUB_API_KEY = 'test-token';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        base: 'USD',
        quote: {
          SEK: 10.5,
          EUR: 0.9,
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const first = await getExchangeRates('USD');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(first.source).toBe('finnhub');
    expect(first.rates.USD).toBeCloseTo(10.5);
    expect(first.rates.EUR).toBeCloseTo((1 / 0.9) * 10.5);

    const second = await getExchangeRates('USD');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second.source).toBe('cache');
    expect(second.rates.EUR).toBeCloseTo((1 / 0.9) * 10.5);
  });

  it('falls back to static rates when the API request fails', async () => {
    process.env.FINNHUB_API_KEY = 'test-token';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await getExchangeRates('SEK');
    expect(result.source).toBe('fallback');
    expect(result.rates.USD).toBeGreaterThan(0);
  });

  it('uses fallback rates when no API key is configured', async () => {
    const result = await getExchangeRates('SEK');
    expect(result.source).toBe('fallback');
    expect(result.rates.USD).toBeGreaterThan(0);
  });

  it('converts amounts to SEK using provided rates', () => {
    const rates = { SEK: 1, USD: 10 };
    const converted = convertToSek(2, 'USD', rates);
    expect(converted).toBe(20);
  });

  it('falls back to static conversion when a rate is missing', () => {
    const converted = convertToSek(2, 'USD', { SEK: 1 });
    expect(converted).toBeGreaterThan(0);
  });
});
