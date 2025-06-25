
-- Add public sharing toggle to user portfolios
ALTER TABLE public.user_portfolios 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add new post type for portfolio sharing
-- First check if we need to update the check constraint for post_type
-- We'll add 'portfolio_share' as a valid post type
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('reflection', 'case_analysis', 'market_insight', 'portfolio_share'));

-- Add portfolio_id reference to posts table for portfolio sharing posts
ALTER TABLE public.posts 
ADD COLUMN portfolio_id UUID REFERENCES public.user_portfolios(id) ON DELETE CASCADE;

-- Create index for better performance on portfolio posts
CREATE INDEX idx_posts_portfolio_id ON public.posts(portfolio_id) WHERE portfolio_id IS NOT NULL;

-- Create index for better performance on public portfolios
CREATE INDEX idx_user_portfolios_public ON public.user_portfolios(is_public) WHERE is_public = true;

-- Add RLS policies for public portfolios
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- Policy to let users see public portfolios and their own portfolios
CREATE POLICY "Users can view public portfolios and own portfolios" 
ON public.user_portfolios 
FOR SELECT 
USING (is_public = true OR user_id = auth.uid());

-- Policy to let users manage their own portfolios
CREATE POLICY "Users can manage own portfolios" 
ON public.user_portfolios 
FOR ALL 
USING (user_id = auth.uid());
