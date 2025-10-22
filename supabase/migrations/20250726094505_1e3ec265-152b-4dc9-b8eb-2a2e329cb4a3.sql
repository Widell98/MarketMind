-- Fix remaining functions with missing search_path

CREATE OR REPLACE FUNCTION public.ensure_single_current_image()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- If setting this image as current, unset all others for this stock case
  IF NEW.is_current = true THEN
    UPDATE public.stock_case_image_history 
    SET is_current = false 
    WHERE stock_case_id = NEW.stock_case_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_financial_inputs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.increment_ai_usage(_user_id uuid, _usage_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _usage_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  _current_usage INTEGER := 0;
  _is_premium BOOLEAN := false;
  _daily_limit INTEGER := 5; -- Changed from 10 to 5 for free tier limit
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, 
          LOWER(COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))),
          COALESCE(new.raw_user_meta_data->>'display_name', 'New User'));
  RETURN new;
END;
$function$;