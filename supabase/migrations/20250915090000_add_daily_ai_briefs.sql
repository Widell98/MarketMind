-- Create table for storing daily AI briefs generated for each user portfolio
CREATE TABLE IF NOT EXISTS public.daily_ai_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  portfolio_id uuid NOT NULL REFERENCES public.user_portfolios (id) ON DELETE CASCADE,
  headline text NOT NULL,
  summary text,
  highlights jsonb DEFAULT '[]'::jsonb,
  cta_url text,
  tavily_results jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure fast lookups for the latest brief per user/portfolio
CREATE INDEX IF NOT EXISTS idx_daily_ai_briefs_user_portfolio
  ON public.daily_ai_briefs (user_id, portfolio_id, created_at DESC);

-- Enable pg_cron extension to allow scheduling if it isn't already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily brief generator to run every weekday morning at 06:30 UTC
SELECT cron.schedule(
  'generate-daily-brief',
  '30 6 * * 1-5',
  $$
  SELECT
    net.http_post(
      url:='https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/generate-daily-brief',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    )
  $$
);
