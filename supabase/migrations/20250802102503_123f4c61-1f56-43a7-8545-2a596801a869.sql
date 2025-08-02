-- Update RLS policies for stock_case_updates to allow public viewing of updates for public cases

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own stock case updates" ON public.stock_case_updates;
DROP POLICY IF EXISTS "Users can create their own stock case updates" ON public.stock_case_updates;
DROP POLICY IF EXISTS "Users can update their own stock case updates" ON public.stock_case_updates;
DROP POLICY IF EXISTS "Users can delete their own stock case updates" ON public.stock_case_updates;

-- Create new policies that allow public viewing but restrict editing to owners
CREATE POLICY "Anyone can view updates for public stock cases" 
ON public.stock_case_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stock_cases 
    WHERE stock_cases.id = stock_case_updates.stock_case_id 
    AND stock_cases.is_public = true
  )
);

CREATE POLICY "Users can create updates for their own stock cases" 
ON public.stock_case_updates 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.stock_cases 
    WHERE stock_cases.id = stock_case_updates.stock_case_id 
    AND stock_cases.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own stock case updates" 
ON public.stock_case_updates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock case updates" 
ON public.stock_case_updates 
FOR DELETE 
USING (auth.uid() = user_id);