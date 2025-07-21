
-- Add ai_generated column to stock_cases table
ALTER TABLE public.stock_cases 
ADD COLUMN ai_generated boolean DEFAULT false;

-- Create index for better performance when filtering AI-generated cases
CREATE INDEX idx_stock_cases_ai_generated ON public.stock_cases(ai_generated);

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to run the generate-weekly-cases function twice per week
-- Runs every Tuesday and Friday at 09:00 UTC
SELECT cron.schedule(
  'generate-weekly-cases',
  '0 9 * * 2,5', -- Every Tuesday and Friday at 09:00
  $$
  SELECT
    net.http_post(
        url:='https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/generate-weekly-cases',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZm9sb3BzZGVleXJldmJ1eGZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkzNjcyMywiZXhwIjoyMDYzNTEyNzIzfQ.Z8z2JmI_x6yf5dKwqPUqzTR0j2JmQ5-KgPjJQYxUrWE"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add case categories for AI-generated content
INSERT INTO public.case_categories (name, color) VALUES 
('AI Weekly Pick', '#9333EA'),
('AI Market Analysis', '#7C3AED'),
('AI Sector Insight', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;
