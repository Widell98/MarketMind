-- Add company logo URL to Discover report summaries
ALTER TABLE public.discover_report_summaries
  ADD COLUMN IF NOT EXISTS company_logo_url text;
