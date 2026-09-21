import { describe, it, expect } from 'vitest';

/**
 * These tests verify streak calculation logic.
 * The actual streak calculation is in the statistics API route.
 * Here we test the algorithm in isolation.
 */

function calculateStreaks(
  sortedDatesDesc: string[],
  today: string
): { currentStreak: number; longestStreak: number } {
  if (sortedDatesDesc.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dates = [...sortedDatesDesc].sort();

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentRun++;
    } else if (diffDays > 1) {
      currentRun = 1;
    }
    longestStreak = Math.max(longestStreak, currentRun);
  }

  const lastDate = dates[dates.length - 1];
  const lastDateObj = new Date(lastDate);
  const todayObj = new Date(today);
  const daysSinceLast = Math.round(
    (todayObj.getTime() - lastDateObj.getTime()) / 86400000
  );

  if (daysSinceLast > 1) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = dates.length - 2; i >= 0; i--) {
    const curr = new Date(dates[i + 1]);
    const prev = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
    } else if (diffDays > 1) {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

describe('calculateStreaks', () => {
  it('returns 0 for empty dates', () => {
    const result = calculateStreaks([], '2026-09-20');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('returns 1 for a single workout today', () => {
    const result = calculateStreaks(['2026-09-20'], '2026-09-20');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('counts consecutive days', () => {
    const dates = ['2026-09-20', '2026-09-19', '2026-09-18'];
    const result = calculateStreaks(dates, '2026-09-20');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('breaks streak on gap', () => {
    const dates = ['2026-09-20', '2026-09-18'];
    const result = calculateStreaks(dates, '2026-09-20');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('handles current streak = 0 when last workout was 2+ days ago', () => {
    const dates = ['2026-09-17', '2026-09-16'];
    const result = calculateStreaks(dates, '2026-09-20');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  it('includes yesterday in current streak', () => {
    const dates = ['2026-09-19', '2026-09-18'];
    const result = calculateStreaks(dates, '2026-09-20');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('handles duplicate dates (same day = 1 active day)', () => {
    const dates = ['2026-09-20', '2026-09-20', '2026-09-19'];
    const uniqueDates = [...new Set(dates)];
    const result = calculateStreaks(uniqueDates, '2026-09-20');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('correctly identifies longest streak in the past', () => {
    const dates = [
      '2026-09-20',
      '2026-09-15', '2026-09-14', '2026-09-13', '2026-09-12', '2026-09-11',
    ];
    const result = calculateStreaks(dates, '2026-09-20');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(5);
  });

  it('handles month boundary', () => {
    const dates = ['2026-10-01', '2026-09-30', '2026-09-29'];
    const result = calculateStreaks(dates, '2026-10-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles year boundary', () => {
    const dates = ['2027-01-01', '2026-12-31', '2026-12-30'];
    const result = calculateStreaks(dates, '2027-01-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles leap year', () => {
    const dates = ['2028-03-01', '2028-02-29', '2028-02-28'];
    const result = calculateStreaks(dates, '2028-03-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles non-leap year February', () => {
    const dates = ['2027-03-01', '2027-02-28', '2027-02-27'];
    const result = calculateStreaks(dates, '2027-03-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });
});
