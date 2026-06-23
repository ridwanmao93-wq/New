/**
 * Date helpers. Everything keys on ISO date strings (YYYY-MM-DD) so
 * records line up across tables and charts.
 *
 * "Today" is resolved in the app's timezone (default America/New_York)
 * so the day rolls over at local midnight, not UTC midnight. Override
 * with APP_TIMEZONE (e.g. "America/Los_Angeles").
 */

const APP_TZ = process.env.APP_TIMEZONE || "America/New_York";

/** UTC-based date string — used only for pure calendar arithmetic below. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The current calendar date in the app's timezone. */
export function today(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function yesterday(): string {
  return addDays(today(), -1);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** Last `n` days as ISO strings, oldest first, ending today (inclusive). */
export function lastNDays(n: number): string[] {
  const end = today();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

/** The 7-day window ending yesterday, relative to `reference` (default today). */
export function previousSevenDays(reference: string = today()): {
  start: string;
  end: string;
} {
  const end = addDays(reference, -1);
  const start = addDays(end, -6);
  return { start, end };
}

export function isWithin(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end;
}

/** Inclusive list of every ISO date between start and end. */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
