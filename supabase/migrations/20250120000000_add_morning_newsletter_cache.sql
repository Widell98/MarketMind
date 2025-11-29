-- Skapa tabell för att cacha morgonbrev
CREATE TABLE public.morning_newsletter_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index för prestanda
CREATE INDEX idx_morning_newsletter_cache_key ON public.morning_newsletter_cache(cache_key);
CREATE INDEX idx_morning_newsletter_expires_at ON public.morning_newsletter_cache(expires_at);
