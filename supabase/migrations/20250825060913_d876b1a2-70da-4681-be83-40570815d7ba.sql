-- Security fixes migration (drop policies first)

-- 1) Fix subscribers policy: restrict SELECT to user_id only
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- 2) Fix user_roles: enforce strict RLS and block direct writes
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_roles
DO $$
DECLARE p record;
BEGIN
  FOR p IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON public.user_roles', p.policyname);
  END LOOP;
END $$;

-- Only admins can read user_roles
CREATE POLICY "Only admins can view user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies created - absence denies direct writes


-- 3) Fix security_audit_log: remove INSERT policy, rely on SECURITY DEFINER function
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;


-- 4) Add enhanced role assignment function (idempotent)
CREATE OR REPLACE FUNCTION public.assign_user_role_secure(target_user_id uuid, new_role app_role, reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  PERFORM log_security_event('role_assignment_attempt', 'user_roles', target_user_id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
  VALUES (target_user_id, new_role, 'granted', auth.uid(), reason);
  
  RETURN TRUE;
END;
$$;