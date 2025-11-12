export const isSupabaseFetchError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  const message = extractMessage(error);
  const details = extractDetails(error);

  const combined = `${message} ${details}`.toLowerCase();

  return combined.includes('failed to fetch') || combined.includes('fetch failed');
};

export const getSupabaseOfflineMessage = () =>
  'Kunde inte ansluta till databasen. Kontrollera din internetanslutning och försök igen.';

const extractMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return '';
};

const extractDetails = (error: unknown): string => {
  if (isRecord(error) && typeof error.details === 'string') {
    return error.details;
  }

  return '';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
