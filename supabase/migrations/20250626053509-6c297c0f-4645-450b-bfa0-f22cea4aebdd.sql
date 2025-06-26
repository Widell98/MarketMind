
-- Add foreign key constraint to analyses table to link with profiles
ALTER TABLE public.analyses 
ADD CONSTRAINT analyses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for better performance on user_id lookups in analyses
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
