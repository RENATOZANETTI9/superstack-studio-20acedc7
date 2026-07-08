/**
 * Pure helpers for the "Real vs Projetado" queries in PartnersSimulator.
 *
 * All windows are computed in the *local* timezone so the counters and the
 * weekly chart always reflect the user's own day/week/month, regardless of
 * how the browser is offset from UTC.
 */

export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

/** Current YYYY-MM in local time — matches partner_commissions.reference_month. */
export const getReferenceMonth = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

/** Local midnight 6 days ago (inclusive of today = 7-day window). */
export const getWeekStart = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
};

/** ISO instant equivalent to the local week start — used as a server filter. */
export const getWeekStartISO = (now: Date = new Date()): string =>
  getWeekStart(now).toISOString();

/** Ordered list of the last 7 days as { dia, dateKey } in local time. */
export const getWeekBuckets = (
  now: Date = new Date(),
): Array<{ dia: string; dateKey: string }> => {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const buckets: Array<{ dia: string; dateKey: string }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ dia: dayNames[d.getDay()], dateKey: localDateKey(d) });
  }
  return buckets;
};

export interface PerfSample {
  label: string;
  ms: number;
  overBudget: boolean;
}

/** Threshold above which a query is considered slow (ms). */
export const PERF_BUDGET_MS = 500;

/**
 * Times an async query and logs a warning when it exceeds PERF_BUDGET_MS.
 * Returns both the result and the perf sample so callers can aggregate.
 */
export async function measureQuery<T>(
  label: string,
  fn: () => Promise<T>,
  budgetMs: number = PERF_BUDGET_MS,
): Promise<{ result: T; sample: PerfSample }> {
  const start =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const result = await fn();
  const end =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const ms = end - start;
  const overBudget = ms > budgetMs;
  const sample: PerfSample = { label, ms, overBudget };
  if (overBudget) {
    // eslint-disable-next-line no-console
    console.warn(
      `[perf] ${label} took ${ms.toFixed(1)}ms (budget ${budgetMs}ms)`,
    );
  }
  return { result, sample };
}