-- Create portfolio performance history table
CREATE TABLE public.portfolio_performance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  holding_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  price_per_unit NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(holding_id, date)
);

-- Enable RLS
ALTER TABLE public.portfolio_performance_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own performance history" 
ON public.portfolio_performance_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance history" 
ON public.portfolio_performance_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance history" 
ON public.portfolio_performance_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_portfolio_performance_user_date ON public.portfolio_performance_history(user_id, date);
CREATE INDEX idx_portfolio_performance_holding ON public.portfolio_performance_history(holding_id);

-- Create foreign key relationship
ALTER TABLE public.portfolio_performance_history 
ADD CONSTRAINT fk_portfolio_performance_holding 
FOREIGN KEY (holding_id) REFERENCES public.user_holdings(id) ON DELETE CASCADE;