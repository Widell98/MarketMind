-- Cache table for Finnhub ticker prices to reduce API calls and handle outages
CREATE TABLE IF NOT EXISTS public.ticker_price_cache (
  symbol TEXT PRIMARY KEY,
  price DOUBLE PRECISION NOT NULL,
  currency TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticker_price_cache_fetched_at
  ON public.ticker_price_cache(fetched_at);
