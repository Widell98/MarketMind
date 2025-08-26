-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule portfolio price updates every 30 minutes
SELECT cron.schedule(
  'update-portfolio-prices-every-30-min',
  '*/30 * * * *',
  'SELECT net.http_post(
    url := ''https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/update-portfolio-prices'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzY3MjMsImV4cCI6MjA2MzUxMjcyM30.x89y179_8EDl1NwTryhXfUDMzdxrnfomZfRmhmySMhM"}''::jsonb,
    body := ''{}''::jsonb
  );'
);