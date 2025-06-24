
-- Enable RLS on posts table if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Create RLS policies for posts table
CREATE POLICY "Users can view public posts" 
  ON public.posts 
  FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own posts" 
  ON public.posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.posts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create RLS policies for profiles table
CREATE POLICY "Profiles are publicly readable" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
