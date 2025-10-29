-- Skapa tabell för att cacha valutakurser från Finnhub
CREATE TABLE IF NOT EXISTS public.exchange_rates_cache (
  base_currency TEXT PRIMARY KEY,
  rates JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_cache_fetched_at
  ON public.exchange_rates_cache(fetched_at);
