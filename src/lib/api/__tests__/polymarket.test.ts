import test from 'node:test';
import assert from 'node:assert/strict';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  // @ts-ignore
  globalThis.localStorage = new LocalStorageMock();
}

const eventTarget = new EventTarget();
if (typeof globalThis.window === 'undefined') {
  // @ts-ignore
  globalThis.window = {
    addEventListener: (...args: Parameters<EventTarget['addEventListener']>) => eventTarget.addEventListener(...args),
    removeEventListener: (...args: Parameters<EventTarget['removeEventListener']>) => eventTarget.removeEventListener(...args),
    dispatchEvent: (event: Event) => eventTarget.dispatchEvent(event),
  };
}

const supabaseMock = (globalThis as any).__supabaseMock ?? {
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
};
(globalThis as any).__supabaseMock = supabaseMock;

test('PolymarketClient caches successful responses and reports cache hit metrics', async () => {
  const { featureFlags } = await import('@/config/features');
  featureFlags.polymarket.enabled = true;
  featureFlags.polymarket.cacheTtlMs = 10_000;
  featureFlags.polymarket.rateLimitMs = 0;

  const { supabase } = await import('@/integrations/supabase/client');
  const { PolymarketClient, __testing } = await import('../polymarket');
  __testing.reset();

  let invocations = 0;
  const mockMarkets = [
    {
      id: 'market-1',
      question: 'Kommer inflationen sjunka?',
      categories: ['Macro'],
      liquidity: 12000,
      volume24h: 800,
      outcomes: [
        { id: 'yes', name: 'Ja', price: 0.45, probability: 0.45 },
        { id: 'no', name: 'Nej', price: 0.55, probability: 0.55 },
      ],
    },
  ];

  const originalInvoke = supabase.functions.invoke;
  supabase.functions.invoke = async () => {
    invocations += 1;
    return {
      data: { markets: mockMarkets, fetchedAt: '2024-01-01T00:00:00Z' },
      error: null,
    } as const;
  };

  const metrics: unknown[] = [];
  const listener = (event: Event) => {
    metrics.push((event as CustomEvent).detail);
  };
  window.addEventListener('polymarket:metric', listener);

  try {
    const client = new PolymarketClient({ rateLimitMs: 0, cacheTtlMs: 5_000 });
    const filters = { minLiquidity: 1000 };
    const first = await client.fetchMarkets(filters);
    const second = await client.fetchMarkets(filters);

    assert.equal(invocations, 1, 'second call should use cache');
    assert.equal(first.length, 1);
    assert.equal(second[0].id, 'market-1');
    const cacheMetric = metrics.find((metric: any) => metric?.event === 'cache-hit');
    assert.ok(cacheMetric, 'cache-hit metric should be emitted');
    assert.ok(cacheMetric.hitRate >= 0.5);
  } finally {
    window.removeEventListener('polymarket:metric', listener);
    supabase.functions.invoke = originalInvoke;
    __testing.reset();
  }
});

test('PolymarketClient retries failed fetches and surfaces friendly errors when exhausted', async () => {
  const { featureFlags } = await import('@/config/features');
  featureFlags.polymarket.enabled = true;
  featureFlags.polymarket.rateLimitMs = 0;

  const { supabase } = await import('@/integrations/supabase/client');
  const { PolymarketClient, __testing } = await import('../polymarket');
  __testing.reset();

  let attempt = 0;
  const originalInvoke = supabase.functions.invoke;
  supabase.functions.invoke = async () => {
    attempt += 1;
    if (attempt < 3) {
      return { data: null, error: { message: 'upstream error' } } as const;
    }
    return {
      data: { markets: [], fetchedAt: new Date().toISOString() },
      error: null,
    } as const;
  };

  try {
    const client = new PolymarketClient({ rateLimitMs: 0, maxRetries: 3 });
    const markets = await client.fetchMarkets({});
    assert.equal(markets.length, 0);
    assert.equal(attempt, 3);
  } finally {
    supabase.functions.invoke = originalInvoke;
    __testing.reset();
  }
});

test('PolymarketClient throws a user-friendly error after exhausting retries', async () => {
  const { featureFlags } = await import('@/config/features');
  featureFlags.polymarket.enabled = true;
  featureFlags.polymarket.rateLimitMs = 0;

  const { supabase } = await import('@/integrations/supabase/client');
  const { PolymarketClient, __testing } = await import('../polymarket');
  __testing.reset();

  const originalInvoke = supabase.functions.invoke;
  supabase.functions.invoke = async () => ({
    data: null,
    error: { message: 'network down' },
  });

  try {
    const client = new PolymarketClient({ rateLimitMs: 0, maxRetries: 2 });
    await assert.rejects(async () => client.fetchMarkets({}), (error: any) => {
      return (
        error?.name === 'PolymarketError' &&
        (error?.displayMessage ?? '').startsWith('Kunde inte hämta Polymarket just nu')
      );
    });
  } finally {
    supabase.functions.invoke = originalInvoke;
    __testing.reset();
  }
});
