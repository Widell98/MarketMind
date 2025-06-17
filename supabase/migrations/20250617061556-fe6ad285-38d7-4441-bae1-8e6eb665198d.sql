
-- Create table for user quiz progress
CREATE TABLE public.user_quiz_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  total_quizzes_taken INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_quiz_date DATE,
  points INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'novice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for user quiz categories progress
CREATE TABLE public.user_quiz_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category TEXT NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Create table for user badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create table for user completed quizzes
CREATE TABLE public.user_completed_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  quiz_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

-- Create table for user viewed learning modules
CREATE TABLE public.user_learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  module_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_completed_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_quiz_progress
CREATE POLICY "Users can view their own quiz progress" 
  ON public.user_quiz_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz progress" 
  ON public.user_quiz_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz progress" 
  ON public.user_quiz_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for user_quiz_categories
CREATE POLICY "Users can view their own quiz categories" 
  ON public.user_quiz_categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz categories" 
  ON public.user_quiz_categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz categories" 
  ON public.user_quiz_categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges" 
  ON public.user_badges 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
  ON public.user_badges 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_completed_quizzes
CREATE POLICY "Users can view their own completed quizzes" 
  ON public.user_completed_quizzes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed quizzes" 
  ON public.user_completed_quizzes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_learning_modules
CREATE POLICY "Users can view their own learning modules" 
  ON public.user_learning_modules 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning modules" 
  ON public.user_learning_modules 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
