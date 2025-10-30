export const EDGE_FUNCTION_NON_2XX_MESSAGE = 'Edge Function returned a non-2xx status code';

export const mapEdgeFunctionErrorMessage = (
  message?: string | null,
  fallback?: string,
): string => {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (trimmedMessage.length === 0) {
    return fallback ?? '';
  }

  if (trimmedMessage === EDGE_FUNCTION_NON_2XX_MESSAGE || trimmedMessage.includes(EDGE_FUNCTION_NON_2XX_MESSAGE)) {
    return 'priset kunde inte hämtas';
  }

  return trimmedMessage;
};
