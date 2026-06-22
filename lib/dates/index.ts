/**
 * Date helpers. Everything keys on ISO date strings (YYYY-MM-DD) so
 * records line up across tables and charts.
 */

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function today(): string {
  return toISODate(new Date());
}

export function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return toISODate(d);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** Last `n` days as ISO strings, oldest first, ending today (inclusive). */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    out.push(toISODate(d));
  }
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
