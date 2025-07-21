
-- Create saved_opportunities table for storing user's saved stock cases and analyses
CREATE TABLE public.saved_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('stock_case', 'analysis')),
  item_id UUID NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable Row Level Security
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

-- Create index for better performance
CREATE INDEX idx_saved_opportunities_user_id ON public.saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_item_type ON public.saved_opportunities(item_type);
