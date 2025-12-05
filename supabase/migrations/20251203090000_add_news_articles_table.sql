CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  summary text,
  category text DEFAULT 'global',
  source text,
  url text UNIQUE NOT NULL,
  image_url text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_news_articles_published_at ON public.news_articles (published_at DESC);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.news_articles
  FOR SELECT USING (true);
