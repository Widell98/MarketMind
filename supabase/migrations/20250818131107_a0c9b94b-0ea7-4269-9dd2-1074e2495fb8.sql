-- Secure subscribers table: restrict access to owners only and prevent client-side writes
-- 1) Ensure RLS is enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "Insert subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- 3) Recreate a strict SELECT policy for authenticated users to read only their own row
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR (email = auth.email())
);

-- Note:
-- Edge functions using the service role bypass RLS and can still INSERT/UPDATE
-- subscriber records securely (e.g., check-subscription, create-checkout, customer-portal).