-- Ensure conversational advisor preferences are stored for each user risk profile
ALTER TABLE public.user_risk_profiles
ADD COLUMN IF NOT EXISTS analysis_focus TEXT,
ADD COLUMN IF NOT EXISTS analysis_depth TEXT,
ADD COLUMN IF NOT EXISTS analysis_timeframe TEXT,
ADD COLUMN IF NOT EXISTS case_profile TEXT,
ADD COLUMN IF NOT EXISTS portfolio_analysis_intent TEXT,
ADD COLUMN IF NOT EXISTS initial_intent TEXT;
