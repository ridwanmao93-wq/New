/**
 * Oura API v2 client. Docs: https://cloud.ouraring.com/v2/docs
 */

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

export interface OuraDailyDoc {
  day: string;
  score?: number;
  [k: string]: unknown;
}

interface OuraListResponse<T> {
  data: T[];
  next_token?: string | null;
}

async function ouraGet<T>(
  token: string,
  path: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${OURA_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    // Always hit the live API, never the Next.js data cache.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Oura API ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as T;
}

function nextDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function secondsToHours(seconds?: number): number | undefined {
  if (seconds === undefined || seconds === null) return undefined;
  return Math.round((seconds / 3600) * 100) / 100;
}

export interface OuraDayMetrics {
  date: string;
  sleep_score?: number;
  readiness_score?: number;
  activity_score?: number;
  total_sleep_duration?: number; // hours
  resting_heart_rate?: number;
  hrv?: number;
  steps?: number;
  calories_burned?: number;
  sleep_efficiency?: number;
  deep_sleep_duration?: number; // hours
  rem_sleep_duration?: number; // hours
  awake_time?: number; // hours
}

/**
 * Fetch and consolidate all Oura metrics for a range of days
 * (Oura uses an inclusive start_date and exclusive end_date).
 */
export async function fetchOuraRange(
  token: string,
  startDate: string,
  endDate: string
): Promise<OuraDayMetrics[]> {
  const params = { start_date: startDate, end_date: nextDay(endDate) };

  const [sleepSummary, readiness, activity, sleepSessions] = await Promise.all([
    ouraGet<OuraListResponse<OuraDailyDoc>>(token, "daily_sleep", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>(token, "daily_readiness", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>(token, "daily_activity", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>(token, "sleep", params),
  ]);

  // Collect every day mentioned across the responses.
  const days = new Set<string>();
  [sleepSummary, readiness, activity].forEach((r) => r.data.forEach((d) => days.add(d.day)));

  const byDay = (docs: OuraDailyDoc[], day: string) => docs.find((d) => d.day === day);

  return Array.from(days)
    .sort()
    .map((day) => {
      const sleepDoc = byDay(sleepSummary.data, day);
      const readinessDoc = byDay(readiness.data, day);
      const activityDoc = byDay(activity.data, day);

      // Detailed sleep can have naps; use the longest session as the night.
      const sessions = sleepSessions.data.filter((s) => s.day === day);
      const main = sessions.sort(
        (a, b) =>
          ((b.total_sleep_duration as number) ?? 0) - ((a.total_sleep_duration as number) ?? 0)
      )[0] as Record<string, unknown> | undefined;

      return {
        date: day,
        sleep_score: sleepDoc?.score,
        readiness_score: readinessDoc?.score,
        activity_score: activityDoc?.score,
        total_sleep_duration: secondsToHours(main?.total_sleep_duration as number | undefined),
        resting_heart_rate:
          (main?.lowest_heart_rate as number | undefined) ??
          (main?.average_heart_rate as number | undefined),
        hrv: main?.average_hrv as number | undefined,
        steps: activityDoc?.steps as number | undefined,
        calories_burned:
          (activityDoc?.total_calories as number | undefined) ??
          (activityDoc?.active_calories as number | undefined),
        sleep_efficiency: main?.efficiency as number | undefined,
        deep_sleep_duration: secondsToHours(main?.deep_sleep_duration as number | undefined),
        rem_sleep_duration: secondsToHours(main?.rem_sleep_duration as number | undefined),
        awake_time: secondsToHours(main?.awake_time as number | undefined),
      };
    });
}
