const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';

const marketSessions = [
  { name: 'Stockholm', startMinutes: 9 * 60, endMinutes: 17 * 60 + 30 },
  { name: 'US', startMinutes: 15 * 60 + 30, endMinutes: 22 * 60 },
];

const holidayCalendar = new Set<string>([
  // Swedish market holidays
  '2024-01-01', // New Year's Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-05-01', // Labour Day
  '2024-05-09', // Ascension Day
  '2024-06-06', // National Day of Sweden
  '2024-06-21', // Midsummer Eve
  '2024-12-24', // Christmas Eve
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day
  '2024-12-31', // New Year's Eve
  // US market holidays (expressed in Stockholm date)
  '2024-01-15', // Martin Luther King Jr. Day
  '2024-02-19', // Presidents' Day
  '2024-03-29', // Good Friday
  '2024-05-27', // Memorial Day
  '2024-07-04', // Independence Day
  '2024-09-02', // Labor Day
  '2024-11-28', // Thanksgiving
  '2024-12-25', // Christmas Day
]);

const getStockholmDate = (date: Date) =>
  new Date(date.toLocaleString('en-US', { timeZone: STOCKHOLM_TIME_ZONE }));

export const isMarketHoliday = (date: Date = new Date()) => {
  const stockholmDate = getStockholmDate(date);
  const isoDate = stockholmDate.toISOString().slice(0, 10);
  return holidayCalendar.has(isoDate);
};

export const isMarketOpen = (date: Date = new Date()) => {
  const stockholmDate = getStockholmDate(date);
  const dayOfWeek = stockholmDate.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  if (isMarketHoliday(stockholmDate)) {
    return false;
  }

  const minutes = stockholmDate.getHours() * 60 + stockholmDate.getMinutes();
  return marketSessions.some((session) => minutes >= session.startMinutes && minutes < session.endMinutes);
};

export const getNextMarketOpen = (date: Date = new Date()) => {
  const stockholmDate = getStockholmDate(date);
  const minutesNow = stockholmDate.getHours() * 60 + stockholmDate.getMinutes();

  for (let offset = 0; offset < 10; offset++) {
    const candidate = new Date(stockholmDate);
    candidate.setDate(stockholmDate.getDate() + offset);
    const searchDate = new Date(candidate);
    searchDate.setHours(0, 0, 0, 0);

    const dayOfWeek = searchDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6 || isMarketHoliday(searchDate)) {
      continue;
    }

    const nextSession = marketSessions.find((session) =>
      offset > 0 || minutesNow < session.endMinutes
    );

    if (nextSession) {
      const nextOpen = new Date(searchDate);
      nextOpen.setHours(
        Math.floor(nextSession.startMinutes / 60),
        nextSession.startMinutes % 60,
        0,
        0
      );
      if (offset === 0 && minutesNow >= nextSession.startMinutes) {
        // If we're already within the session, the next open is the current time
        return new Date(stockholmDate);
      }
      return nextOpen;
    }
  }

  return null;
};
