
-- Add comprehensive RLS policies for stock_case_follows table
ALTER TABLE public.stock_case_follows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view follow counts (needed for public functionality)
CREATE POLICY "Anyone can view follow counts" ON public.stock_case_follows
FOR SELECT USING (true);

-- Policy: Users can only create follows for themselves
CREATE POLICY "Users can create their own follows" ON public.stock_case_follows
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own follows
CREATE POLICY "Users can delete their own follows" ON public.stock_case_follows
FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for user_follows table (if not already present)
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all follows (needed for follow functionality)
CREATE POLICY "Anyone can view follows" ON public.user_follows
FOR SELECT USING (true);

-- Policy: Users can only create follows where they are the follower
CREATE POLICY "Users can create follows as follower" ON public.user_follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can only delete follows where they are the follower
CREATE POLICY "Users can delete their own follows" ON public.user_follows
FOR DELETE USING (auth.uid() = follower_id);

-- Add bounds validation function for financial inputs
CREATE OR REPLACE FUNCTION public.validate_financial_inputs()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate age bounds
  IF NEW.age IS NOT NULL AND (NEW.age < 18 OR NEW.age > 100) THEN
    RAISE EXCEPTION 'Age must be between 18 and 100';
  END IF;
  
  -- Validate income bounds
  IF NEW.annual_income IS NOT NULL AND NEW.annual_income < 0 THEN
    RAISE EXCEPTION 'Annual income must be non-negative';
  END IF;
  
  -- Validate monthly investment amount
  IF NEW.monthly_investment_amount IS NOT NULL AND NEW.monthly_investment_amount < 0 THEN
    RAISE EXCEPTION 'Monthly investment amount must be non-negative';
  END IF;
  
  -- Validate current portfolio value
  IF NEW.current_portfolio_value IS NOT NULL AND NEW.current_portfolio_value < 0 THEN
    RAISE EXCEPTION 'Current portfolio value must be non-negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for risk profile validation
CREATE TRIGGER validate_risk_profile_inputs
  BEFORE INSERT OR UPDATE ON public.user_risk_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_financial_inputs();
