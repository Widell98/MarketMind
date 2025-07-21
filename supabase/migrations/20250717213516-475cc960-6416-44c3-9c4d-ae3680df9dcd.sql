
-- Add allocation column to user_holdings table
ALTER TABLE public.user_holdings 
ADD COLUMN allocation numeric;

-- Add a comment to describe the column
COMMENT ON COLUMN public.user_holdings.allocation IS 'Percentage allocation for portfolio recommendations (0-100)';
