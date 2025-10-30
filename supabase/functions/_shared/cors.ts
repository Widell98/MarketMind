function toNormalizedOrigin(candidate: string): string | null {
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch (_error) {
    return null;
  }
}

const allowedOriginSet = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => toNormalizedOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin)),
);

const defaultSiteUrl = toNormalizedOrigin(Deno.env.get('DEFAULT_SITE_URL') ?? '');

if (defaultSiteUrl) {
  allowedOriginSet.add(defaultSiteUrl);
}

const allowCredentials = Deno.env.get('CORS_ALLOW_CREDENTIALS') === 'true';

export function buildCorsHeaders(req: Request) {
  const originHeader = req.headers.get('origin') ?? '';
  const normalizedOrigin = toNormalizedOrigin(originHeader);
  const originAllowed = !normalizedOrigin || allowedOriginSet.has(normalizedOrigin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };

  let allowedOrigin: string | null = null;

  if (originHeader && originAllowed) {
    headers['Access-Control-Allow-Origin'] = originHeader;
    allowedOrigin = normalizedOrigin ?? originHeader;

    if (allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return { headers, originAllowed, allowedOrigin };
}

function getDefaultRedirectBase() {
  if (defaultSiteUrl) {
    return defaultSiteUrl;
  }

  return 'http://localhost:5173';
}

export function getSafeRedirectBase(origin: string | null | undefined) {
  if (origin && allowedOriginSet.has(origin)) {
    return origin;
  }

  return getDefaultRedirectBase();
}
