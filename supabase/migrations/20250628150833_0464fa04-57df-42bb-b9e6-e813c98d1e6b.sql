
-- Skapa tabell för att cacha finansiell kalenderdata
CREATE TABLE public.financial_calendar_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skapa tabell för att cacha marknadsmomentum
CREATE TABLE public.market_momentum_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skapa tabell för AI-genererade marknadsinsikter
CREATE TABLE public.ai_market_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score NUMERIC(3,2),
  data_sources JSONB DEFAULT '[]'::jsonb,
  is_personalized BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktivera RLS för AI-insikter
ALTER TABLE public.ai_market_insights ENABLE ROW LEVEL SECURITY;

-- Policy för att användare kan se sina egna insikter + publika insikter
CREATE POLICY "Users can view relevant insights" 
  ON public.ai_market_insights 
  FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Index för prestanda
CREATE INDEX idx_financial_calendar_cache_key ON public.financial_calendar_cache(cache_key);
CREATE INDEX idx_market_momentum_cache_key ON public.market_momentum_cache(cache_key);
CREATE INDEX idx_ai_insights_user_type ON public.ai_market_insights(user_id, insight_type);
CREATE INDEX idx_cache_expires ON public.financial_calendar_cache(expires_at);
CREATE INDEX idx_momentum_expires ON public.market_momentum_cache(expires_at);
