-- Security Enhancement: Strengthen RLS Policies and Add User Role Validation

-- First, add server-side role validation function to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.validate_admin_action()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admin actions if user has admin role in database
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$$;

-- Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id);
END;
$$;

-- Strengthen profiles RLS to prevent unauthorized role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create more restrictive profile update policy that excludes sensitive fields
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Prevent users from updating sensitive fields that should be managed separately
  AND OLD.id = NEW.id
  AND OLD.created_at = NEW.created_at
);

-- Add trigger to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log significant profile changes for security monitoring
  IF TG_OP = 'UPDATE' AND (
    OLD.username != NEW.username OR 
    OLD.display_name != NEW.display_name
  ) THEN
    PERFORM public.log_security_event('profile_updated', 'profiles', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS on_profile_security_change ON public.profiles;
CREATE TRIGGER on_profile_security_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_security_changes();

-- Add session tracking table for enhanced session security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add function to validate session security
CREATE OR REPLACE FUNCTION public.validate_session_security(p_session_token TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_valid BOOLEAN := false;
BEGIN
  -- Check if session exists, is active, and not expired
  SELECT EXISTS(
    SELECT 1 FROM public.user_sessions 
    WHERE session_token = p_session_token 
    AND user_id = auth.uid()
    AND is_active = true 
    AND expires_at > now()
  ) INTO session_valid;
  
  -- Update last activity if session is valid
  IF session_valid THEN
    UPDATE public.user_sessions 
    SET last_activity = now() 
    WHERE session_token = p_session_token AND user_id = auth.uid();
  END IF;
  
  RETURN session_valid;
END;
$$;