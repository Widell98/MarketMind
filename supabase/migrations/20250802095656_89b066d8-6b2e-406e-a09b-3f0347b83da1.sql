-- Add currency support to stock_cases table
ALTER TABLE public.stock_cases 
ADD COLUMN currency text DEFAULT 'SEK'::text;