import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  getReferenceMonth,
  getWeekStart,
  getWeekStartISO,
  getWeekBuckets,
  localDateKey,
  measureQuery,
  PERF_BUDGET_MS,
} from '../period-helpers';

describe('period-helpers — local timezone windows', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('localDateKey formats YYYY-MM-DD in local time (not UTC)', () => {
    // 23:30 local on Jan 15 — UTC would already be Jan 16 in +02:00 zones,
    // but our helper must stay on Jan 15 regardless.
    const d = new Date(2027, 0, 15, 23, 30, 0);
    expect(localDateKey(d)).toBe('2027-01-15');
  });

  it('getReferenceMonth returns the local YYYY-MM', () => {
    expect(getReferenceMonth(new Date(2027, 6, 3, 10))).toBe('2027-07');
    expect(getReferenceMonth(new Date(2027, 11, 31, 22))).toBe('2027-12');
  });

  it('getWeekStart is exactly 6 days before "today" at local midnight', () => {
    const now = new Date(2027, 2, 10, 15, 20, 0); // Mar 10 2027 15:20 local
    const start = getWeekStart(now);
    expect(start.getFullYear()).toBe(2027);
    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(4);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('getWeekBuckets returns 7 ordered buckets ending on "today"', () => {
    const now = new Date(2027, 2, 10, 12, 0); // Wed Mar 10 2027
    const buckets = getWeekBuckets(now);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].dateKey).toBe('2027-03-04');
    expect(buckets[6].dateKey).toBe('2027-03-10');
    // dia names must match local weekday of the corresponding dateKey
    expect(buckets[6].dia).toBe(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][
      new Date(2027, 2, 10).getDay()
    ]);
  });

  it('crossing month boundary keeps buckets and reference month consistent', () => {
    // 3rd of the month — week window spans previous month.
    const now = new Date(2027, 6, 3, 9, 0); // Jul 3 2027
    const buckets = getWeekBuckets(now);
    expect(buckets[0].dateKey).toBe('2027-06-27');
    expect(buckets[6].dateKey).toBe('2027-07-03');
    // reference_month must still be the local current month, not last month
    expect(getReferenceMonth(now)).toBe('2027-07');
  });

  it('crossing year boundary works (Jan 2nd looks back into December)', () => {
    const now = new Date(2028, 0, 2, 8, 0);
    const buckets = getWeekBuckets(now);
    expect(buckets[0].dateKey).toBe('2027-12-27');
    expect(buckets[6].dateKey).toBe('2028-01-02');
    expect(getReferenceMonth(now)).toBe('2028-01');
  });

  it('DST-style near-midnight instants do not drift the day key', () => {
    // 00:15 local — UTC could be the previous day in negative offsets. The
    // key must reflect the LOCAL calendar day.
    const now = new Date(2027, 9, 1, 0, 15, 0);
    expect(localDateKey(now)).toBe('2027-10-01');
    expect(getReferenceMonth(now)).toBe('2027-10');
  });

  it('getWeekStartISO is an ISO string parseable back to local midnight -6d', () => {
    const now = new Date(2027, 4, 20, 14, 0);
    const iso = getWeekStartISO(now);
    const parsed = new Date(iso);
    expect(parsed.getTime()).toBe(getWeekStart(now).getTime());
  });
});

describe('period-helpers — fake system clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rolls the reference month when the clock crosses midnight of the 1st', () => {
    vi.setSystemTime(new Date(2027, 6, 31, 23, 59, 30)); // Jul 31 23:59:30
    expect(getReferenceMonth(new Date())).toBe('2027-07');
    vi.setSystemTime(new Date(2027, 7, 1, 0, 0, 30)); // Aug 1 00:00:30
    expect(getReferenceMonth(new Date())).toBe('2027-08');
  });

  it('week buckets shift by exactly one day when "today" advances by 24h', () => {
    vi.setSystemTime(new Date(2027, 5, 15, 10, 0));
    const before = getWeekBuckets(new Date());
    vi.setSystemTime(new Date(2027, 5, 16, 10, 0));
    const after = getWeekBuckets(new Date());
    expect(after[6].dateKey).toBe('2027-06-16');
    expect(after[0].dateKey).toBe('2027-06-10');
    // Overlap: last 6 items of "after" must equal last 6 of "before" shifted
    expect(after[0].dateKey).toBe(before[1].dateKey);
    expect(after[5].dateKey).toBe(before[6].dateKey);
  });
});

describe('measureQuery — perf budget alerting', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resolves with the underlying result and reports timing', async () => {
    const { result, sample } = await measureQuery('t.fast', async () => ({ data: [1, 2], error: null }));
    expect(result).toEqual({ data: [1, 2], error: null });
    expect(sample.label).toBe('t.fast');
    expect(sample.ms).toBeGreaterThanOrEqual(0);
  });

  it('warns and flags overBudget when the query exceeds the budget', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sample } = await measureQuery(
      't.slow',
      async () => {
        await new Promise(r => setTimeout(r, 30));
        return { data: [], error: null };
      },
      5, // 5ms budget forces a warning
    );
    expect(sample.overBudget).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('[perf] t.slow');
  });

  it('does not warn when under the default budget', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sample } = await measureQuery('t.ok', async () => ({ data: [], error: null }));
    expect(sample.overBudget).toBe(false);
    expect(sample.ms).toBeLessThan(PERF_BUDGET_MS);
    expect(spy).not.toHaveBeenCalled();
  });
});