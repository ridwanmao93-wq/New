import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, today } from "@/lib/dates";
import { buildInsight, pairByDate, type Insight } from "./correlation";

type Row = Record<string, any>;

function toMap(rows: Row[], field: string): Map<string, number | null> {
  const m = new Map<string, number | null>();
  for (const r of rows) {
    const v = r[field];
    m.set(String(r.date), typeof v === "number" ? v : v == null ? null : Number(v));
  }
  return m;
}

function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/**
 * Plain-English group comparison for binary conditions (e.g. cannabis
 * vs cannabis-free days) where a correlation coefficient is less
 * intuitive than a difference of averages.
 */
function groupCompare(
  title: string,
  metricLabel: string,
  freeAvg: number | null,
  usedAvg: number | null,
  freeLabel: string,
  usedLabel: string,
  higherIsBetter = true
): Insight {
  if (freeAvg == null || usedAvg == null) {
    return {
      title,
      r: null,
      n: 0,
      strength: "none",
      direction: "none",
      message: "Not enough data on both kinds of days yet. Keep logging.",
    };
  }
  const diff = Math.round((freeAvg - usedAvg) * 10) / 10;
  const abs = Math.abs(diff);
  if (abs < 0.1) {
    return {
      title,
      r: 0,
      n: 2,
      strength: "none",
      direction: "none",
      message: `No meaningful difference in ${metricLabel} between ${freeLabel} and ${usedLabel} days yet.`,
    };
  }
  const higherSide = diff > 0 ? freeLabel : usedLabel;
  return {
    title,
    r: null,
    n: 2,
    strength: abs >= 3 ? "strong" : abs >= 1 ? "moderate" : "weak",
    direction: diff > 0 === higherIsBetter ? "positive" : "negative",
    message: `On ${higherSide} days, your average ${metricLabel} is ${abs} points higher (${freeLabel}: ${freeAvg}, ${usedLabel}: ${usedAvg}).`,
  };
}

/**
 * Build the full set of correlation insight cards for the user over the
 * last `days` days.
 */
export async function getCorrelationInsights(
  supabase: SupabaseClient,
  userId: string,
  days = 90
): Promise<Insight[]> {
  const from = addDays(today(), -(days - 1));
  const get = async (table: string) => {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .gte("date", from)
      .order("date", { ascending: true });
    return (data ?? []) as Row[];
  };

  const [oura, morning, evening, workouts, weight, hydration, alignment, momentum, sobriety, avoidance] =
    await Promise.all([
      get("oura_daily_metrics"),
      get("cbt_morning_entries"),
      get("cbt_evening_entries"),
      get("workouts"),
      get("weight_entries"),
      get("hydration_entries"),
      get("daily_alignment_entries"),
      get("daily_momentum_entries"),
      get("sobriety_entries"),
      get("anti_avoidance_entries"),
    ]);

  const cbt = [...evening, ...morning]; // morning wins on duplicate dates
  const mood = toMap(cbt, "mood_score");
  const energy = toMap(cbt, "energy_score");
  const hope = toMap(cbt, "hopefulness_score");
  const sleep = toMap(oura, "sleep_score");
  const readiness = toMap(oura, "readiness_score");
  const hrv = toMap(oura, "hrv");
  const restingHr = toMap(oura, "resting_heart_rate");
  const hydrationPct = toMap(hydration, "hydration_goal_percentage");
  const alignmentScore = toMap(alignment, "daily_alignment_score");
  const momentumScore = toMap(momentum, "momentum_score");
  const cravings = toMap(sobriety, "craving_score");

  // Per-day workout completion (1/0) and avoidance wins (1/0).
  const workoutDone = new Map<string, number | null>();
  for (const w of workouts) workoutDone.set(String(w.date), w.completed ? 1 : 0);
  const avoidanceWin = new Map<string, number | null>();
  for (const a of avoidance) {
    if (a.hardest_thing_i_did_not_want_to_do) avoidanceWin.set(String(a.date), a.did_i_do_it ? 1 : 0);
  }

  const insights: Insight[] = [
    buildInsight("Sleep vs Mood", "sleep score", "mood", pairByDate(sleep, mood)),
    buildInsight("Sleep vs Hopefulness", "sleep score", "hopefulness", pairByDate(sleep, hope)),
    buildInsight("Readiness vs Energy", "readiness", "energy", pairByDate(readiness, energy)),
    buildInsight("HRV vs Mood", "HRV", "mood", pairByDate(hrv, mood)),
    buildInsight("Resting HR vs Mood", "resting heart rate", "mood", pairByDate(restingHr, mood)),
    buildInsight("Workouts vs Mood", "workout completion", "mood", pairByDate(workoutDone, mood)),
    buildInsight("Workouts vs Hopefulness", "workout completion", "hopefulness", pairByDate(workoutDone, hope)),
    buildInsight("Hydration vs Energy", "hydration %", "energy", pairByDate(hydrationPct, energy)),
    buildInsight("Alignment vs Mood", "alignment score", "mood", pairByDate(alignmentScore, mood)),
    buildInsight("Momentum vs Hopefulness", "momentum score", "hopefulness", pairByDate(momentumScore, hope)),
    buildInsight("Avoidance wins vs Mood", "courage (avoidance wins)", "mood", pairByDate(avoidanceWin, mood)),
    buildInsight("Sleep vs Cravings", "sleep score", "cravings", pairByDate(sleep, cravings)),
  ];

  // Cannabis group comparisons.
  const soberDates = new Set(sobriety.filter((r) => !r.cannabis_used).map((r) => String(r.date)));
  const usedDates = new Set(sobriety.filter((r) => r.cannabis_used).map((r) => String(r.date)));
  const avgOn = (m: Map<string, number | null>, dates: Set<string>) =>
    average([...dates].map((d) => m.get(d)));

  insights.push(
    groupCompare(
      "Cannabis vs Sleep",
      "sleep score",
      avgOn(sleep, soberDates),
      avgOn(sleep, usedDates),
      "cannabis-free",
      "cannabis-use"
    ),
    groupCompare(
      "Cannabis vs Mood",
      "mood",
      avgOn(mood, soberDates),
      avgOn(mood, usedDates),
      "cannabis-free",
      "cannabis-use"
    ),
    groupCompare(
      "Cannabis vs Readiness",
      "readiness",
      avgOn(readiness, soberDates),
      avgOn(readiness, usedDates),
      "cannabis-free",
      "cannabis-use"
    )
  );

  // Weight vs workout consistency (trailing-7-day completed workout count).
  const weightPairs: Array<[number, number]> = [];
  for (const w of weight) {
    if (typeof w.weight_lbs !== "number" && w.weight_lbs == null) continue;
    const d = String(w.date);
    let count = 0;
    for (let i = 0; i < 7; i++) {
      if (workoutDone.get(addDays(d, -i)) === 1) count++;
    }
    const wv = Number(w.weight_lbs);
    if (Number.isFinite(wv)) weightPairs.push([count, wv]);
  }
  insights.push(
    buildInsight("Workout consistency vs Weight", "weekly workout count", "weight", weightPairs)
  );

  return insights;
}
