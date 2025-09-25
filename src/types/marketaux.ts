export type MarketauxIntent = 'news' | 'report';

export interface MarketauxItem {
  id: string;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  source?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface MarketauxResponsePayload {
  source: 'marketaux';
  intent: MarketauxIntent;
  symbol?: string | null;
  query?: string;
  fetchedAt: string;
  summary?: string[];
  items?: MarketauxItem[];
  raw?: unknown;
}

export interface MarketauxDetectionResult {
  intent: MarketauxIntent;
  symbol?: string;
}
