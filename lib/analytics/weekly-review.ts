import type { SupabaseClient } from "@supabase/supabase-js";
import { previousSevenDays, today, addDays } from "@/lib/dates";

/**
 * Generate (and upsert) a weekly review for a user, aggregating the
 * previous 7 days across all tables.
 */

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/** Longest run of consecutive calendar days in a set of ISO dates. */
function longestStreak(dateSet: Set<string>): number {
  let longest = 0;
  for (const d of dateSet) {
    // Only count the start of a run (previous day absent).
    if (dateSet.has(addDays(d, -1))) continue;
    let len = 1;
    let cur = d;
    while (dateSet.has(addDays(cur, 1))) {
      cur = addDays(cur, 1);
      len++;
    }
    longest = Math.max(longest, len);
  }
  return longest;
}

/** Consecutive days ending today (or yesterday) that have an entry. */
function currentStreak(dateSet: Set<string>): number {
  let anchor = dateSet.has(today()) ? today() : addDays(today(), -1);
  if (!dateSet.has(anchor)) return 0;
  let len = 0;
  let cur = anchor;
  while (dateSet.has(cur)) {
    len++;
    cur = addDays(cur, -1);
  }
  return len;
}

export interface WeeklyReviewResult {
  week_start_date: string;
  week_end_date: string;
  fields: Record<string, unknown>;
}

export async function generateWeeklyReview(
  supabase: SupabaseClient,
  userId: string,
  notes: { reflection_notes?: string; intentions_for_next_week?: string } = {}
): Promise<WeeklyReviewResult> {
  const { start, end } = previousSevenDays();
  console.log(`📊 Generating weekly review ${start} → ${end} for user ${userId}`);

  const inWindow = (q: any) => q.gte("date", start).lte("date", end).eq("user_id", userId);

  const [morning, evening, oura, workouts, weight, hydration] = await Promise.all([
    inWindow(supabase.from("cbt_morning_entries").select("date, mood_score, energy_score, hopefulness_score")),
    inWindow(supabase.from("cbt_evening_entries").select("date, mood_score, energy_score, hopefulness_score")),
    inWindow(
      supabase
        .from("oura_daily_metrics")
        .select("date, sleep_score, readiness_score, hrv, resting_heart_rate")
    ),
    inWindow(supabase.from("workouts").select("date, completed")),
    inWindow(supabase.from("weight_entries").select("date, weight_lbs")),
    inWindow(supabase.from("hydration_entries").select("date, hydration_goal_percentage")),
  ]);

  for (const r of [morning, evening, oura, workouts, weight, hydration]) {
    if (r.error) throw new Error(r.error.message);
  }

  const m = morning.data ?? [];
  const e = evening.data ?? [];
  const o = oura.data ?? [];
  const w = workouts.data ?? [];
  const wt = weight.data ?? [];
  const hy = hydration.data ?? [];

  const cbt = [...m, ...e];

  // Streaks use all practice dates across full history.
  const [allMorning, allEvening] = await Promise.all([
    supabase.from("cbt_morning_entries").select("date").eq("user_id", userId),
    supabase.from("cbt_evening_entries").select("date").eq("user_id", userId),
  ]);
  const practiceDates = new Set<string>([
    ...((allMorning.data ?? []).map((r: any) => String(r.date))),
    ...((allEvening.data ?? []).map((r: any) => String(r.date))),
  ]);

  const morningDays = new Set(m.map((r: any) => String(r.date))).size;
  const eveningDays = new Set(e.map((r: any) => String(r.date))).size;

  const fields = {
    user_id: userId,
    week_start_date: start,
    week_end_date: end,
    avg_mood: avg(cbt.map((r: any) => r.mood_score)),
    avg_energy: avg(cbt.map((r: any) => r.energy_score)),
    avg_hopefulness: avg(cbt.map((r: any) => r.hopefulness_score)),
    avg_sleep_score: avg(o.map((r: any) => r.sleep_score)),
    avg_readiness_score: avg(o.map((r: any) => r.readiness_score)),
    avg_hrv: avg(o.map((r: any) => r.hrv)),
    avg_resting_heart_rate: avg(o.map((r: any) => r.resting_heart_rate)),
    avg_weight: avg(wt.map((r: any) => r.weight_lbs)),
    workouts_completed: w.filter((r: any) => r.completed).length,
    avg_hydration_percentage: avg(hy.map((r: any) => r.hydration_goal_percentage)),
    morning_completion_percentage: Math.round((morningDays / 7) * 100),
    evening_completion_percentage: Math.round((eveningDays / 7) * 100),
    current_streak: currentStreak(practiceDates),
    longest_streak: longestStreak(practiceDates),
    reflection_notes: notes.reflection_notes ?? null,
    intentions_for_next_week: notes.intentions_for_next_week ?? null,
  };

  const { error } = await supabase
    .from("weekly_reviews")
    .upsert(fields, { onConflict: "user_id,week_start_date" });
  if (error) throw new Error(`Failed to save weekly review: ${error.message}`);

  console.log(`✅ Weekly review saved for week starting ${start}.`);
  return { week_start_date: start, week_end_date: end, fields };
}
