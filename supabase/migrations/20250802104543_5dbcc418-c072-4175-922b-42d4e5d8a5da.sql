-- Function to update follower/following counts for profiles
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update follow counts
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON public.user_follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

-- Update existing follow counts for all users
UPDATE public.profiles 
SET 
  follower_count = (
    SELECT COUNT(*) FROM public.user_follows 
    WHERE following_id = profiles.id
  ),
  following_count = (
    SELECT COUNT(*) FROM public.user_follows 
    WHERE follower_id = profiles.id
  );