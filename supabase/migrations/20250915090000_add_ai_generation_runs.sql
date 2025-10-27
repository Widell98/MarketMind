-- Create table for tracking AI generation runs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.ai_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  generated_count integer NOT NULL DEFAULT 0,
  expected_count integer NOT NULL DEFAULT 3,
  error_message text,
  triggered_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Ensure stock_cases can reference AI batches
ALTER TABLE public.stock_cases
  ADD COLUMN IF NOT EXISTS ai_batch_id uuid REFERENCES public.ai_generation_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stock_cases_ai_batch_id ON public.stock_cases(ai_batch_id);

-- Backfill generated_at for existing AI-generated cases
UPDATE public.stock_cases
SET generated_at = COALESCE(generated_at, created_at)
WHERE ai_generated = true;

-- Enable RLS on ai_generation_runs and add policies
ALTER TABLE public.ai_generation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to AI generation runs" ON public.ai_generation_runs;
CREATE POLICY "Allow read access to AI generation runs"
  ON public.ai_generation_runs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role to insert AI generation runs" ON public.ai_generation_runs;
CREATE POLICY "Allow service role to insert AI generation runs"
  ON public.ai_generation_runs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role to update AI generation runs" ON public.ai_generation_runs;
CREATE POLICY "Allow service role to update AI generation runs"
  ON public.ai_generation_runs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
