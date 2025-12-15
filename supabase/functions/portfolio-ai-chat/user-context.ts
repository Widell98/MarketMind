// User context service for fetching user data (profile, portfolio, holdings)

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import type { HoldingRecord } from './types.ts';

// ============================================================================
// User Context Types
// ============================================================================

export type UserContextData = {
  aiMemory: Record<string, unknown> | null;
  riskProfile: Record<string, unknown> | null;
  portfolio: Record<string, unknown> | null;
  holdings: HoldingRecord[];
  subscriber: { subscribed: boolean } | null;
};

// ============================================================================
// User Context Service
// ============================================================================

/**
 * Fetches all user-related data in parallel for better performance
 */
export const fetchUserContext = async (
  supabase: SupabaseClient,
  userId: string
): Promise<UserContextData> => {
  const [
    { data: aiMemory },
    { data: riskProfile },
    { data: portfolio },
    { data: holdings },
    { data: subscriber }
  ] = await Promise.all([
    supabase
      .from('user_ai_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('subscribers')
      .select('subscribed')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  return {
    aiMemory: aiMemory as Record<string, unknown> | null,
    riskProfile: riskProfile as Record<string, unknown> | null,
    portfolio: portfolio as Record<string, unknown> | null,
    holdings: (holdings as HoldingRecord[]) || [],
    subscriber: subscriber as { subscribed: boolean } | null,
  };
};

