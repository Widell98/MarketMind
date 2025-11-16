import { featureFlags } from '@/config/features';
import { supabase } from '@/integrations/supabase/client';
import { trackPolymarketMetric } from '@/lib/analytics/polymarket';
import type {
  PolymarketMarket,
  PolymarketMarketFilters,
  PolymarketMarketsResponse,
} from '@/types/polymarket';

interface CacheEntry {
  data: PolymarketMarket[];
  fetchedAt: string;
  expiresAt: number;
}

interface PolymarketClientOptions {
  cacheTtlMs?: number;
  rateLimitMs?: number;
  functionName?: string;
  maxRetries?: number;
}

const inMemoryCache = new Map<string, CacheEntry>();
let lastRequestTimestamp = 0;
let cacheLookupCount = 0;
let cacheHitCount = 0;

class PolymarketError extends Error {
  displayMessage?: string;

  constructor(message: string, displayMessage?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PolymarketError';
    this.displayMessage = displayMessage;
  }
}

export class PolymarketClient {
  private readonly cacheTtlMs: number;
  private readonly rateLimitMs: number;
  private readonly functionName: string;
  private readonly maxRetries: number;

  constructor(options?: PolymarketClientOptions) {
    this.cacheTtlMs = options?.cacheTtlMs ?? featureFlags.polymarket.cacheTtlMs;
    this.rateLimitMs = options?.rateLimitMs ?? featureFlags.polymarket.rateLimitMs;
    this.functionName = options?.functionName ?? featureFlags.polymarket.functionName;
    this.maxRetries = options?.maxRetries ?? 3;
  }

  async fetchMarkets(filters?: PolymarketMarketFilters): Promise<PolymarketMarket[]> {
    if (!featureFlags.polymarket.enabled) {
      throw new PolymarketError('Polymarket feature is disabled.', 'Polymarket är avstängt i denna miljö.');
    }

    const cacheKey = JSON.stringify(filters ?? {});
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.recordMetric('cache-hit', {
        filters,
        fetchedAt: cached.fetchedAt,
        hitRate: this.getCacheHitRate(),
      });
      return cached.data;
    }

    await this.enforceRateLimit();

    let lastError: PolymarketError | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const attemptStartedAt = this.now();

      try {
        const { data, error } = await supabase.functions.invoke<PolymarketMarketsResponse>(
          this.functionName,
          { body: { filters } },
        );

        if (error) {
          throw new PolymarketError(
            `Failed to fetch Polymarket markets: ${error.message}`,
            'Kunde inte hämta Polymarket just nu. Försök igen om en stund.',
          );
        }

        const markets = data?.markets ?? [];
        const fetchedAt = data?.fetchedAt ?? new Date().toISOString();

        this.persistCache(cacheKey, markets, fetchedAt);
        this.recordMetric('success', {
          filters,
          durationMs: this.now() - attemptStartedAt,
          attempt: attempt + 1,
          count: markets.length,
        });

        return markets;
      } catch (error) {
        const polymarketError = this.normalizeError(error);
        lastError = polymarketError;
        this.recordMetric('error', {
          filters,
          durationMs: this.now() - attemptStartedAt,
          attempt: attempt + 1,
          message: polymarketError.message,
        });

        if (attempt < this.maxRetries - 1) {
          await this.backoff(attempt);
          continue;
        }

        throw polymarketError;
      }
    }

    throw lastError ?? new PolymarketError('Okänt fel uppstod vid Polymarket-anrop.');
  }

  async fetchMarketById(id: string): Promise<PolymarketMarket | null> {
    const markets = await this.fetchMarkets({ marketIds: [id], limit: 1 });
    return markets.find((market) => market.id === id) ?? null;
  }

  private getFromCache(key: string): CacheEntry | null {
    cacheLookupCount += 1;
    const entry = inMemoryCache.get(key);
    if (!entry) return null;

    const isValid = entry.expiresAt > Date.now();
    if (!isValid) {
      inMemoryCache.delete(key);
      return null;
    }

    cacheHitCount += 1;
    return entry;
  }

  private persistCache(key: string, data: PolymarketMarket[], fetchedAt: string) {
    inMemoryCache.set(key, {
      data,
      fetchedAt,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private async enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - lastRequestTimestamp;

    if (elapsed < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestTimestamp = Date.now();
  }

  private async backoff(attempt: number) {
    const delay = this.rateLimitMs * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private normalizeError(error: unknown): PolymarketError {
    if (error instanceof PolymarketError) return error;

    const message = error instanceof Error ? error.message : 'Okänt fel vid hämtning av Polymarket-data';
    return new PolymarketError(message, 'Kunde inte hämta Polymarket just nu. Försök igen senare.');
  }

  private recordMetric(event: 'success' | 'error' | 'cache-hit', meta: Record<string, unknown>) {
    const payload = {
      namespace: featureFlags.polymarket.monitoringNamespace,
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    trackPolymarketMetric(payload);

    // eslint-disable-next-line no-console
    console.info('[polymarket]', payload);
  }

  private getCacheHitRate() {
    if (!cacheLookupCount) return 0;
    return cacheHitCount / cacheLookupCount;
  }

  private now() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }
}

export const polymarketClient = new PolymarketClient();

export const __testing = {
  reset() {
    inMemoryCache.clear();
    lastRequestTimestamp = 0;
    cacheLookupCount = 0;
    cacheHitCount = 0;
  },
  getCacheStats() {
    return { cacheLookupCount, cacheHitCount };
  },
};
