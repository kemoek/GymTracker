import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  getTodayString,
  getDateString,
  getWeekStart,
  getWeekEnd,
  parseDateString,
} from '@/lib/utils';

describe('getDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2026, 8, 20); // September 20, 2026
    expect(getDateString(date)).toBe('2026-09-20');
  });

  it('pads single-digit month and day', () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(getDateString(date)).toBe('2026-01-05');
  });

  it('handles December correctly', () => {
    const date = new Date(2026, 11, 31);
    expect(getDateString(date)).toBe('2026-12-31');
  });
});

describe('getTodayString', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseDateString', () => {
  it('parses YYYY-MM-DD into a Date', () => {
    const date = parseDateString('2026-09-20');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8); // 0-indexed
    expect(date.getDate()).toBe(20);
  });

  it('parses January 1st correctly', () => {
    const date = parseDateString('2026-01-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });
});

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    const wed = new Date(2026, 8, 23); // Wed Sep 23, 2026
    const start = getWeekStart(wed);
    expect(start.getDay()).toBe(1); // Monday
    expect(getDateString(start)).toBe('2026-09-21');
  });

  it('returns Monday for a Monday', () => {
    const mon = new Date(2026, 8, 21);
    const start = getWeekStart(mon);
    expect(start.getDay()).toBe(1);
    expect(getDateString(start)).toBe('2026-09-21');
  });

  it('returns previous Monday for a Sunday', () => {
    const sun = new Date(2026, 8, 27);
    const start = getWeekStart(sun);
    expect(start.getDay()).toBe(1);
    expect(getDateString(start)).toBe('2026-09-21');
  });
});

describe('getWeekEnd', () => {
  it('returns Sunday for a Wednesday', () => {
    const wed = new Date(2026, 8, 23);
    const end = getWeekEnd(wed);
    expect(end.getDay()).toBe(0); // Sunday
    expect(getDateString(end)).toBe('2026-09-27');
  });
});

describe('formatDate', () => {
  it('formats a date string to human-readable format', () => {
    const result = formatDate('2026-09-20');
    expect(result).toBe('September 20, 2026');
  });

  it('formats January correctly', () => {
    const result = formatDate('2026-01-01');
    expect(result).toBe('January 1, 2026');
  });
});

describe('formatRelativeDate', () => {
  it('returns "Today" for today\'s date', () => {
    const today = getTodayString();
    expect(formatRelativeDate(today)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = getDateString(new Date(Date.now() - 86400000));
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    const result = formatRelativeDate('2020-01-15');
    expect(result).toBe('January 15, 2020');
  });
});
