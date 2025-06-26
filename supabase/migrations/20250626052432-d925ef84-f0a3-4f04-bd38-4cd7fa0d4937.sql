
-- First, let's check current RLS policies and fix them for analyses table
-- Enable RLS on analyses table if not already enabled
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view public analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;

-- Create policy for viewing public analyses (anyone can view public analyses)
CREATE POLICY "Users can view public analyses" ON public.analyses
FOR SELECT USING (is_public = true);

-- Create policy for creating analyses (authenticated users can create their own)
CREATE POLICY "Users can create their own analyses" ON public.analyses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for updating analyses (users can update their own)
CREATE POLICY "Users can update their own analyses" ON public.analyses
FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for deleting analyses (users can delete their own)
CREATE POLICY "Users can delete their own analyses" ON public.analyses
FOR DELETE USING (auth.uid() = user_id);

-- Also fix analysis_likes table RLS
ALTER TABLE public.analysis_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all analysis likes" ON public.analysis_likes;
DROP POLICY IF EXISTS "Users can manage their own analysis likes" ON public.analysis_likes;

-- Allow viewing all likes (needed for counting)
CREATE POLICY "Users can view all analysis likes" ON public.analysis_likes
FOR SELECT USING (true);

-- Allow authenticated users to manage their own likes
CREATE POLICY "Users can manage their own analysis likes" ON public.analysis_likes
FOR ALL USING (auth.uid() = user_id);
