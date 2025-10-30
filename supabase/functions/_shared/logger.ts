const DEBUG_ENABLED = Deno.env.get('DEBUG_LOGGING') === 'true';

const SENSITIVE_KEYWORDS = [
  'token',
  'secret',
  'key',
  'password',
  'email',
  'session',
  'auth',
  'user',
  'message',
  'content',
  'body',
  'prompt',
  'portfolio',
  'customer',
  'response',
  'request',
];

function shouldRedact(key: string) {
  return SENSITIVE_KEYWORDS.some((keyword) => key.includes(keyword));
}

function sanitizeValue(key: string, value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (shouldRedact(key)) {
      return '[REDACTED]';
    }

    if (value.length > 120) {
      return `[string length=${value.length}]`;
    }

    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return `[array length=${value.length}]`;
    }

    return value.slice(0, 5).map((item) => sanitizeValue(key, item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[object]';
    }

    const sanitized: Record<string, unknown> = {};

    for (const [innerKey, innerValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[innerKey] = sanitizeValue(innerKey.toLowerCase(), innerValue, depth + 1);
    }

    return sanitized;
  }

  return '[unserializable]';
}

function sanitizeMetadata(meta: unknown): unknown {
  if (!meta) {
    return undefined;
  }

  if (Array.isArray(meta)) {
    return meta.map((value, index) => sanitizeValue(String(index), value));
  }

  if (typeof meta === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(key.toLowerCase(), value);
    }

    return sanitized;
  }

  return meta;
}

function formatLogMessage(scope: string, level: string, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = sanitizeMetadata(meta);
  const metaSuffix = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
  return `${timestamp} [${scope}] ${level} ${message}${metaSuffix}`;
}

export function generateRequestId() {
  try {
    return crypto.randomUUID();
  } catch (_error) {
    return Math.random().toString(36).slice(2, 10);
  }
}

export function createScopedLogger(scope: string, requestId?: string) {
  const scoped = requestId ? `${scope}:${requestId}` : scope;

  return {
    info(message: string, meta?: Record<string, unknown>) {
      console.log(formatLogMessage(scoped, 'INFO', message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(formatLogMessage(scoped, 'WARN', message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(formatLogMessage(scoped, 'ERROR', message, meta));
    },
    debug(message: string, meta?: Record<string, unknown>) {
      if (!DEBUG_ENABLED) {
        return;
      }

      console.log(formatLogMessage(scoped, 'DEBUG', message, meta));
    },
  };
}
