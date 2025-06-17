
-- Remove the overly permissive policy that allows anyone to view all follows
DROP POLICY IF EXISTS "Anyone can view follow counts" ON public.stock_case_follows;

-- Create a new policy that only allows users to see their own follows
CREATE POLICY "Users can view their own follows" ON public.stock_case_follows
FOR SELECT USING (auth.uid() = user_id);

-- Ensure other policies remain intact (users can still create/delete their own follows)
-- The existing policies "Users can create their own follows" and "Users can delete their own follows" should remain
