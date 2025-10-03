-- Add avatar_url column to profiles to support storing user avatars
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;
