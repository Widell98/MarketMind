
-- Check if policies exist and create only missing ones
DO $$
BEGIN
  -- Create policy for INSERT if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can create their own roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create their own roles" 
      ON public.user_roles 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
  END IF;

  -- Create policy for UPDATE if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can update their own roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own roles" 
      ON public.user_roles 
      FOR UPDATE 
      USING (auth.uid() = user_id)';
  END IF;

  -- Create policy for DELETE if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can delete their own roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own roles" 
      ON public.user_roles 
      FOR DELETE 
      USING (auth.uid() = user_id)';
  END IF;
END $$;
