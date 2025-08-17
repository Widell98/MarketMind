-- Update RLS policy for profiles table to allow everyone to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- Create new policy that allows everyone to view profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles 
FOR SELECT 
USING (true);