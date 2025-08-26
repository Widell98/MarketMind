-- Phase 1: Critical RLS policy fixes

-- 1) Subscribers: restrict SELECT to user_id only (remove email-based access)
DO $$
BEGIN
  -- Drop existing policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND polname = 'Users can view their own subscription'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own subscription" ON public.subscribers';
  END IF;
END $$;

-- Recreate strict policy
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- 2) user_roles: enforce strict RLS and block direct writes
-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add RESTRICTIVE policies to override any permissive ones that might exist
-- Only admins can read user_roles
CREATE POLICY "Only admins can view user_roles"
AS RESTRICTIVE
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Block direct INSERTs (must go through SECURITY DEFINER functions)
CREATE POLICY "No direct inserts to user_roles"
AS RESTRICTIVE
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Block direct UPDATEs
CREATE POLICY "No direct updates to user_roles"
AS RESTRICTIVE
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Block direct DELETEs
CREATE POLICY "No direct deletes to user_roles"
AS RESTRICTIVE
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);


-- 3) security_audit_log: remove permissive INSERT policy to ensure inserts happen via SECURITY DEFINER function only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security_audit_log' AND polname = 'System can insert audit logs'
  ) THEN
    EXECUTE 'DROP POLICY "System can insert audit logs" ON public.security_audit_log';
  END IF;
END $$;

-- Keep SELECT restricted to admins (already present)
-- No INSERT policy is needed because public.log_security_event() uses SECURITY DEFINER and bypasses RLS safely
