-- Retry migration with corrections after trigger error

-- Ensure RLS is enabled where needed
ALTER TABLE IF EXISTS public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 1) Subscribers table hardening
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "System can delete subscriptions" ON public.subscribers;

CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions"
ON public.subscribers
FOR INSERT
WITH CHECK (false);

CREATE POLICY "System can update subscriptions"
ON public.subscribers
FOR UPDATE
USING (false);

CREATE POLICY "System can delete subscriptions"
ON public.subscribers
FOR DELETE
USING (false);

-- 2) user_roles table hardening
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Prevent direct role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Prevent direct role updates"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Audit logging for subscribers changes (cannot log SELECT with triggers)
CREATE OR REPLACE FUNCTION public.log_subscription_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), TG_OP, 'subscription', COALESCE(NEW.id, OLD.id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_subscription_access_trigger ON public.subscribers;
CREATE TRIGGER log_subscription_access_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.log_subscription_access();

-- 4) Session admin control policy and invalidation function
DROP POLICY IF EXISTS "Admins can update any sessions" ON public.user_sessions;
CREATE POLICY "Admins can update any sessions"
ON public.user_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.invalidate_suspicious_sessions(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized session invalidation attempt';
  END IF;

  UPDATE public.user_sessions
  SET is_active = false,
      last_activity = now()
  WHERE user_id = target_user_id AND is_active = true;

  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), 'session_invalidation', 'user_sessions', target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5) Enhance assign_user_role_secure with explicit audit log
CREATE OR REPLACE FUNCTION public.assign_user_role_secure(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;

  PERFORM log_security_event('role_assignment_attempt', 'user_roles', target_user_id);

  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), 'role_assignment_' || new_role::text, 'user_roles', target_user_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
  VALUES (target_user_id, new_role, 'granted', auth.uid(), reason);

  RETURN TRUE;
END;
$$;