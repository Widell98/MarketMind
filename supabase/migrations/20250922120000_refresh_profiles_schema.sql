-- Ensure the avatar_url column exists for profiles and refresh PostgREST schema cache
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

NOTIFY pgrst, 'reload schema';
