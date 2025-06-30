
-- Create a table for caching AI insights
CREATE TABLE public.ai_insights_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  insight_type text NOT NULL,
  is_personalized boolean NOT NULL DEFAULT false,
  insights_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '3.5 days'), -- Update twice per week
  UNIQUE(user_id, insight_type, is_personalized)
);

-- Add RLS policies
ALTER TABLE public.ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- Users can view their own cached insights
CREATE POLICY "Users can view their own cached insights" 
  ON public.ai_insights_cache 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create their own cached insights
CREATE POLICY "Users can create their own cached insights" 
  ON public.ai_insights_cache 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own cached insights
CREATE POLICY "Users can update their own cached insights" 
  ON public.ai_insights_cache 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own cached insights
CREATE POLICY "Users can delete their own cached insights" 
  ON public.ai_insights_cache 
  FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Add index for better performance
CREATE INDEX idx_ai_insights_cache_user_type ON public.ai_insights_cache(user_id, insight_type, is_personalized);
CREATE INDEX idx_ai_insights_cache_expires_at ON public.ai_insights_cache(expires_at);
