
-- Add foreign key constraint to analysis_comments table to link with profiles
ALTER TABLE public.analysis_comments 
ADD CONSTRAINT analysis_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_analysis_comments_user_id ON public.analysis_comments(user_id);

-- Create index for better performance on analysis_id lookups  
CREATE INDEX IF NOT EXISTS idx_analysis_comments_analysis_id ON public.analysis_comments(analysis_id);

-- Add RLS policies for analysis_comments table
ALTER TABLE public.analysis_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all public comments
CREATE POLICY "Anyone can view analysis comments" 
ON public.analysis_comments 
FOR SELECT 
USING (true);

-- Policy to allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments" 
ON public.analysis_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.analysis_comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.analysis_comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
