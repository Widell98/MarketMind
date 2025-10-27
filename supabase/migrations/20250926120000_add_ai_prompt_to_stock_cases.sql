ALTER TABLE public.stock_cases
  ADD COLUMN IF NOT EXISTS ai_prompt text;
