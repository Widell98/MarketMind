
-- First, let's fix the RLS policies for stock_case_likes to ensure proper user-specific behavior
DROP POLICY IF EXISTS "Users can view their own likes" ON public.stock_case_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.stock_case_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.stock_case_likes;

-- Create comprehensive RLS policies for stock_case_likes
CREATE POLICY "Anyone can view like counts" ON public.stock_case_likes
FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.stock_case_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.stock_case_likes
FOR DELETE USING (auth.uid() = user_id);

-- Fix RLS policies for stock_case_follows to ensure proper user-specific behavior
DROP POLICY IF EXISTS "Users can view their own follows" ON public.stock_case_follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON public.stock_case_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.stock_case_follows;

-- Create comprehensive RLS policies for stock_case_follows
CREATE POLICY "Anyone can view follow counts" ON public.stock_case_follows
FOR SELECT USING (true);

CREATE POLICY "Users can create their own follows" ON public.stock_case_follows
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.stock_case_follows
FOR DELETE USING (auth.uid() = user_id);
