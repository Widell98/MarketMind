import type { MarketauxDetectionResult } from '@/types/marketaux';

const reportKeywords = [
  'rapport',
  'rapporten',
  'earnings',
  'delårsrapport',
  'kvartalsrapport',
  'bokslut',
  'resultat',
  'eps',
  'årsrapport',
];

const newsKeywords = [
  'nyhet',
  'nyheter',
  'senaste nytt',
  'headline',
  'rubriker',
  'pressmeddelande',
  'pressrelease',
  'breaking',
  'marknadssiffror',
  'uppdatering',
];

const recencyKeywords = [
  'senaste',
  'nyligen',
  'hur gick',
  'hur var',
  'just nu',
  'vad hände',
  'uppdatering',
  'update',
];

export const detectMarketauxIntent = (
  message: string,
  companyName?: string
): MarketauxDetectionResult | null => {
  const normalized = message.toLowerCase();
  const hasQuarterMention = /\bq[1-4]\b/.test(normalized);
  const hasReportKeyword = hasQuarterMention || reportKeywords.some((keyword) => normalized.includes(keyword));
  const hasNewsKeyword = newsKeywords.some((keyword) => normalized.includes(keyword));
  const hasRecencyKeyword = recencyKeywords.some((keyword) => normalized.includes(keyword));
  const mentionsReportExplicitly = normalized.includes('rapport');
  const mentionsNewsExplicitly = normalized.includes('nyhet') || normalized.includes('nyheter');
  const mentionsCompany = companyName
    ? normalized.includes(companyName.toLowerCase())
    : false;
  const ticker = extractTickerSymbol(message);

  if (hasReportKeyword || (mentionsCompany && mentionsReportExplicitly)) {
    if (hasRecencyKeyword || mentionsReportExplicitly) {
      return { intent: 'report', symbol: ticker };
    }
  }

  if (hasNewsKeyword || mentionsNewsExplicitly) {
    if (hasRecencyKeyword || mentionsNewsExplicitly || mentionsCompany) {
      return { intent: 'news', symbol: ticker };
    }
  }

  if (hasRecencyKeyword && (mentionsCompany || ticker) && normalized.includes('marknad')) {
    return { intent: 'news', symbol: ticker };
  }

  return null;
};

export const extractTickerSymbol = (message: string): string | undefined => {
  const parenthesisMatch = message.match(/\(([A-Z]{1,5})\)/);
  if (parenthesisMatch) {
    const candidate = parenthesisMatch[1];
    if (!/^Q[1-4]$/.test(candidate)) {
      return candidate;
    }
  }

  const uppercaseMatches = message.match(/\b[A-Z]{2,5}\b/g);
  if (uppercaseMatches) {
    const candidate = uppercaseMatches.find((symbol) => !/^Q[1-4]$/.test(symbol));
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

export const buildMarketauxQuery = (message: string, companyName?: string) => {
  const normalizedMessage = message.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  const parts: string[] = [];

  if (companyName && !lowerMessage.includes(companyName.toLowerCase())) {
    parts.push(companyName.trim());
  }

  parts.push(normalizedMessage);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

export const formatPublishedDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsed);
  } catch (error) {
    console.error('Failed to format MarketAux date', error);
    return parsed.toLocaleString();
  }
};

export const formatNumberWithCurrency = (value?: number | null, currency?: string) => {
  if (value == null || Number.isNaN(value)) {
    return '–';
  }

  try {
    if (currency) {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    }

    return new Intl.NumberFormat('sv-SE', {
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error('Failed to format MarketAux metric', error);
    return value.toString();
  }
};
