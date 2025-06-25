
-- Create table for user-generated analyses
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'market_insight',
  stock_case_id UUID,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_analyses_stock_case FOREIGN KEY (stock_case_id) REFERENCES public.stock_cases(id) ON DELETE SET NULL
);

-- Enable RLS for analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view public analyses
CREATE POLICY "Users can view public analyses" 
  ON public.analyses 
  FOR SELECT 
  USING (is_public = true);

-- Policy to allow users to view their own analyses (even private ones)
CREATE POLICY "Users can view their own analyses" 
  ON public.analyses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow authenticated users to create analyses
CREATE POLICY "Authenticated users can create analyses" 
  ON public.analyses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own analyses
CREATE POLICY "Users can update their own analyses" 
  ON public.analyses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own analyses
CREATE POLICY "Users can delete their own analyses" 
  ON public.analyses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create table for analysis likes
CREATE TABLE public.analysis_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_analysis_likes_analysis FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE CASCADE,
  UNIQUE(user_id, analysis_id)
);

-- Enable RLS for analysis likes
ALTER TABLE public.analysis_likes ENABLE ROW LEVEL SECURITY;

-- Policy for analysis likes
CREATE POLICY "Users can manage their own analysis likes" 
  ON public.analysis_likes 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create table for analysis comments
CREATE TABLE public.analysis_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_analysis_comments_analysis FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE CASCADE
);

-- Enable RLS for analysis comments
ALTER TABLE public.analysis_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view comments on public analyses
CREATE POLICY "Users can view analysis comments" 
  ON public.analysis_comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses 
      WHERE analyses.id = analysis_comments.analysis_id 
      AND (analyses.is_public = true OR analyses.user_id = auth.uid())
    )
  );

-- Policy to allow authenticated users to create comments
CREATE POLICY "Authenticated users can create analysis comments" 
  ON public.analysis_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own comments
CREATE POLICY "Users can update their own analysis comments" 
  ON public.analysis_comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own comments
CREATE POLICY "Users can delete their own analysis comments" 
  ON public.analysis_comments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to get analysis like count
CREATE OR REPLACE FUNCTION public.get_analysis_like_count(analysis_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.analysis_likes
  WHERE analysis_likes.analysis_id = get_analysis_like_count.analysis_id;
$function$;

-- Create function to check if user has liked analysis
CREATE OR REPLACE FUNCTION public.user_has_liked_analysis(analysis_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.analysis_likes
    WHERE analysis_likes.analysis_id = user_has_liked_analysis.analysis_id 
    AND analysis_likes.user_id = user_has_liked_analysis.user_id
  );
$function$;

-- Create function to get analysis comment count
CREATE OR REPLACE FUNCTION public.get_analysis_comment_count(analysis_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.analysis_comments
  WHERE analysis_comments.analysis_id = get_analysis_comment_count.analysis_id;
$function$;
