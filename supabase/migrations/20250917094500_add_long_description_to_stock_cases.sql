-- Add long form description storage for AI generated cases
alter table public.stock_cases
  add column if not exists long_description text;
