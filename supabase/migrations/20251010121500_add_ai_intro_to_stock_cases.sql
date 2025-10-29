-- Add ai_intro column to stock_cases for AI pitch summaries
ALTER TABLE public.stock_cases
ADD COLUMN IF NOT EXISTS ai_intro text;
