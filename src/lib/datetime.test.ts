import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, isSameDay, monthGrid, ymd } from './datetime';

describe('formatDateTime', () => {
  it('returns dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—');
  });
  it('formats ISO timestamps as YYYY-MM-DD HH:mm', () => {
    expect(formatDateTime('2026-04-26T14:32:05.000Z')).toMatch(/^2026-04-26 \d{2}:\d{2}$/);
  });
  it('returns the original string when not parseable', () => {
    expect(formatDateTime('not a date')).toBe('not a date');
  });
});

describe('formatDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(formatDate('2026-04-26T14:32:00Z')).toMatch(/^2026-04-26$/);
  });
});

describe('monthGrid', () => {
  it('returns exactly 42 dates', () => {
    expect(monthGrid(2026, 3)).toHaveLength(42);
  });
  it('starts on Sunday', () => {
    const grid = monthGrid(2026, 3);
    expect(grid[0].getDay()).toBe(0);
  });
  it('contains the first of the month', () => {
    const grid = monthGrid(2026, 3);
    const first = grid.find((d) => d.getDate() === 1 && d.getMonth() === 3);
    expect(first).toBeTruthy();
  });
});

describe('isSameDay', () => {
  it('matches same calendar day', () => {
    expect(isSameDay(new Date(2026, 3, 26, 1), new Date(2026, 3, 26, 23))).toBe(true);
  });
  it('rejects different days', () => {
    expect(isSameDay(new Date(2026, 3, 26), new Date(2026, 3, 27))).toBe(false);
  });
});

describe('ymd', () => {
  it('zero-pads month and day', () => {
    expect(ymd(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
