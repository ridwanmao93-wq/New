import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOuraRange, type OuraDayMetrics } from "./client";
import { yesterday } from "@/lib/dates";

/**
 * Sync Oura data into the oura_daily_metrics table for a user.
 *
 * Uses upsert on (user_id, date) so re-running never creates duplicate
 * rows — existing days are updated in place.
 */
export async function syncOura(
  supabase: SupabaseClient,
  userId: string,
  opts: { startDate?: string; endDate?: string } = {}
): Promise<{ synced: number; days: string[]; metrics: OuraDayMetrics[] }> {
  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "OURA_ACCESS_TOKEN is not set. Create one at https://cloud.ouraring.com/personal-access-tokens"
    );
  }

  const start = opts.startDate ?? yesterday();
  const end = opts.endDate ?? start;

  console.log(`🔄 Syncing Oura data ${start} → ${end} for user ${userId}`);
  const metrics = await fetchOuraRange(token, start, end);

  if (metrics.length === 0) {
    console.log("ℹ️  No Oura data returned for that range.");
    return { synced: 0, days: [], metrics: [] };
  }

  const rows = metrics.map((m) => ({
    user_id: userId,
    date: m.date,
    sleep_score: m.sleep_score ?? null,
    readiness_score: m.readiness_score ?? null,
    activity_score: m.activity_score ?? null,
    total_sleep_duration: m.total_sleep_duration ?? null,
    resting_heart_rate: m.resting_heart_rate ?? null,
    hrv: m.hrv ?? null,
    steps: m.steps ?? null,
    calories_burned: m.calories_burned ?? null,
    sleep_efficiency: m.sleep_efficiency ?? null,
    deep_sleep_duration: m.deep_sleep_duration ?? null,
    rem_sleep_duration: m.rem_sleep_duration ?? null,
    awake_time: m.awake_time ?? null,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("oura_daily_metrics")
    .upsert(rows, { onConflict: "user_id,date" });

  if (error) {
    throw new Error(`Failed to upsert Oura metrics: ${error.message}`);
  }

  const days = metrics.map((m) => m.date);
  console.log(`✅ Oura sync complete: ${rows.length} day(s) [${days.join(", ")}]`);
  return { synced: rows.length, days, metrics };
}
