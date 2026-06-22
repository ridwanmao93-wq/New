import { tables } from "../config/env";
import { listRecords, upsertByDate } from "./airtable";
import { previousSevenDays, isWithin } from "../utils/dates";

/**
 * Weekly scorecard generation.
 *
 * Aggregates the previous 7-day window (ending yesterday) across all
 * tables and writes a single summary row into the "Weekly Scorecard"
 * table, keyed on the week start date (upsert so re-runs overwrite).
 */

function num(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

function average(values: (number | undefined)[]): number | undefined {
  const nums = values.filter((v): v is number => v !== undefined);
  if (nums.length === 0) return undefined;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.round(avg * 100) / 100;
}

/** Records whose Date falls in [start, end]. */
function inWindow(records: Record<string, unknown>[], start: string, end: string) {
  return records.filter((r) => {
    const d = String(r["Date"] ?? "").slice(0, 10);
    return d && isWithin(d, start, end);
  });
}

export interface ScorecardResult {
  weekStart: string;
  weekEnd: string;
  fields: Record<string, unknown>;
}

export async function generateWeeklyScorecard(): Promise<ScorecardResult> {
  const { start, end } = previousSevenDays();
  console.log(`📊 Generating weekly scorecard for ${start} → ${end}...`);

  // Pull everything we need in parallel.
  const [morning, evening, health, workouts, weight, hydration] = await Promise.all([
    listRecords(tables.cbtMorning),
    listRecords(tables.cbtEvening),
    listRecords(tables.dailyHealth),
    listRecords(tables.workouts),
    listRecords(tables.weight),
    listRecords(tables.hydration),
  ]);

  const mWeek = inWindow(morning, start, end);
  const eWeek = inWindow(evening, start, end);
  const hWeek = inWindow(health, start, end);
  const wWeek = inWindow(workouts, start, end);
  const wtWeek = inWindow(weight, start, end);
  const hyWeek = inWindow(hydration, start, end);

  // CBT scores combine morning + evening entries.
  const moods = [...mWeek, ...eWeek].map((r) => num(r["Mood Score 1-10"]));
  const energy = [...mWeek, ...eWeek].map((r) => num(r["Energy Score 1-10"]));
  const hope = [...mWeek, ...eWeek].map((r) => num(r["Hopefulness Score 1-10"]));

  const workoutsCompleted = wWeek.filter(
    (r) => String(r["Completed Yes/No"]).toLowerCase() === "yes"
  ).length;

  // Completion % = days with an entry out of 7.
  const morningDays = new Set(mWeek.map((r) => String(r["Date"]).slice(0, 10))).size;
  const eveningDays = new Set(eWeek.map((r) => String(r["Date"]).slice(0, 10))).size;

  const fields: Record<string, unknown> = {
    "Week Start Date": start,
    "Week End Date": end,
    "Average Mood": average(moods),
    "Average Energy": average(energy),
    "Average Hopefulness": average(hope),
    "Average Sleep Score": average(hWeek.map((r) => num(r["Oura Sleep Score"]))),
    "Average Readiness Score": average(hWeek.map((r) => num(r["Oura Readiness Score"]))),
    "Average HRV": average(hWeek.map((r) => num(r["HRV"]))),
    "Average Resting Heart Rate": average(hWeek.map((r) => num(r["Resting Heart Rate"]))),
    "Average Weight": average(wtWeek.map((r) => num(r["Weight"]))),
    "Workouts Completed": workoutsCompleted,
    "Average Water Goal Percentage": average(
      hyWeek.map((r) => num(r["Hydration Goal Percentage"]))
    ),
    "CBT Morning Completion %": Math.round((morningDays / 7) * 100),
    "CBT Evening Completion %": Math.round((eveningDays / 7) * 100),
    "Created At": new Date().toISOString(),
  };

  // Drop undefined averages so Airtable doesn't get empty values.
  for (const k of Object.keys(fields)) {
    if (fields[k] === undefined) delete fields[k];
  }

  const { action } = await upsertByDate(
    tables.weeklyScorecard,
    start,
    fields,
    "Week Start Date"
  );
  console.log(`✅ Weekly scorecard ${action} for week starting ${start}.`);

  return { weekStart: start, weekEnd: end, fields };
}
