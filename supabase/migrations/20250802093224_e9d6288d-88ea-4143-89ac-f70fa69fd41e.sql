-- Create stock_case_comments table
CREATE TABLE public.stock_case_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_case_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stock_case_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for stock case comments
CREATE POLICY "Anyone can view stock case comments" 
ON public.stock_case_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create stock case comments" 
ON public.stock_case_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock case comments" 
ON public.stock_case_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock case comments" 
ON public.stock_case_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to get stock case comment count
CREATE OR REPLACE FUNCTION public.get_stock_case_comment_count(case_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_comments
  WHERE stock_case_comments.stock_case_id = case_id;
$function$;