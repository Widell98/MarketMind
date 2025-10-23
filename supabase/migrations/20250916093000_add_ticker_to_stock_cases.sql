-- Add ticker column to stock_cases for storing real company symbols
alter table public.stock_cases
  add column if not exists ticker text;

create index if not exists stock_cases_ticker_idx on public.stock_cases (ticker);
