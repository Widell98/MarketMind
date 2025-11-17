create table if not exists public.morning_briefs (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null,
  sentiment text check (sentiment in ('bullish','bearish','neutral')) default 'neutral',
  payload jsonb not null,
  source_snapshot jsonb not null,
  hash text not null unique,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create index if not exists morning_briefs_generated_at_idx on public.morning_briefs (generated_at desc);

alter table public.morning_briefs enable row level security;

drop policy if exists "Allow read access to morning briefs" on public.morning_briefs;

create policy "Allow read access to morning briefs"
  on public.morning_briefs
  for select
  using (true);
