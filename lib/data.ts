import type { SupabaseClient } from "@supabase/supabase-js";
import { lastNDays, addDays, today, datesBetween } from "@/lib/dates";

/**
 * Server-side data access for the dashboard and analytics pages.
 * Everything is scoped to the authenticated user via RLS.
 */

type Row = Record<string, any>;

async function range(supabase: SupabaseClient, table: string, userId: string, fromDate: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .order("date", { ascending: true });
  // Degrade gracefully: a missing table (e.g. a migration not run yet)
  // should never brick the whole dashboard — treat it as no data.
  if (error) {
    console.error(`data: ${table} query failed: ${error.message}`);
    return [] as Row[];
  }
  return (data ?? []) as Row[];
}

/** Build a Map<date, value> from rows, keeping the last value per date. */
export function mapByDate(rows: Row[], field: string): Map<string, number | null> {
  const m = new Map<string, number | null>();
  for (const r of rows) {
    const v = r[field];
    m.set(String(r.date), typeof v === "number" ? v : v == null ? null : Number(v));
  }
  return m;
}

/** Series of {date, value} for the last n days from a date→value map. */
export function series(days: string[], map: Map<string, number | null>) {
  return days.map((d) => ({ date: d, value: map.get(d) ?? null }));
}

export function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function latest(rows: Row[]): Row | undefined {
  return rows.length ? rows[rows.length - 1] : undefined;
}

