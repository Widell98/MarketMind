
-- Create subscribers table to track subscription status
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_ai_usage table to track daily/monthly usage
CREATE TABLE public.user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_messages_count INTEGER NOT NULL DEFAULT 0,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  insights_count INTEGER NOT NULL DEFAULT 0,
  predictive_analysis_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create policies for user_ai_usage table
CREATE POLICY "Users can view their own usage" ON public.user_ai_usage
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage" ON public.user_ai_usage
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Insert usage" ON public.user_ai_usage
FOR INSERT
WITH CHECK (true);

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  _user_id UUID,
  _usage_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  _current_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update usage for today
  INSERT INTO public.user_ai_usage (user_id, usage_date, ai_messages_count, analysis_count, insights_count, predictive_analysis_count)
  VALUES (
    _user_id, 
    _current_date,
    CASE WHEN _usage_type = 'ai_message' THEN 1 ELSE 0 END,
    CASE WHEN _usage_type = 'analysis' THEN 1 ELSE 0 END,
    CASE WHEN _usage_type = 'insights' THEN 1 ELSE 0 END,
    CASE WHEN _usage_type = 'predictive_analysis' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    ai_messages_count = user_ai_usage.ai_messages_count + CASE WHEN _usage_type = 'ai_message' THEN 1 ELSE 0 END,
    analysis_count = user_ai_usage.analysis_count + CASE WHEN _usage_type = 'analysis' THEN 1 ELSE 0 END,
    insights_count = user_ai_usage.insights_count + CASE WHEN _usage_type = 'insights' THEN 1 ELSE 0 END,
    predictive_analysis_count = user_ai_usage.predictive_analysis_count + CASE WHEN _usage_type = 'predictive_analysis' THEN 1 ELSE 0 END,
    updated_at = now();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  _user_id UUID,
  _usage_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  _current_usage INTEGER := 0;
  _is_premium BOOLEAN := false;
  _daily_limit INTEGER := 10; -- Free tier limit
BEGIN
  -- Check if user is premium
  SELECT subscribed INTO _is_premium
  FROM public.subscribers
  WHERE user_id = _user_id AND subscribed = true;
  
  -- Premium users have unlimited usage
  IF _is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Get current usage for today
  SELECT 
    CASE 
      WHEN _usage_type = 'ai_message' THEN COALESCE(ai_messages_count, 0)
      WHEN _usage_type = 'analysis' THEN COALESCE(analysis_count, 0)
      WHEN _usage_type = 'insights' THEN COALESCE(insights_count, 0)
      WHEN _usage_type = 'predictive_analysis' THEN COALESCE(predictive_analysis_count, 0)
      ELSE 0
    END INTO _current_usage
  FROM public.user_ai_usage
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE;
  
  -- Check if under limit
  RETURN COALESCE(_current_usage, 0) < _daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
