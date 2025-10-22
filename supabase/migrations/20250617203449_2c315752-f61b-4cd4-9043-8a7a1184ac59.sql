
-- Check and fix RLS policies for stock_case_image_history table
-- First, let's add the missing DELETE policy for admins and creators

CREATE POLICY "Users can delete their own image history or admins can delete any" 
  ON public.stock_case_image_history 
  FOR DELETE 
  USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
