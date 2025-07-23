-- Create chat folders table for organizing chat sessions
CREATE TABLE public.chat_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to ai_chat_sessions table
ALTER TABLE public.ai_chat_sessions 
ADD COLUMN folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL;

-- Enable RLS on chat_folders
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_folders
CREATE POLICY "Users can view their own folders" 
ON public.chat_folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.chat_folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.chat_folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.chat_folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_chat_folders_user_id ON public.chat_folders(user_id);
CREATE INDEX idx_ai_chat_sessions_folder_id ON public.ai_chat_sessions(folder_id);