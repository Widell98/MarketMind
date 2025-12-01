-- Create table to persist generated news articles linked to each morning brief
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references public.morning_briefs(id) on delete cascade,
  headline text not null,
  summary text not null,
  category text not null default 'global',
  source text not null default 'Okänd källa',
  url text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for quick lookups of latest articles per brief
create index if not exists news_articles_brief_published_idx
  on public.news_articles (brief_id, published_at desc);
