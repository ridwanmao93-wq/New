/**
 * Date helpers. Everything in this project uses ISO date strings
 * (YYYY-MM-DD) as the canonical "Date" key so that records line up
 * cleanly across tables and in Airtable / Looker Studio.
 */

/** Format a Date object as YYYY-MM-DD (UTC-based to stay stable). */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date as YYYY-MM-DD. */
export function today(): string {
  return toISODate(new Date());
}

/** Yesterday's date as YYYY-MM-DD. */
export function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return toISODate(d);
}

/** Add (or subtract) days to an ISO date string. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/**
 * Return the ISO dates for the last `n` days, oldest first,
 * ending today (inclusive).
 */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    out.push(toISODate(d));
  }
  return out;
}

/**
 * Previous full 7-day window relative to today.
 * Returns { start, end } as ISO dates (inclusive). Used by the
 * weekly scorecard: the 7 days ending yesterday.
 */
export function previousSevenDays(reference: string = today()): {
  start: string;
  end: string;
} {
  const end = addDays(reference, -1); // yesterday
  const start = addDays(end, -6); // 7-day window inclusive
  return { start, end };
}

/** True if isoDate falls within [start, end] inclusive. */
export function isWithin(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end;
}
