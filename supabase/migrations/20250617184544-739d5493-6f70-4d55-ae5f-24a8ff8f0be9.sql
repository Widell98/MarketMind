
-- Fix search_path security warnings for all functions

-- Update get_stock_case_like_count function
CREATE OR REPLACE FUNCTION public.get_stock_case_like_count(case_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_likes
  WHERE stock_case_id = case_id;
$function$;

-- Update user_has_liked_case function
CREATE OR REPLACE FUNCTION public.user_has_liked_case(case_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.stock_case_likes
    WHERE stock_case_id = case_id AND stock_case_likes.user_id = user_id
  );
$function$;

-- Update get_stock_case_follow_count function
CREATE OR REPLACE FUNCTION public.get_stock_case_follow_count(case_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_follows
  WHERE stock_case_id = case_id;
$function$;

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update user_follows_case function
CREATE OR REPLACE FUNCTION public.user_follows_case(case_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.stock_case_follows
    WHERE stock_case_id = case_id AND stock_case_follows.user_id = user_id
  );
$function$;

-- Update ensure_single_current_image function
CREATE OR REPLACE FUNCTION public.ensure_single_current_image()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update validate_financial_inputs function
CREATE OR REPLACE FUNCTION public.validate_financial_inputs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, 
          LOWER(COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))),
          COALESCE(new.raw_user_meta_data->>'display_name', 'New User'));
  RETURN new;
END;
$function$;
