-- Ensure new conversational preferences are persisted for portfolio generation
ALTER TABLE public.user_risk_profiles
ADD COLUMN IF NOT EXISTS portfolio_help_focus TEXT,
ADD COLUMN IF NOT EXISTS current_portfolio_strategy TEXT,
ADD COLUMN IF NOT EXISTS optimization_goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS optimization_risk_focus TEXT,
ADD COLUMN IF NOT EXISTS optimization_diversification_focus TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS optimization_preference TEXT,
ADD COLUMN IF NOT EXISTS optimization_timeline TEXT,
ADD COLUMN IF NOT EXISTS preferred_assets TEXT[] DEFAULT '{}';
