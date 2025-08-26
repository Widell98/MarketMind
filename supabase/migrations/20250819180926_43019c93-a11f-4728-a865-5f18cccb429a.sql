-- Create user AI memory table for persistent conversation context
CREATE TABLE public.user_ai_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Core personality and preferences
  communication_style text DEFAULT 'casual', -- casual, formal, technical
  preferred_response_length text DEFAULT 'detailed', -- brief, detailed, comprehensive
  expertise_level text DEFAULT 'beginner', -- beginner, intermediate, advanced
  
  -- Investment preferences learned over time
  favorite_sectors jsonb DEFAULT '[]'::jsonb,
  preferred_companies jsonb DEFAULT '[]'::jsonb,
  investment_philosophy text,
  risk_comfort_patterns jsonb DEFAULT '{}'::jsonb,
  
  -- Conversation context
  frequently_asked_topics jsonb DEFAULT '[]'::jsonb,
  current_goals jsonb DEFAULT '[]'::jsonb,
  
  -- Session tracking
  last_interaction timestamp with time zone DEFAULT now(),
  total_conversations integer DEFAULT 0,
  
  -- Behavioral patterns
  typical_session_length integer, -- minutes
  preferred_interaction_times jsonb DEFAULT '[]'::jsonb, -- hours of day
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_ai_memory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own AI memory"
ON public.user_ai_memory
FOR ALL
USING (auth.uid() = user_id);

-- Create the trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE TRIGGER update_user_ai_memory_updated_at
BEFORE UPDATE ON public.user_ai_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_user_ai_memory_user_id ON public.user_ai_memory(user_id);
CREATE INDEX idx_user_ai_memory_last_interaction ON public.user_ai_memory(last_interaction DESC);