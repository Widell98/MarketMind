-- Create table for linking analyses to specific holdings
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('stock_case', 'analysis')),
  item_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_opportunities
CREATE POLICY "Users can view their own saved opportunities" 
ON public.saved_opportunities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved opportunities" 
ON public.saved_opportunities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved opportunities" 
ON public.saved_opportunities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved opportunities" 
ON public.saved_opportunities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_user_id ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_item_type_id ON public.saved_opportunities(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_tags ON public.saved_opportunities USING GIN(tags);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_opportunities_unique ON public.saved_opportunities(user_id, item_type, item_id);