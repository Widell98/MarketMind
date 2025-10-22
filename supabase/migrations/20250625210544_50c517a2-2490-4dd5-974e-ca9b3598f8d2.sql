
-- Kontrollera befintliga RLS-policies för ai_chat_sessions och portfolio_chat_history
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('ai_chat_sessions', 'portfolio_chat_history')
ORDER BY tablename, policyname;

-- Skapa RLS-policies för ai_chat_sessions om de inte finns
DO $$
BEGIN
  -- Aktivera RLS för ai_chat_sessions om det inte redan är aktiverat
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' AND c.relname = 'ai_chat_sessions' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Skapa SELECT policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_chat_sessions' AND policyname = 'Users can view their own chat sessions'
  ) THEN
    CREATE POLICY "Users can view their own chat sessions" 
      ON public.ai_chat_sessions 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  -- Skapa INSERT policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_chat_sessions' AND policyname = 'Users can create their own chat sessions'
  ) THEN
    CREATE POLICY "Users can create their own chat sessions" 
      ON public.ai_chat_sessions 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Skapa UPDATE policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_chat_sessions' AND policyname = 'Users can update their own chat sessions'
  ) THEN
    CREATE POLICY "Users can update their own chat sessions" 
      ON public.ai_chat_sessions 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  -- Skapa DELETE policy om den inte finns - detta är viktigt för borttagning!
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_chat_sessions' AND policyname = 'Users can delete their own chat sessions'
  ) THEN
    CREATE POLICY "Users can delete their own chat sessions" 
      ON public.ai_chat_sessions 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Skapa RLS-policies för portfolio_chat_history om de inte finns
DO $$
BEGIN
  -- Aktivera RLS för portfolio_chat_history om det inte redan är aktiverat
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' AND c.relname = 'portfolio_chat_history' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.portfolio_chat_history ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Skapa SELECT policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio_chat_history' AND policyname = 'Users can view their own chat history'
  ) THEN
    CREATE POLICY "Users can view their own chat history" 
      ON public.portfolio_chat_history 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  -- Skapa INSERT policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio_chat_history' AND policyname = 'Users can create their own chat history'
  ) THEN
    CREATE POLICY "Users can create their own chat history" 
      ON public.portfolio_chat_history 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Skapa UPDATE policy om den inte finns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio_chat_history' AND policyname = 'Users can update their own chat history'
  ) THEN
    CREATE POLICY "Users can update their own chat history" 
      ON public.portfolio_chat_history 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  -- Skapa DELETE policy om den inte finns - detta är viktigt för borttagning!
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio_chat_history' AND policyname = 'Users can delete their own chat history'
  ) THEN
    CREATE POLICY "Users can delete their own chat history" 
      ON public.portfolio_chat_history 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;
