const isBrowser = () => typeof window !== 'undefined';

export type PolymarketAnalyticsPayload = {
  event: string;
  [key: string]: unknown;
};

export const trackPolymarketMetric = (payload: PolymarketAnalyticsPayload) => {
  if (!isBrowser()) {
    return;
  }

  const detail = {
    namespace: 'polymarket',
    timestamp: new Date().toISOString(),
    ...payload,
  };

  window.dispatchEvent(new CustomEvent('polymarket:metric', { detail }));

  const analytics = window.va as undefined | ((event: string, data?: Record<string, unknown>) => void);
  if (typeof analytics === 'function') {
    analytics('event', {
      name: 'polymarket_metric',
      data: detail,
    });
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[polymarket:analytics]', detail);
  }
};
