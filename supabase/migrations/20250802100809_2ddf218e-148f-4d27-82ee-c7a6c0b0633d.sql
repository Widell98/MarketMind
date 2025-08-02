-- Create stock_case_updates table for versioning
CREATE TABLE public.stock_case_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_case_id uuid NOT NULL REFERENCES public.stock_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text,
  description text,
  image_url text,
  update_type text NOT NULL DEFAULT 'analysis_update'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_case_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view stock case updates for public cases" 
ON public.stock_case_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.stock_cases 
    WHERE stock_cases.id = stock_case_updates.stock_case_id 
    AND stock_cases.is_public = true
  )
);

CREATE POLICY "Users can create updates for their own cases" 
ON public.stock_case_updates 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 
    FROM public.stock_cases 
    WHERE stock_cases.id = stock_case_updates.stock_case_id 
    AND stock_cases.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own case updates" 
ON public.stock_case_updates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own case updates" 
ON public.stock_case_updates 
FOR DELETE 
USING (auth.uid() = user_id);