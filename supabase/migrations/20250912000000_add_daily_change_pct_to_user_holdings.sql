alter table public.user_holdings
  add column if not exists daily_change_pct numeric;
