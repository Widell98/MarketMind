-- Add macro/micro focus columns to user_ai_memory for richer personalization
ALTER TABLE public.user_ai_memory
ADD COLUMN IF NOT EXISTS macro_focus_topic text;

ALTER TABLE public.user_ai_memory
ADD COLUMN IF NOT EXISTS analysis_focus_preferences jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.user_ai_memory
ADD COLUMN IF NOT EXISTS follow_up_preference text DEFAULT 'auto';
