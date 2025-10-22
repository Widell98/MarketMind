-- CRITICAL SECURITY FIXES

-- 1. Fix Role Escalation Vulnerability - Remove dangerous UPDATE/DELETE policies on user_roles
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Create secure admin-only policies for role management
CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Enable RLS on cache tables that were missing it
ALTER TABLE public.financial_calendar_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_momentum_cache ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for cache tables
CREATE POLICY "Only admins can manage financial calendar cache" 
ON public.financial_calendar_cache 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage market momentum cache" 
ON public.market_momentum_cache 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_post_like_count(post_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.post_likes
  WHERE post_likes.post_id = get_post_like_count.post_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_post_comment_count(post_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.post_comments
  WHERE post_comments.post_id = get_post_comment_count.post_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_analysis_like_count(analysis_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.analysis_likes
  WHERE analysis_likes.analysis_id = get_analysis_like_count.analysis_id;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_liked_post(post_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.post_likes
    WHERE post_likes.post_id = user_has_liked_post.post_id 
    AND post_likes.user_id = user_has_liked_post.user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_has_liked_analysis(analysis_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.analysis_likes
    WHERE analysis_likes.analysis_id = user_has_liked_analysis.analysis_id 
    AND analysis_likes.user_id = user_has_liked_analysis.user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_analysis_comment_count(analysis_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.analysis_comments
  WHERE analysis_comments.analysis_id = get_analysis_comment_count.analysis_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_stock_case_like_count(case_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_likes
  WHERE stock_case_id = case_id;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_liked_case(case_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.stock_case_likes
    WHERE stock_case_id = case_id AND stock_case_likes.user_id = user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_stock_case_follow_count(case_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_follows
  WHERE stock_case_id = case_id;
$function$;

CREATE OR REPLACE FUNCTION public.user_follows_case(case_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.stock_case_follows
    WHERE stock_case_id = case_id AND stock_case_follows.user_id = user_id
  );
$function$;

-- 4. Create audit logging table for role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL, -- 'granted' or 'revoked'
  performed_by uuid NOT NULL,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  reason text
);

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view role audit logs" 
ON public.user_role_audit 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.user_role_audit 
FOR INSERT 
WITH CHECK (true);

-- 5. Create secure admin function for role management
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role app_role,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
  VALUES (target_user_id, new_role, 'granted', auth.uid(), reason);
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(
  target_user_id uuid,
  role_to_revoke app_role,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can revoke roles
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can revoke roles';
  END IF;
  
  -- Don't allow admins to revoke their own admin role
  IF target_user_id = auth.uid() AND role_to_revoke = 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  
  -- Remove the role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = role_to_revoke;
  
  -- Log the action
  INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
  VALUES (target_user_id, role_to_revoke, 'revoked', auth.uid(), reason);
  
  RETURN TRUE;
END;
$$;