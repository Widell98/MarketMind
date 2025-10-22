
-- Add preferred_stock_count column to user_risk_profiles table
ALTER TABLE public.user_risk_profiles 
ADD COLUMN preferred_stock_count integer DEFAULT 8;

-- Add a check constraint to ensure reasonable values (between 1 and 50 stocks)
ALTER TABLE public.user_risk_profiles 
ADD CONSTRAINT check_preferred_stock_count 
CHECK (preferred_stock_count IS NULL OR (preferred_stock_count >= 1 AND preferred_stock_count <= 50));
