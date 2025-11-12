
-- Create user_risk_profiles table to store user questionnaire responses and risk assessment
CREATE TABLE public.user_risk_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  age integer,
  annual_income numeric,
  investment_horizon text, -- 'short' (0-2 years), 'medium' (3-5 years), 'long' (5+ years)
  investment_goal text, -- 'growth', 'income', 'preservation', 'balanced'
  risk_tolerance text, -- 'conservative', 'moderate', 'aggressive'
  investment_experience text, -- 'beginner', 'intermediate', 'advanced'
  sector_interests jsonb DEFAULT '[]'::jsonb, -- array of preferred sectors
  monthly_investment_amount numeric,
  current_portfolio_value numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_portfolios table to store AI-generated portfolio allocations
CREATE TABLE public.user_portfolios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  risk_profile_id uuid NOT NULL,
  portfolio_name text NOT NULL DEFAULT 'My Portfolio',
  asset_allocation jsonb NOT NULL, -- JSON structure with asset types and percentages
  recommended_stocks jsonb DEFAULT '[]'::jsonb, -- array of stock recommendations
  total_value numeric DEFAULT 0,
  expected_return numeric, -- expected annual return percentage
  risk_score numeric, -- calculated risk score 1-10
  last_rebalanced_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create portfolio_recommendations table to store AI suggestions and advice
CREATE TABLE public.portfolio_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  portfolio_id uuid NOT NULL,
  recommendation_type text NOT NULL, -- 'rebalance', 'buy', 'sell', 'general_advice'
  title text NOT NULL,
  description text NOT NULL,
  ai_reasoning text, -- detailed AI explanation
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_implemented boolean DEFAULT false,
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create portfolio_chat_history table to store conversations with AI advisor
CREATE TABLE public.portfolio_chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  portfolio_id uuid,
  message_type text NOT NULL, -- 'user', 'ai'
  message text NOT NULL,
  context_data jsonb, -- additional context like market data, portfolio state
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.user_portfolios 
ADD CONSTRAINT user_portfolios_risk_profile_id_fkey 
FOREIGN KEY (risk_profile_id) REFERENCES public.user_risk_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.portfolio_recommendations 
ADD CONSTRAINT portfolio_recommendations_portfolio_id_fkey 
FOREIGN KEY (portfolio_id) REFERENCES public.user_portfolios(id) ON DELETE CASCADE;

ALTER TABLE public.portfolio_chat_history 
ADD CONSTRAINT portfolio_chat_history_portfolio_id_fkey 
FOREIGN KEY (portfolio_id) REFERENCES public.user_portfolios(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_risk_profiles
CREATE POLICY "Users can view their own risk profiles" 
  ON public.user_risk_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own risk profiles" 
  ON public.user_risk_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own risk profiles" 
  ON public.user_risk_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own risk profiles" 
  ON public.user_risk_profiles 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for user_portfolios
CREATE POLICY "Users can view their own portfolios" 
  ON public.user_portfolios 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" 
  ON public.user_portfolios 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
  ON public.user_portfolios 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" 
  ON public.user_portfolios 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_recommendations
CREATE POLICY "Users can view their own recommendations" 
  ON public.portfolio_recommendations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations" 
  ON public.portfolio_recommendations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
  ON public.portfolio_recommendations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" 
  ON public.portfolio_recommendations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for portfolio_chat_history
CREATE POLICY "Users can view their own chat history" 
  ON public.portfolio_chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history" 
  ON public.portfolio_chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history" 
  ON public.portfolio_chat_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" 
  ON public.portfolio_chat_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_risk_profiles_user_id ON public.user_risk_profiles(user_id);
CREATE INDEX idx_user_portfolios_user_id ON public.user_portfolios(user_id);
CREATE INDEX idx_user_portfolios_risk_profile_id ON public.user_portfolios(risk_profile_id);
CREATE INDEX idx_portfolio_recommendations_user_id ON public.portfolio_recommendations(user_id);
CREATE INDEX idx_portfolio_recommendations_portfolio_id ON public.portfolio_recommendations(portfolio_id);
CREATE INDEX idx_portfolio_chat_history_user_id ON public.portfolio_chat_history(user_id);
CREATE INDEX idx_portfolio_chat_history_portfolio_id ON public.portfolio_chat_history(portfolio_id);
