import { getExchangeRates } from '../supabase/functions/_shared/currency.ts';

const DEFAULT_BASE = 'SEK';

type RequestLike = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  end: () => void;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method && req.method !== 'GET' && req.method !== 'OPTIONS') {
    res.setHeader('Allow', 'GET,OPTIONS');
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const query = req.query ?? {};
  const requestedBaseRaw = typeof query.base === 'string' ? query.base : Array.isArray(query.base)
    ? query.base[0]
    : undefined;
  const base = (requestedBaseRaw ?? DEFAULT_BASE).toUpperCase();

  try {
    const rates = await getExchangeRates(base);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    res.status(200).json({
      success: true,
      base: rates.base,
      fetchedAt: rates.fetchedAt,
      source: rates.source,
      rates: rates.rates,
    });
  } catch (error) {
    console.error('Failed to fetch exchange rates via API route', error);
    res.status(500).json({ success: false, error: 'Unable to fetch exchange rates' });
  }
}
