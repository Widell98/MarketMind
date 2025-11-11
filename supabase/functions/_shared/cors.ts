const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.marketmind.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const parseAllowedOrigins = (): string[] => {
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
};

const allowedOrigins = new Set(parseAllowedOrigins());

const normalizeMethods = (methods?: string[] | string): string => {
  if (!methods) {
    return 'POST, OPTIONS';
  }

  if (typeof methods === 'string') {
    return methods;
  }

  return methods.join(', ');
};

export type CorsContext = {
  readonly origin: string | null;
  readonly isAllowed: boolean;
  readonly headers: HeadersInit;
  readonly toOptionsResponse: () => Response;
  readonly toForbiddenResponse: (message?: string) => Response;
  readonly json: (body: Record<string, unknown>, status?: number) => Response;
};

export const createCorsContext = (
  req: Request,
  options?: { allowedMethods?: string[] | string },
): CorsContext => {
  const origin = req.headers.get('Origin');
  const allowedMethods = normalizeMethods(options?.allowedMethods);
  const effectiveOrigin = origin ?? DEFAULT_ALLOWED_ORIGINS[0];
  const isAllowed = !origin || allowedOrigins.has(origin);

  const baseHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': isAllowed ? effectiveOrigin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  const toOptionsResponse = () => {
    if (!isAllowed) {
      return new Response('Origin not allowed', {
        status: 403,
        headers: baseHeaders,
      });
    }

    return new Response(null, {
      status: 204,
      headers: baseHeaders,
    });
  };

  const toForbiddenResponse = (message = 'Origin not allowed') =>
    new Response(
      JSON.stringify({
        success: false,
        error: 'forbidden_origin',
        message,
      }),
      {
        status: 403,
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/json',
      },
    });

  return {
    origin,
    isAllowed,
    headers: baseHeaders,
    toOptionsResponse,
    toForbiddenResponse,
    json,
  };
};

