
-- Utöka user_risk_profiles tabellen med nya fält för förbättrad riskbedömning
ALTER TABLE public.user_risk_profiles 
ADD COLUMN housing_situation TEXT,
ADD COLUMN has_loans BOOLEAN DEFAULT false,
ADD COLUMN loan_details TEXT,
ADD COLUMN has_children BOOLEAN DEFAULT false,
ADD COLUMN liquid_capital NUMERIC,
ADD COLUMN emergency_buffer_months INTEGER,
ADD COLUMN investment_purpose TEXT[],
ADD COLUMN target_amount NUMERIC,
ADD COLUMN target_date DATE,
ADD COLUMN panic_selling_history BOOLEAN DEFAULT false,
ADD COLUMN control_importance INTEGER CHECK (control_importance >= 1 AND control_importance <= 5),
ADD COLUMN risk_comfort_level INTEGER CHECK (risk_comfort_level >= 1 AND risk_comfort_level <= 5),
ADD COLUMN portfolio_change_frequency TEXT,
ADD COLUMN activity_preference TEXT,
ADD COLUMN investment_style_preference TEXT,
ADD COLUMN market_crash_reaction TEXT,
ADD COLUMN overexposure_awareness TEXT,
ADD COLUMN current_holdings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN current_allocation JSONB DEFAULT '{}'::jsonb;

-- Skapa ny tabell för användarens nuvarande innehav
CREATE TABLE public.user_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  holding_type TEXT NOT NULL, -- 'stock', 'fund', 'crypto', 'real_estate', 'bonds', 'other'
  name TEXT NOT NULL,
  symbol TEXT,
  quantity NUMERIC,
  current_value NUMERIC,
  purchase_price NUMERIC,
  purchase_date DATE,
  sector TEXT,
  market TEXT,
  currency TEXT DEFAULT 'SEK',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktivera RLS för user_holdings
ALTER TABLE public.user_holdings ENABLE ROW LEVEL SECURITY;

-- Skapa policies för user_holdings
CREATE POLICY "Users can view their own holdings" 
  ON public.user_holdings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own holdings" 
  ON public.user_holdings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
  ON public.user_holdings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" 
  ON public.user_holdings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Skapa tabell för AI chat-historik med förbättrad struktur
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_name TEXT DEFAULT 'Portfolio Consultation',
  context_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Aktivera RLS för ai_chat_sessions
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies för chat sessions
CREATE POLICY "Users can view their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Förbättra portfolio_chat_history tabellen
ALTER TABLE public.portfolio_chat_history 
ADD COLUMN chat_session_id UUID REFERENCES public.ai_chat_sessions(id),
ADD COLUMN ai_confidence_score NUMERIC CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN response_time_ms INTEGER,
ADD COLUMN user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5);

-- Skapa tabell för automatiserade insights och varningar
CREATE TABLE public.portfolio_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'news_impact', 'rebalancing', 'risk_warning', 'opportunity'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  related_holdings JSONB DEFAULT '[]'::jsonb,
  action_required BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktivera RLS för portfolio_insights
ALTER TABLE public.portfolio_insights ENABLE ROW LEVEL SECURITY;

-- Policies för insights
CREATE POLICY "Users can view their own insights" 
  ON public.portfolio_insights 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
  ON public.portfolio_insights 
  FOR UPDATE 
  USING (auth.uid() = user_id);
