-- Create table for storing generated Discover report summaries
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.discover_report_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  report_title text NOT NULL,
  summary text NOT NULL,
  key_points text[] DEFAULT ARRAY[]::text[],
  key_metrics jsonb,
  ceo_commentary text,
  source_type text,
  source_url text,
  source_document_name text,
  source_document_id uuid REFERENCES public.chat_documents(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discover_report_summaries_created_at
  ON public.discover_report_summaries (created_at DESC);

ALTER TABLE public.discover_report_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to discover report summaries" ON public.discover_report_summaries;
CREATE POLICY "Allow public read access to discover report summaries"
  ON public.discover_report_summaries
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role to insert discover report summaries" ON public.discover_report_summaries;
CREATE POLICY "Allow service role to insert discover report summaries"
  ON public.discover_report_summaries
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update discover report summaries" ON public.discover_report_summaries;
CREATE POLICY "Allow service role to update discover report summaries"
  ON public.discover_report_summaries
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to delete discover report summaries" ON public.discover_report_summaries;
CREATE POLICY "Allow service role to delete discover report summaries"
  ON public.discover_report_summaries
  FOR DELETE
  USING (auth.role() = 'service_role');
