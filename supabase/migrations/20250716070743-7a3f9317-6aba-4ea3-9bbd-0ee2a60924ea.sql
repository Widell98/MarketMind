
-- Add cash/liquidity tracking to user holdings
ALTER TABLE public.user_holdings 
ADD COLUMN is_cash BOOLEAN DEFAULT false;

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.user_holdings.is_cash IS 'Indicates if this holding represents cash/liquidity rather than a security';

-- Add cash balance tracking to user portfolios
ALTER TABLE public.user_portfolios 
ADD COLUMN cash_balance NUMERIC DEFAULT 0,
ADD COLUMN cash_currency TEXT DEFAULT 'SEK';

-- Add comments
COMMENT ON COLUMN public.user_portfolios.cash_balance IS 'Available cash/liquidity amount';
COMMENT ON COLUMN public.user_portfolios.cash_currency IS 'Currency for cash balance';
