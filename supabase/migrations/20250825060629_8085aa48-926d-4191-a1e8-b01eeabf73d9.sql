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

-- Drop existing permissive policies that might allow unauthorized access
DO $$
BEGIN
  -- Drop any existing INSERT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname LIKE '%insert%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles';
  END IF;
  
  -- Drop any existing UPDATE policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname LIKE '%update%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles';
  END IF;
  
  -- Drop any existing DELETE policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname LIKE '%delete%'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles';
  END IF;
END $$;

-- Only admins can read user_roles
CREATE POLICY "Only admins can view user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- No direct write policies - all role changes must go through SECURITY DEFINER functions


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


-- 4) Add enhanced role assignment validation function
CREATE OR REPLACE FUNCTION public.assign_user_role_secure(target_user_id uuid, new_role app_role, reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Log the attempt
  PERFORM log_security_event('role_assignment_attempt', 'user_roles', target_user_id);
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action in audit table
  INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
  VALUES (target_user_id, new_role, 'granted', auth.uid(), reason);
  
  RETURN TRUE;
END;
$$;