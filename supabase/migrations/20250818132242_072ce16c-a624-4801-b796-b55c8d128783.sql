-- Fix remaining security warnings from linter

-- 1. Fix function search path for all custom functions to prevent SQL injection
ALTER FUNCTION public.log_profile_changes() SET search_path = public;
ALTER FUNCTION public.get_stock_case_comment_count(uuid) SET search_path = public;
ALTER FUNCTION public.get_post_like_count(uuid) SET search_path = public;
ALTER FUNCTION public.get_post_comment_count(uuid) SET search_path = public;
ALTER FUNCTION public.get_analysis_like_count(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.user_has_liked_post(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_has_liked_analysis(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_analysis_comment_count(uuid) SET search_path = public;
ALTER FUNCTION public.get_stock_case_like_count(uuid) SET search_path = public;
ALTER FUNCTION public.update_follow_counts() SET search_path = public;
ALTER FUNCTION public.user_has_liked_case(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_stock_case_follow_count(uuid) SET search_path = public;
ALTER FUNCTION public.user_follows_case(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.assign_user_role(uuid, app_role, text) SET search_path = public;
ALTER FUNCTION public.revoke_user_role(uuid, app_role, text) SET search_path = public;
ALTER FUNCTION public.ensure_single_current_image() SET search_path = public;
ALTER FUNCTION public.validate_financial_inputs() SET search_path = public;
ALTER FUNCTION public.increment_ai_usage(uuid, text) SET search_path = public;
ALTER FUNCTION public.check_usage_limit(uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Add trigger for profile change logging
CREATE TRIGGER profile_changes_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();