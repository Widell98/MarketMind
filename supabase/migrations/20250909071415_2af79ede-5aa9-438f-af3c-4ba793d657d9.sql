-- Fix critical security vulnerabilities in RLS policies

-- 1. Secure the subscribers table - prevent public access to sensitive data
-- Drop existing permissive policies that allow public access
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- Create restrictive policies for subscribers table
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (user_id = auth.uid());

-- Prevent manual insertions - only Edge Functions should manage subscriptions
CREATE POLICY "System can insert subscriptions" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (false); -- Block all direct inserts

-- Only system/admin operations can update subscriptions
CREATE POLICY "System can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
USING (false); -- Block all direct updates

-- Prevent manual deletions
CREATE POLICY "System can delete subscriptions" 
ON public.subscribers 
FOR DELETE 
USING (false); -- Block all direct deletions

-- 2. Secure the user_roles table - prevent privilege escalation
-- Add missing INSERT policy - only admins can assign roles through proper functions
CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add missing UPDATE policy - prevent direct role modifications
CREATE POLICY "Prevent direct role updates" 
ON public.user_roles 
FOR UPDATE 
USING (false); -- Force use of assign_user_role/revoke_user_role functions

-- Add missing DELETE policy - only through proper revoke function
CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Enhance security audit logging
-- Ensure all sensitive operations are logged
CREATE OR REPLACE FUNCTION public.log_subscription_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log subscription data access
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), TG_OP, 'subscription', COALESCE(NEW.id, OLD.id));
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for subscription access logging
DROP TRIGGER IF EXISTS log_subscription_access_trigger ON public.subscribers;
CREATE TRIGGER log_subscription_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.log_subscription_access();

-- 4. Add session security enhancements
-- Function to invalidate suspicious sessions
CREATE OR REPLACE FUNCTION public.invalidate_suspicious_sessions(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Only admins or the user themselves can invalidate sessions
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized session invalidation attempt';
  END IF;
  
  -- Deactivate all sessions for the user
  UPDATE public.user_sessions 
  SET is_active = false, 
      last_activity = now()
  WHERE user_id = target_user_id AND is_active = true;
  
  -- Log the action
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), 'session_invalidation', 'user_sessions', target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Enhance the existing security functions with better logging
CREATE OR REPLACE FUNCTION public.assign_user_role_secure(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Enhanced security logging
  PERFORM log_security_event('role_assignment_attempt', 'user_roles', target_user_id);
  
  -- Log the specific role being assigned
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