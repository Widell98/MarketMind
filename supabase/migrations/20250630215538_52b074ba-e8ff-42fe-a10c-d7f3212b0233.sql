
-- Create table for storing user's AI insights
CREATE TABLE public.user_ai_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  is_personalized boolean NOT NULL DEFAULT true,
  insights_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, insight_type, is_personalized)
);

-- Add RLS policies
ALTER TABLE public.user_ai_insights ENABLE ROW LEVEL SECURITY;

-- Users can view their own insights
CREATE POLICY "Users can view their own AI insights" 
  ON public.user_ai_insights 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own insights
CREATE POLICY "Users can create their own AI insights" 
  ON public.user_ai_insights 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own insights
CREATE POLICY "Users can update their own AI insights" 
  ON public.user_ai_insights 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own insights
CREATE POLICY "Users can delete their own AI insights" 
  ON public.user_ai_insights 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_user_ai_insights_user_type ON public.user_ai_insights(user_id, insight_type, is_personalized);
