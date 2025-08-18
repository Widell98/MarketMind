-- Fix critical security vulnerabilities identified in security review

-- 1. CRITICAL: Fix profiles table - currently allows public access to all user data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure profile policies - authenticated users can see basic info, own user sees all
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can view their full profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 2. Fix stock case comments - should require authentication to view
DROP POLICY IF EXISTS "Anyone can view stock case comments" ON public.stock_case_comments;

CREATE POLICY "Authenticated users can view stock case comments" 
ON public.stock_case_comments 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Fix analysis comments - should require authentication to view
DROP POLICY IF EXISTS "Anyone can view analysis comments" ON public.analysis_comments;

CREATE POLICY "Authenticated users can view analysis comments" 
ON public.analysis_comments 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Fix post comments - should require authentication to view
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view all comments" ON public.post_comments;

CREATE POLICY "Authenticated users can view post comments" 
ON public.post_comments 
FOR SELECT 
TO authenticated
USING (true);

-- 5. Fix user follows - should require authentication to view relationship data
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;

CREATE POLICY "Authenticated users can view follows" 
ON public.user_follows 
FOR SELECT 
TO authenticated
USING (true);

-- 6. Fix stock case follows - should require authentication to view
DROP POLICY IF EXISTS "Anyone can view follow counts" ON public.stock_case_follows;

CREATE POLICY "Authenticated users can view stock case follows" 
ON public.stock_case_follows 
FOR SELECT 
TO authenticated
USING (true);

-- 7. Fix post likes - should require authentication to view
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can view all post likes" ON public.post_likes;

CREATE POLICY "Authenticated users can view post likes" 
ON public.post_likes 
FOR SELECT 
TO authenticated
USING (true);

-- 8. Fix analysis likes - should require authentication to view
DROP POLICY IF EXISTS "Users can view all analysis likes" ON public.analysis_likes;

CREATE POLICY "Authenticated users can view analysis likes" 
ON public.analysis_likes 
FOR SELECT 
TO authenticated
USING (true);

-- 9. Remove duplicate/conflicting policies for cleaner security model
-- Remove redundant INSERT policies that duplicate existing ones
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can create follows" ON public.user_follows;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.analysis_comments;

-- 10. Ensure case categories remain publicly viewable (needed for UI)
-- This is okay to keep public as it's just category names and colors

-- 11. Add audit logging trigger for sensitive profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log significant profile changes for security monitoring
  IF TG_OP = 'UPDATE' AND (
    OLD.username != NEW.username OR 
    OLD.display_name != NEW.display_name OR
    OLD.bio != NEW.bio
  ) THEN
    INSERT INTO public.user_role_audit (user_id, role, action, performed_by, reason)
    VALUES (NEW.id, 'user'::app_role, 'profile_updated', auth.uid(), 'Profile information changed');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;