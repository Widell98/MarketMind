CREATE TABLE public.symbol_prices (
  symbol text PRIMARY KEY,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ensure fast lookups by symbol
CREATE UNIQUE INDEX IF NOT EXISTS symbol_prices_symbol_idx ON public.symbol_prices(symbol);
