import { describe, expect, it } from 'vitest';
import { getNextMarketOpen, isMarketHoliday, isMarketOpen } from '../marketHours';

const dateFromStockholmTime = (isoDate: string, time: string, offset: string) =>
  new Date(`${isoDate}T${time}${offset}`);

describe('isMarketOpen', () => {
  it('returns true during Stockholm session on a weekday (CET)', () => {
    const date = dateFromStockholmTime('2024-01-02', '10:00:00', '+01:00');
    expect(isMarketOpen(date)).toBe(true);
  });

  it('returns true during Stockholm session on a weekday (CEST)', () => {
    const date = dateFromStockholmTime('2024-06-05', '10:00:00', '+02:00');
    expect(isMarketOpen(date)).toBe(true);
  });

  it('returns false before the market opens', () => {
    const date = dateFromStockholmTime('2024-01-02', '07:30:00', '+01:00');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('returns true during overlapping US session', () => {
    const date = dateFromStockholmTime('2024-01-02', '16:00:00', '+01:00');
    expect(isMarketOpen(date)).toBe(true);
  });

  it('returns false after all sessions close', () => {
    const date = dateFromStockholmTime('2024-01-02', '22:30:00', '+01:00');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('returns false on weekends', () => {
    const date = dateFromStockholmTime('2024-01-06', '12:00:00', '+01:00');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('returns false on configured holidays', () => {
    const date = dateFromStockholmTime('2024-12-25', '10:00:00', '+01:00');
    expect(isMarketOpen(date)).toBe(false);
    expect(isMarketHoliday(date)).toBe(true);
  });
});

describe('getNextMarketOpen', () => {
  it('returns the next session start when before open', () => {
    const date = dateFromStockholmTime('2024-01-02', '08:00:00', '+01:00');
    const nextOpen = getNextMarketOpen(date);
    expect(nextOpen?.getHours()).toBe(9);
    expect(nextOpen?.getMinutes()).toBe(0);
  });

  it('returns next day when after all sessions', () => {
    const date = dateFromStockholmTime('2024-01-02', '23:00:00', '+01:00');
    const nextOpen = getNextMarketOpen(date);
    expect(nextOpen?.getDate()).toBe(3);
    expect(nextOpen?.getHours()).toBe(9);
  });
});
