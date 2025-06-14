
-- Skapa tabell för att hantera följda aktiecases
CREATE TABLE public.stock_case_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stock_case_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(user_id, stock_case_id)
);

-- Skapa funktion för att räkna följare för ett aktiecase
CREATE OR REPLACE FUNCTION public.get_stock_case_follow_count(case_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.stock_case_follows
  WHERE stock_case_id = case_id;
$function$;

-- Skapa funktion för att kontrollera om användare följer ett case
CREATE OR REPLACE FUNCTION public.user_follows_case(case_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.stock_case_follows
    WHERE stock_case_id = case_id AND stock_case_follows.user_id = user_id
  );
$function$;
