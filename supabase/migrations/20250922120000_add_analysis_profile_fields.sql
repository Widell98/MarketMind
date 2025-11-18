alter table if exists public.user_risk_profiles
  add column if not exists analysis_focus text,
  add column if not exists analysis_depth text,
  add column if not exists analysis_timeframe text,
  add column if not exists output_format text,
  add column if not exists preferred_assets text[],
  add column if not exists has_current_portfolio boolean;
