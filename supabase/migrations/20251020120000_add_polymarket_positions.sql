-- Create polymarket_positions table
create table if not exists public.polymarket_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id text not null,
  market_question text,
  market_url text,
  outcome_id text,
  outcome_name text,
  entry_odds numeric not null,
  stake numeric not null default 0,
  status text not null default 'open',
  close_time timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.polymarket_positions enable row level security;

create policy "Users can view their own polymarket positions" on public.polymarket_positions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own polymarket positions" on public.polymarket_positions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own polymarket positions" on public.polymarket_positions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own polymarket positions" on public.polymarket_positions
  for delete using (auth.uid() = user_id);

create index if not exists polymarket_positions_user_id_idx
  on public.polymarket_positions (user_id);
