-- Fix security issue: Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update follower count for the followed user
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM public.user_follows 
      WHERE following_id = NEW.following_id
    )
    WHERE id = NEW.following_id;
    
    -- Update following count for the follower
    UPDATE public.profiles 
    SET following_count = (
      SELECT COUNT(*) FROM public.user_follows 
      WHERE follower_id = NEW.follower_id
    )
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  END IF;
  
  -- Update follower count for the unfollowed user
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM public.user_follows 
      WHERE following_id = OLD.following_id
    )
    WHERE id = OLD.following_id;
    
    -- Update following count for the unfollower
    UPDATE public.profiles 
    SET following_count = (
      SELECT COUNT(*) FROM public.user_follows 
      WHERE follower_id = OLD.follower_id
    )
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;