import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves a Supabase access token, optionally using an existing session token before
 * falling back to a fresh session lookup.
 */
export const resolveAccessToken = async (
  sessionToken?: string | null
): Promise<string | null> => {
  if (sessionToken) {
    return sessionToken;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to resolve Supabase session:', error);
    return null;
  }

  return session?.access_token ?? null;
};

/**
 * Ensures that an access token is available, throwing an error if the user is not authenticated.
 */
export const requireAccessToken = async (
  sessionToken?: string | null
): Promise<string> => {
  const token = await resolveAccessToken(sessionToken);

  if (!token) {
    throw new Error('User is not authenticated');
  }

  return token;
};
