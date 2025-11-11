import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type RateLimitOptions = {
  readonly supabase: SupabaseClient;
  readonly functionName: string;
  readonly identifier: string;
  readonly maxRequests?: number;
  readonly windowInMinutes?: number;
};

type RateLimitResult = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: string;
};

const RATE_LIMIT_TABLE = 'edge_function_rate_limits';
const RATE_LIMIT_ALERTS_TABLE = 'edge_function_rate_limit_alerts';

const getMaxRequests = (functionName: string, override?: number): number => {
  if (typeof override === 'number' && override > 0) {
    return override;
  }

  const envName = `RATE_LIMIT_MAX_REQUESTS_${functionName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const fromEnv = Deno.env.get(envName) ?? Deno.env.get('RATE_LIMIT_MAX_REQUESTS');
  const parsed = fromEnv ? Number.parseInt(fromEnv, 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
};

const getWindowInMinutes = (functionName: string, override?: number): number => {
  if (typeof override === 'number' && override > 0) {
    return override;
  }

  const envName = `RATE_LIMIT_WINDOW_MINUTES_${functionName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const fromEnv = Deno.env.get(envName) ?? Deno.env.get('RATE_LIMIT_WINDOW_MINUTES');
  const parsed = fromEnv ? Number.parseInt(fromEnv, 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1440; // 24 hours
};

const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

export const enforceRateLimit = async ({
  supabase,
  functionName,
  identifier,
  maxRequests,
  windowInMinutes,
}: RateLimitOptions): Promise<RateLimitResult> => {
  const now = new Date();
  const windowMinutes = getWindowInMinutes(functionName, windowInMinutes);
  const windowMs = minutesToMs(windowMinutes);
  const windowStart = new Date(now.getTime() - windowMs);
  const maxAllowed = getMaxRequests(functionName, maxRequests);

  const { data: existingRecord, error: selectError } = await supabase
    .from(RATE_LIMIT_TABLE)
    .select('id, request_count, window_start')
    .eq('function_name', functionName)
    .eq('identifier', identifier)
    .maybeSingle();

  if (selectError) {
    console.error('Rate limit select failed', { functionName, identifier, selectError });
  }

  if (!existingRecord) {
    const { error: insertError } = await supabase
      .from(RATE_LIMIT_TABLE)
      .insert({
        function_name: functionName,
        identifier,
        window_start: now.toISOString(),
        request_count: 1,
        last_request_at: now.toISOString(),
      });

    if (insertError) {
      console.error('Rate limit insert failed', { functionName, identifier, insertError });
    }

    return {
      allowed: true,
      remaining: Math.max(maxAllowed - 1, 0),
      resetAt: new Date(now.getTime() + windowMs).toISOString(),
    };
  }

  const currentCount = existingRecord.request_count ?? 0;
  const currentWindowStart = existingRecord.window_start
    ? new Date(existingRecord.window_start)
    : windowStart;

  const isOutsideWindow = currentWindowStart.getTime() < windowStart.getTime();

  if (isOutsideWindow) {
    const { error: resetError } = await supabase
      .from(RATE_LIMIT_TABLE)
      .update({
        window_start: now.toISOString(),
        request_count: 1,
        last_request_at: now.toISOString(),
      })
      .eq('function_name', functionName)
      .eq('identifier', identifier);

    if (resetError) {
      console.error('Rate limit reset failed', { functionName, identifier, resetError });
    }

    return {
      allowed: true,
      remaining: Math.max(maxAllowed - 1, 0),
      resetAt: new Date(now.getTime() + windowMs).toISOString(),
    };
  }

  if (currentCount >= maxAllowed) {
    const { error: alertError } = await supabase
      .from(RATE_LIMIT_ALERTS_TABLE)
      .insert({
        function_name: functionName,
        identifier,
        request_count: currentCount,
        window_start: currentWindowStart.toISOString(),
        occurred_at: now.toISOString(),
      });

    if (alertError) {
      console.error('Rate limit alert insert failed', { functionName, identifier, alertError });
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(currentWindowStart.getTime() + windowMs).toISOString(),
    };
  }

  const { error: updateError } = await supabase
    .from(RATE_LIMIT_TABLE)
    .update({
      request_count: currentCount + 1,
      last_request_at: now.toISOString(),
    })
    .eq('function_name', functionName)
    .eq('identifier', identifier);

  if (updateError) {
    console.error('Rate limit update failed', { functionName, identifier, updateError });
  }

  return {
    allowed: true,
    remaining: Math.max(maxAllowed - (currentCount + 1), 0),
    resetAt: new Date(currentWindowStart.getTime() + windowMs).toISOString(),
  };
};

