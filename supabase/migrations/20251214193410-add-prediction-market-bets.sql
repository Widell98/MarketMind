-- Create table for user prediction market bets
-- This table stores bets that users have placed on prediction markets

CREATE TABLE IF NOT EXISTS public.user_prediction_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_market_id TEXT NOT NULL,
  market_question TEXT NOT NULL,
  bet_outcome TEXT NOT NULL,
  bet_odds NUMERIC NOT NULL CHECK (bet_odds >= 0 AND bet_odds <= 1),
  bet_amount NUMERIC NOT NULL CHECK (bet_amount > 0),
  potential_payout NUMERIC NOT NULL CHECK (potential_payout >= 0),
  market_end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_prediction_bets ENABLE ROW LEVEL SECURITY;

-- Create policies for user_prediction_bets
CREATE POLICY "Users can view their own bets" 
  ON public.user_prediction_bets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" 
  ON public.user_prediction_bets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets" 
  ON public.user_prediction_bets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bets" 
  ON public.user_prediction_bets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_prediction_bets_user_id ON public.user_prediction_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prediction_bets_market_id ON public.user_prediction_bets(prediction_market_id);
CREATE INDEX IF NOT EXISTS idx_user_prediction_bets_status ON public.user_prediction_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_prediction_bets_created_at ON public.user_prediction_bets(created_at DESC);