export async function getDashboardData(supabase: SupabaseClient, userId: string) {
  const from30 = addDays(today(), -29);
  const [
    oura,
    morning,
    evening,
    workouts,
    weight,
    hydration,
    alignment,
    momentum,
    sobriety,
    avoidance,
    relationships,
    focus,
  ] = await Promise.all([
    range(supabase, "oura_daily_metrics", userId, from30),
    range(supabase, "cbt_morning_entries", userId, from30),
    range(supabase, "cbt_evening_entries", userId, from30),
    range(supabase, "workouts", userId, from30),
    range(supabase, "weight_entries", userId, from30),
    range(supabase, "hydration_entries", userId, from30),
    range(supabase, "daily_alignment_entries", userId, from30),
    range(supabase, "daily_momentum_entries", userId, from30),
    range(supabase, "sobriety_entries", userId, from30),
    range(supabase, "anti_avoidance_entries", userId, from30),
    range(supabase, "relationship_entries", userId, from30),
    range(supabase, "focus_sessions", userId, from30),
  ]);

  // Debt: latest snapshot (no date filter).
  const { data: debtRows } = await supabase
    .from("debt_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  const debt = latest((debtRows ?? []) as Row[]);

  // Vision board items (for the rotating "vision of the day").
  const { data: visionRows } = await supabase
    .from("vision_board_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const vision = (visionRows ?? []) as Row[];

  // Latest weekly review (for "this week's intentions" on the dashboard).
  const { data: reviewRows } = await supabase
    .from("weekly_reviews")
    .select("intentions_for_next_week, week_start_date")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(1);
  const latestIntentions = reviewRows?.[0]?.intentions_for_next_week ?? null;

  const td = today();
  const days7 = lastNDays(7);
  const days30 = lastNDays(30);
  const weekStart = days7[0];

  // Pick one vision item that rotates by day so it changes daily.
  const dayIndex = Math.floor(Date.parse(td + "T00:00:00Z") / 86400000);
  const visionOfDay = vision.length ? vision[dayIndex % vision.length] : undefined;

  const find = (rows: Row[], d = td) => rows.find((r) => String(r.date) === d);
  const inWeek = (rows: Row[]) => rows.filter((r) => String(r.date) >= weekStart && String(r.date) <= td);

  // CBT (mood etc.) — combine morning + evening, prefer morning per day.
  const moodMap = mapByDate([...evening, ...morning], "mood_score");
  const energyMap = mapByDate([...evening, ...morning], "energy_score");
  const hopeMap = mapByDate([...evening, ...morning], "hopefulness_score");

  const todayMorning = find(morning);
  const todayEvening = find(evening);
  const todayCbt = todayMorning ?? todayEvening;

  const latestOura = latest(oura);
  const latestWeight = latest(weight);
  const latestHydration = latest(hydration);
  const latestMorning = latest(morning);
  const todayAlignment = find(alignment);
  const todayMomentum = find(momentum);
  const todayAvoidance = find(avoidance);

  // --- Sobriety streaks (sober = no cannabis on a logged day) ---
  const soberDates = new Set(sobriety.filter((r) => !r.cannabis_used).map((r) => String(r.date)));
  const cannabisDates = new Set(sobriety.filter((r) => r.cannabis_used).map((r) => String(r.date)));
  const currentSoberStreak = computeCurrentStreak(soberDates, cannabisDates);
  const longestSoberStreak = computeLongestStreak(soberDates);
  const monthStart = td.slice(0, 7) + "-01";
  const cannabisFreeThisMonth = sobriety.filter(
    (r) => String(r.date) >= monthStart && !r.cannabis_used
  ).length;

  // Sleep & mood split by cannabis use.
  const ouraSleepByDate = mapByDate(oura, "sleep_score");
  const sleepSober = average([...soberDates].map((d) => ouraSleepByDate.get(d)));
  const sleepCannabis = average([...cannabisDates].map((d) => ouraSleepByDate.get(d)));
  const moodSober = average([...soberDates].map((d) => moodMap.get(d)));
  const moodCannabis = average([...cannabisDates].map((d) => moodMap.get(d)));

  // Identity themes (most common words across releasing/stepping-into).
  const identityThemes = topThemes(
    morning.flatMap((r) => [r.identity_releasing, r.identity_stepping_into].filter(Boolean) as string[])
  );

  // Hydration % today
  const hydrationPctToday = find(hydration)?.hydration_goal_percentage ?? null;

  // Focus / deep work.
  const sumMinutes = (rows: Row[]) =>
    rows.reduce((acc, r) => acc + (Number(r.minutes) || 0), 0);
  const deepWorkToday = sumMinutes(focus.filter((r) => String(r.date) === td));
  const deepWorkThisWeek = sumMinutes(inWeek(focus));

  const workoutsThisWeek = inWeek(workouts).filter((r) => r.completed).length;
  const relationshipTouchesThisWeek = inWeek(relationships).filter((r) => r.completed).length;
  const hrvAvg = average(oura.map((r) => r.hrv));

  // --- Just-in-time nudges (rule-based, surfaced at the top) ---
  const nudges: { text: string; tone: "good" | "warn" | "info" }[] = [];
  if (!todayMorning) {
    nudges.push({ text: "You haven’t done your morning practice yet — set your one most important action.", tone: "warn" });
  }
  if (currentSoberStreak >= 2) {
    nudges.push({ text: `🟢 ${currentSoberStreak}-day cannabis-free streak. Protect it tonight.`, tone: "good" });
  }
  if (sleepSober !== null && sleepCannabis !== null && sleepSober - sleepCannabis >= 2) {
    nudges.push({
      text: `On cannabis-free days your sleep score averages ${Math.round(sleepSober - sleepCannabis)} pts higher.`,
      tone: "info",
    });
  }
  if (latestOura?.hrv != null && hrvAvg != null && Number(latestOura.hrv) < hrvAvg * 0.85) {
    nudges.push({ text: "HRV is below your recent average — consider a lighter day and an earlier night.", tone: "warn" });
  }
  if (relationshipTouchesThisWeek === 0) {
    nudges.push({ text: "No relationship connections logged this week — reach out to someone today.", tone: "warn" });
  }
  if (workoutsThisWeek === 0) {
    nudges.push({ text: "No workouts logged this week yet.", tone: "info" });
  }
  if (hydrationPctToday !== null && Number(hydrationPctToday) < 50) {
    nudges.push({ text: `Hydration at ${hydrationPctToday}% of goal — top up.`, tone: "info" });
  }
  const topNudges = nudges.slice(0, 5);

  // Relationships this week, broken down by person + date-night flag.
  const relWeek = inWeek(relationships).filter((r) => r.completed);
  const relByPerson: Record<string, number> = {};
  for (const r of relWeek) {
    const p = String(r.person ?? "Other");
    relByPerson[p] = (relByPerson[p] ?? 0) + 1;
  }
  const dateNightThisMonth = relationships.some(
    (r) => String(r.date) >= monthStart && /date/i.test(String(r.connection_type ?? ""))
  );

  // Debt-free projection: remaining ÷ monthly payment.
  let debtFreeDate: string | null = null;
  const remaining = Number(debt?.total_debt_remaining);
  const monthly = Number(debt?.debt_paid_this_month);
  if (Number.isFinite(remaining) && remaining > 0 && Number.isFinite(monthly) && monthly > 0) {
    const months = Math.ceil(remaining / monthly);
    const dfd = new Date();
    dfd.setMonth(dfd.getMonth() + months);
    debtFreeDate = dfd.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return {
    td,
    days7,
    days30,
    // Today
    todayCbt,
    todayAlignment,
    todayMomentum,
    todayAvoidance,
    latestMorning,
    latestOura,
    latestWeight,
    latestHydration,
    hydrationPctToday,
    deepWorkToday,
    deepWorkThisWeek,
    nudges: topNudges,
    latestIntentions,
    // Top section
    currentSoberStreak,
    longestSoberStreak,
    cannabisFreeThisMonth,
    debt,
    debtFreeDate,
    relByPerson,
    dateNightThisMonth,
    visionOfDay,
    // Aggregates
    alignment7: average(inWeek(alignment).map((r) => r.daily_alignment_score)),
    alignment30: average(alignment.map((r) => r.daily_alignment_score)),
    momentum7: average(inWeek(momentum).map((r) => r.momentum_score)),
    momentum30: average(momentum.map((r) => r.momentum_score)),
    workoutsThisWeek: inWeek(workouts).filter((r) => r.completed).length,
    morningDaysThisWeek: new Set(inWeek(morning).map((r) => String(r.date))).size,
    eveningDaysThisWeek: new Set(inWeek(evening).map((r) => String(r.date))).size,
    relationshipTouchesThisWeek: inWeek(relationships).filter((r) => r.completed).length,
    avoidanceWinsThisWeek: inWeek(avoidance).filter((r) => r.did_i_do_it).length,
    avoidanceMissesThisWeek: inWeek(avoidance).filter((r) => r.hardest_thing_i_did_not_want_to_do && !r.did_i_do_it).length,
    courageStreak: computeCurrentStreak(
      new Set(avoidance.filter((r) => r.did_i_do_it).map((r) => String(r.date))),
      new Set(avoidance.filter((r) => r.hardest_thing_i_did_not_want_to_do && !r.did_i_do_it).map((r) => String(r.date)))
    ),
    // Sobriety comparisons
    sleepSober,
    sleepCannabis,
    moodSober,
    moodCannabis,
    identityThemes,
    // Trend series
    series: {
      mood: series(days7, moodMap),
      mood30: series(days30, moodMap),
      energy: series(days7, energyMap),
      hopefulness: series(days7, hopeMap),
      sleep: series(days30, mapByDate(oura, "sleep_score")),
      readiness: series(days30, mapByDate(oura, "readiness_score")),
      hrv: series(days30, mapByDate(oura, "hrv")),
      weight: series(days30, mapByDate(weight, "weight_lbs")),
      hydration: series(days7, mapByDate(hydration, "hydration_goal_percentage")),
      alignment: series(days30, mapByDate(alignment, "daily_alignment_score")),
      momentum: series(days30, mapByDate(momentum, "momentum_score")),
    },
  };
}

/** Consecutive "good" days ending today/yesterday, broken by a "bad" day. */
function computeCurrentStreak(good: Set<string>, bad: Set<string>): number {
  let cur = good.has(today()) || bad.has(today()) ? today() : addDays(today(), -1);
  let len = 0;
  while (good.has(cur)) {
    len++;
    cur = addDays(cur, -1);
  }
  return len;
}

function computeLongestStreak(good: Set<string>): number {
  let longest = 0;
  for (const d of good) {
    if (good.has(addDays(d, -1))) continue;
    let len = 1;
    let cur = d;
    while (good.has(addDays(cur, 1))) {
      cur = addDays(cur, 1);
      len++;
    }
    longest = Math.max(longest, len);
  }
  return longest;
}

/** Naive theme extraction: most frequent words (>=4 chars) across phrases. */
function topThemes(phrases: string[], limit = 5): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  const stop = new Set(["that", "with", "this", "from", "into", "about", "would", "more", "less", "than", "what", "when", "have", "they", "them", "your", "being"]);
  for (const p of phrases) {
    for (const w of p.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
      if (stop.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export { datesBetween };
