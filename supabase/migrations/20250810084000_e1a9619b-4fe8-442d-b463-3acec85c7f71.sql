-- Tighten RLS for public.profiles: restrict SELECT to authenticated users only
-- 1) Drop overly permissive public read policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are publicly readable'
  ) THEN
    DROP POLICY "Profiles are publicly readable" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN
    DROP POLICY "Users can view all profiles" ON public.profiles;
  END IF;
END $$;

-- 2) Ensure RLS is enabled (it already is, but keeping for idempotency)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Create authenticated-only SELECT policy
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
