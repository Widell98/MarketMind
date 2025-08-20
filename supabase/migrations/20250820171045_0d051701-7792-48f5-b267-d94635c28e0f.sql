-- Enable required extensions and schedule 30-min updates for portfolio prices
create extension if not exists pg_cron;
create extension if not exists pg_net;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.jobs WHERE jobname = 'update-portfolio-prices-every-30-min'
  ) THEN
    PERFORM cron.schedule(
      'update-portfolio-prices-every-30-min',
      '*/30 * * * *',
      $$
      select net.http_post(
        url := 'https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/update-portfolio-prices',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzY3MjMsImV4cCI6MjA2MzUxMjcyM30.x89y179_8EDl1NwTryhXfUDMzdxrnfomZfRmhmySMhM"}'::jsonb,
        body := '{}'::jsonb
      );
      $$
    );
  END IF;
END $$;