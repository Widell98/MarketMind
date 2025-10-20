-- Create table to track AI generation runs
create table if not exists public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  ai_batch_id uuid,
  status text not null default 'pending',
  generated_count integer not null default 0,
  error_message text,
  triggered_by text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.ai_generation_runs is 'Tracks executions of the generate-weekly-cases edge function.';
comment on column public.ai_generation_runs.ai_batch_id is 'UUID applied to the stock_cases rows generated in this run.';
comment on column public.ai_generation_runs.status is 'Execution status such as running, succeeded, or failed.';
comment on column public.ai_generation_runs.generated_count is 'Number of stock cases generated in this run.';
comment on column public.ai_generation_runs.triggered_by is 'Indicates if the run was scheduled or manually triggered.';

-- Ensure status values are controlled via check constraint
do
$$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_generation_runs_status_check'
  ) then
    alter table public.ai_generation_runs
      add constraint ai_generation_runs_status_check
      check (status in ('pending', 'running', 'succeeded', 'failed'));
  end if;
end
$$;

-- Add AI batch metadata to stock_cases
alter table public.stock_cases
  add column if not exists ai_batch_id uuid,
  add column if not exists generated_at timestamptz;

create index if not exists stock_cases_ai_generated_idx on public.stock_cases (ai_generated);
create index if not exists stock_cases_ai_batch_idx on public.stock_cases (ai_batch_id);
