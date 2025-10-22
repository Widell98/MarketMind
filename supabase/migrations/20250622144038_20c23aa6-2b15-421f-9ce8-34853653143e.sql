
-- Update the check_usage_limit function to use 5 as the daily limit instead of 10
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _usage_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
