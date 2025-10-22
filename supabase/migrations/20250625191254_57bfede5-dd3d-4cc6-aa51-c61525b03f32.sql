
-- Add portfolio connection to analyses table
ALTER TABLE public.analyses 
ADD COLUMN portfolio_id uuid REFERENCES public.user_portfolios(id),
ADD COLUMN related_holdings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ai_generated boolean DEFAULT false,
ADD COLUMN shared_from_insight_id uuid REFERENCES public.portfolio_insights(id);

-- Create a new table for portfolio analysis sharing
CREATE TABLE public.shared_portfolio_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES public.user_portfolios(id),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id),
  share_type text NOT NULL DEFAULT 'insight', -- 'insight', 'recommendation', 'performance'
  original_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for the new table
ALTER TABLE public.shared_portfolio_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared analyses" 
  ON public.shared_portfolio_analyses 
  FOR SELECT 
  USING (true); -- Public read access for shared analyses

CREATE POLICY "Users can create their own shared analyses" 
  ON public.shared_portfolio_analyses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared analyses" 
  ON public.shared_portfolio_analyses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared analyses" 
  ON public.shared_portfolio_analyses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Update analysis types to include portfolio-related types
ALTER TABLE public.analyses 
ALTER COLUMN analysis_type TYPE text;

-- Add index for better performance
CREATE INDEX idx_analyses_portfolio_id ON public.analyses(portfolio_id);
CREATE INDEX idx_shared_portfolio_analyses_user_id ON public.shared_portfolio_analyses(user_id);
