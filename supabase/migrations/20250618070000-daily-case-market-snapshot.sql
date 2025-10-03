-- Create tables for daily cases and market snapshots
create table if not exists public.daily_cases (
  id uuid primary key default gen_random_uuid(),
  case_date date not null unique,
  company_name text not null,
  ticker text not null,
  summary text not null,
  thesis jsonb,
  upside numeric,
  downside numeric,
  tavily_payload jsonb,
  gpt_raw jsonb,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  sentiment_label text not null,
  narrative text not null,
  highlights jsonb,
  indices jsonb not null,
  sector_heatmap jsonb,
  tavily_payload jsonb,
  gpt_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.increment_vote(case_id uuid, direction text)
returns public.daily_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.daily_cases;
begin
  update public.daily_cases
  set
    upvotes = upvotes + case when direction = 'up' then 1 else 0 end,
    downvotes = downvotes + case when direction = 'down' then 1 else 0 end,
    updated_at = now()
  where id = case_id
  returning * into updated_row;

  if updated_row is null then
    raise exception 'Daily case with id % was not found', case_id;
  end if;

  return updated_row;
end;
$$;

grant select on public.daily_cases to authenticated, anon;
grant select on public.market_snapshots to authenticated, anon;

grant execute on function public.increment_vote(uuid, text) to authenticated;

grant execute on function public.increment_vote(uuid, text) to service_role;
