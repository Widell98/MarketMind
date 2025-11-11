create extension if not exists "pgcrypto";

create table if not exists public.edge_function_rate_limits (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  identifier text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  last_request_at timestamptz not null default now()
);

comment on table public.edge_function_rate_limits is 'Tracks per-identifier usage for Supabase Edge Functions to enforce custom rate limits.';

create unique index if not exists edge_function_rate_limits_function_identifier_idx
  on public.edge_function_rate_limits (function_name, identifier);

alter table public.edge_function_rate_limits enable row level security;

create policy "Service role can manage rate limits"
  on public.edge_function_rate_limits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.edge_function_rate_limit_alerts (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  identifier text not null,
  request_count integer not null,
  window_start timestamptz not null,
  occurred_at timestamptz not null default now()
);

comment on table public.edge_function_rate_limit_alerts is 'Audit log for rate limit violations emitted by Supabase Edge Functions.';

create index if not exists edge_function_rate_limit_alerts_fn_identifier_idx
  on public.edge_function_rate_limit_alerts (function_name, identifier, occurred_at desc);

alter table public.edge_function_rate_limit_alerts enable row level security;

create policy "Service role can insert rate limit alerts"
  on public.edge_function_rate_limit_alerts
  for insert
  with check (auth.role() = 'service_role');

create policy "Service role can read rate limit alerts"
  on public.edge_function_rate_limit_alerts
  for select
  using (auth.role() = 'service_role');
