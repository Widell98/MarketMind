-- Ensure new users get a display name derived from their email address
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  derived_username text;
  email_display_name text;
BEGIN
  derived_username := LOWER(
    COALESCE(
      new.raw_user_meta_data->>'username',
      'user_' || substr(new.id::text, 1, 8)
    )
  );

  email_display_name := COALESCE(
    NULLIF(REPLACE(LOWER(COALESCE(new.email, '')), '@', ''), ''),
    new.raw_user_meta_data->>'display_name',
    derived_username,
    'New User'
  );

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    derived_username,
    email_display_name
  );

  RETURN new;
END;
$function$;

UPDATE public.profiles AS p
SET display_name = LOWER(REPLACE(u.email, '@', ''))
FROM auth.users AS u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND COALESCE(TRIM(p.display_name), '') IN ('', 'new user', 'New User');
