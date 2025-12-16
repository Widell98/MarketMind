// src/utils/marketHours.ts

interface HoldingLike {
  holding_type?: string;
  currency?: string;
  price_currency?: string;
}

export const isMarketOpen = (holding: HoldingLike | null | undefined): boolean => {
  if (!holding) return false;

  const type = (holding.holding_type || '').toLowerCase();
  
  // 1. Krypto och Certifikat är alltid öppna (enligt din spec)
  if (type === 'crypto' || type === 'certificate') {
    return true;
  }

  // Hämta nuvarande tid i svensk tidszon
  const now = new Date();
  const sweTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
  const currentHour = sweTime.getHours();
  const currentMinute = sweTime.getMinutes();
  const currentTimeVal = currentHour * 100 + currentMinute; // T.ex. 09:30 blir 930

  // Hämta valuta (prioritera price_currency om den finns, annars currency)
  const currency = (holding.price_currency || holding.currency || 'SEK').toUpperCase();

  // 2. USD: Öppet 15:30 – 23:59
  if (currency === 'USD') {
    return currentTimeVal >= 1530 && currentTimeVal <= 2359;
  }

  // 3. Nordiska/Europeiska valutor + Default: Öppet 09:00 – 23:59
  // (Inkluderar SEK, EUR, DKK, NOK och övriga som fallback)
  return currentTimeVal >= 900 && currentTimeVal <= 2359;
};
