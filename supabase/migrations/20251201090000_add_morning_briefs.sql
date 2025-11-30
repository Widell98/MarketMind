-- Create storage for daily AI-generated morning briefs
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.morning_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL,
  headline text NOT NULL,
  overview text NOT NULL,
  key_highlights text[] NOT NULL DEFAULT '{}',
  focus_today text[] NOT NULL DEFAULT '{}',
  sentiment text NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  news_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  digest_hash text NOT NULL UNIQUE,
  raw_payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_morning_briefs_generated_at
  ON public.morning_briefs (generated_at DESC);

-- Replace any existing cron job with the same name
DELETE FROM cron.job WHERE jobname = 'generate-morning-brief';

SELECT cron.schedule(
  'generate-morning-brief',
  '0 6 * * 1-5', -- Weekdays at 06:00 UTC (07:00 CET standard time)
  $$
  SELECT
    net.http_post(
      url:='https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/fetch-news-data',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkzNjcyMywiZXhwIjoyMDYzNTEyNzIzfQ.Z8z2JmI_x6yf5dKwqPUqzTR0j2JmQ5-KgPjJQYxUrWE"}'::jsonb,
      body:='{"type":"news","forceRefresh":true,"persist":true,"scheduled":true}'::jsonb
    ) AS request_id;
  $$
);
