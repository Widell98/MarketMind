export const stripInvestmentAnalysisPrefix = (value?: string | null): string => {
  if (typeof value !== 'string') {
    return '';
  }

  let result = value.trim();
  if (!result) {
    return '';
  }

  const patterns = [
    /^investeringsanalys\s+(?:för|av)\s+/i,
    /^investeringsanalys\s*:\s*/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(result)) {
      result = result.replace(pattern, '').trim();
    }
  }

  return result;
};

export const normalizeStockCaseTitle = (
  title?: string | null,
  fallback?: string | null,
): string => {
  const rawTitle = typeof title === 'string' ? title.trim() : '';
  const cleanedTitle = rawTitle ? stripInvestmentAnalysisPrefix(rawTitle) : '';

  if (cleanedTitle) {
    return cleanedTitle;
  }

  if (rawTitle) {
    return rawTitle;
  }

  const fallbackTitle = typeof fallback === 'string' ? fallback.trim() : '';
  if (!fallbackTitle) {
    return '';
  }

  const cleanedFallback = stripInvestmentAnalysisPrefix(fallbackTitle);
  return cleanedFallback || fallbackTitle;
};
