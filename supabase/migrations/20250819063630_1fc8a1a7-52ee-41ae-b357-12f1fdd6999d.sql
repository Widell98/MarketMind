-- Add timeframe column to stock_cases table
ALTER TABLE public.stock_cases 
ADD COLUMN IF NOT EXISTS timeframe TEXT;