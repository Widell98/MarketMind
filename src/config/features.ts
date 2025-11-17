const importMetaEnv = typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
  ? (import.meta.env as Record<string, string | undefined>)
  : undefined;

const readEnv = (key: string, fallback?: string) => {
  if (importMetaEnv && importMetaEnv[key] !== undefined) {
    return importMetaEnv[key];
  }

  if (typeof process !== 'undefined' && process.env?.[key] !== undefined) {
    return process.env[key];
  }

  return fallback;
};

export const polymarketFeature = {
  enabled: (readEnv('VITE_ENABLE_POLYMARKET', 'false') ?? 'false').toString().toLowerCase() === 'true',
  cacheTtlMs: Number(readEnv('VITE_POLYMARKET_CACHE_TTL_MS', '60000')),
  rateLimitMs: Number(readEnv('VITE_POLYMARKET_RATE_LIMIT_MS', '750')),
  functionName: readEnv('VITE_POLYMARKET_FUNCTION_NAME', 'polymarket-markets') ?? 'polymarket-markets',
  requireAgeCheck: (readEnv('VITE_POLYMARKET_REQUIRE_AGE', 'true') ?? 'true').toLowerCase() === 'true',
  minimumAge: Number(readEnv('VITE_POLYMARKET_MIN_AGE', '18')),
  blockedRegions: (readEnv('VITE_POLYMARKET_BLOCKED_REGIONS', 'US,CA,UK') ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean),
  monitoringNamespace: readEnv('VITE_POLYMARKET_METRICS_NAMESPACE', 'polymarket') ?? 'polymarket',
  allowGuestPortfolio: (readEnv('VITE_POLYMARKET_ALLOW_GUEST_PORTFOLIO', 'false') ?? 'false')
    .toString()
    .toLowerCase() === 'true',
};

export const featureFlags = {
  polymarket: polymarketFeature,
};
