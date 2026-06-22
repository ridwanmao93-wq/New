import { env, tables } from "../config/env";
import { upsertByDate } from "./airtable";
import { today, yesterday } from "../utils/dates";

/**
 * Oura API v2 integration.
 *
 * Pulls daily sleep, readiness, activity and (when available) the
 * detailed sleep session, then writes a single consolidated row per
 * day into the "Daily Health Metrics" Airtable table. Upsert-by-date
 * guarantees we never create duplicate rows for the same day.
 *
 * Docs: https://cloud.ouraring.com/v2/docs
 */

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

interface OuraDailyDoc {
  day: string;
  score?: number;
  [k: string]: unknown;
}

interface OuraListResponse<T> {
  data: T[];
  next_token?: string | null;
}

async function ouraGet<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!env.OURA_ACCESS_TOKEN) {
    throw new Error(
      "OURA_ACCESS_TOKEN is not set. Add a Personal Access Token from https://cloud.ouraring.com/personal-access-tokens"
    );
  }
  const url = new URL(`${OURA_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.OURA_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Oura API ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Oura's daily endpoints use an inclusive start_date but an exclusive
 * end_date, so to fetch a single day we ask for [day, day+1).
 */
function nextDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function pickForDay<T extends OuraDailyDoc>(docs: T[], day: string): T | undefined {
  return docs.find((d) => d.day === day);
}

/** Seconds -> hours, rounded to 2dp. */
function secondsToHours(seconds?: number): number | undefined {
  if (seconds === undefined || seconds === null) return undefined;
  return Math.round((seconds / 3600) * 100) / 100;
}

export interface DailyHealthRow {
  date: string;
  sleepScore?: number;
  readinessScore?: number;
  activityScore?: number;
  totalSleepHours?: number;
  restingHeartRate?: number;
  hrv?: number;
  steps?: number;
  caloriesBurned?: number;
  sleepEfficiency?: number;
  deepSleepHours?: number;
  remSleepHours?: number;
  awakeHours?: number;
}

/**
 * Fetch and consolidate all Oura metrics for a single day.
 */
export async function fetchOuraDay(day: string): Promise<DailyHealthRow> {
  const params = { start_date: day, end_date: nextDay(day) };

  // Fire the requests in parallel — they are independent.
  const [sleepSummary, readiness, activity, sleepSessions] = await Promise.all([
    ouraGet<OuraListResponse<OuraDailyDoc>>("daily_sleep", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>("daily_readiness", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>("daily_activity", params),
    ouraGet<OuraListResponse<OuraDailyDoc>>("sleep", params),
  ]);

  const sleepDoc = pickForDay(sleepSummary.data, day);
  const readinessDoc = pickForDay(readiness.data, day);
  const activityDoc = pickForDay(activity.data, day);

  // The detailed "sleep" endpoint can return multiple sessions (naps);
  // use the longest one as the main night of sleep.
  const sessions = sleepSessions.data.filter((s) => s.day === day);
  const mainSleep = sessions.sort(
    (a, b) => ((b.total_sleep_duration as number) ?? 0) - ((a.total_sleep_duration as number) ?? 0)
  )[0] as Record<string, unknown> | undefined;

  const readinessContrib = (readinessDoc?.contributors ?? {}) as Record<string, unknown>;

  return {
    date: day,
    sleepScore: sleepDoc?.score,
    readinessScore: readinessDoc?.score,
    activityScore: activityDoc?.score,
    totalSleepHours: secondsToHours(mainSleep?.total_sleep_duration as number | undefined),
    restingHeartRate:
      (mainSleep?.lowest_heart_rate as number | undefined) ??
      (mainSleep?.average_heart_rate as number | undefined),
    hrv: mainSleep?.average_hrv as number | undefined,
    steps: activityDoc?.steps as number | undefined,
    caloriesBurned:
      (activityDoc?.total_calories as number | undefined) ??
      (activityDoc?.active_calories as number | undefined),
    sleepEfficiency: mainSleep?.efficiency as number | undefined,
    deepSleepHours: secondsToHours(mainSleep?.deep_sleep_duration as number | undefined),
    remSleepHours: secondsToHours(mainSleep?.rem_sleep_duration as number | undefined),
    awakeHours: secondsToHours(mainSleep?.awake_time as number | undefined),
  };
}

/** Map a DailyHealthRow to the exact Airtable field names. */
function toAirtableFields(row: DailyHealthRow): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Date: row.date,
    Source: "Oura",
    "Synced At": new Date().toISOString(),
  };
  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) fields[key] = value;
  };
  set("Oura Sleep Score", row.sleepScore);
  set("Oura Readiness Score", row.readinessScore);
  set("Oura Activity Score", row.activityScore);
  set("Total Sleep Duration", row.totalSleepHours);
  set("Resting Heart Rate", row.restingHeartRate);
  set("HRV", row.hrv);
  set("Steps", row.steps);
  set("Calories Burned", row.caloriesBurned);
  set("Sleep Efficiency", row.sleepEfficiency);
  set("Deep Sleep Duration", row.deepSleepHours);
  set("REM Sleep Duration", row.remSleepHours);
  set("Awake Time", row.awakeHours);
  return fields;
}

/**
 * Sync a single day's Oura data into Airtable (upsert by date).
 */
export async function syncOuraForDay(
  day: string
): Promise<{ day: string; action: "created" | "updated"; row: DailyHealthRow }> {
  console.log(`🔄 Syncing Oura data for ${day}...`);
  const row = await fetchOuraDay(day);
  const { action } = await upsertByDate(tables.dailyHealth, day, toAirtableFields(row));
  console.log(`✅ Oura ${day}: ${action} (sleep=${row.sleepScore ?? "—"}, readiness=${row.readinessScore ?? "—"})`);
  return { day, action, row };
}

/**
 * Default daily sync target: yesterday, because the current day's Oura
 * data is usually incomplete until the ring has synced after sleep.
 */
export async function syncYesterday() {
  return syncOuraForDay(yesterday());
}

export { today, yesterday };
