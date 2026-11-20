import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  localDateInZone,
  toDayNumber,
} from '../src/modules/projects/domain/local-date.js';

describe('localDateInZone', () => {
  it('formats the calendar date in the given IANA zone', () => {
    const instant = new Date('2026-11-20T23:30:00Z');
    expect(localDateInZone(instant, 'UTC')).toBe('2026-11-20');
    expect(localDateInZone(instant, 'Asia/Tokyo')).toBe('2026-11-21');
    expect(localDateInZone(instant, 'America/Los_Angeles')).toBe('2026-11-20');
  });

  it('throws RangeError for unknown zones', () => {
    expect(() => localDateInZone(new Date(), 'Not/AZone')).toThrow(RangeError);
  });
});

describe('toDayNumber', () => {
  it('converts ISO dates to a day count since the epoch', () => {
    expect(toDayNumber('1970-01-01')).toBe(0);
    expect(toDayNumber('1970-01-02')).toBe(1);
  });

  it('rejects malformed and impossible dates', () => {
    expect(() => toDayNumber('2026-1-01')).toThrow('Invalid local date: 2026-1-01');
    expect(() => toDayNumber('2026-02-30')).toThrow('Invalid local date: 2026-02-30');
  });
});

describe('daysBetween', () => {
  it('counts calendar days, ignoring DST shifts', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-11-20', '2026-11-18')).toBe(-2);
  });
});
