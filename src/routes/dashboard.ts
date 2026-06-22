import { Router } from "express";
import { tables } from "../config/env";
import { listRecords } from "../services/airtable";
import { today, lastNDays, previousSevenDays, isWithin } from "../utils/dates";
import { page, escapeHtml } from "../utils/html";

const router = Router();

function num(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

function dateOf(r: Record<string, unknown>): string {
  return String(r["Date"] ?? "").slice(0, 10);
}

/** Latest record (by Date) from a list. */
function latest(records: Record<string, unknown>[]): Record<string, unknown> | undefined {
  return [...records].sort((a, b) => dateOf(b).localeCompare(dateOf(a)))[0];
}

function stat(value: unknown, label: string, suffix = ""): string {
  const v = value === undefined || value === null || value === "" ? "—" : `${value}${suffix}`;
  return `<div class="stat"><div class="v">${escapeHtml(v)}</div><div class="l">${escapeHtml(
    label
  )}</div></div>`;
}

/** Build a 7-day trend table for a single metric. */
function trendTable(
  title: string,
  days: string[],
  valueByDate: Map<string, unknown>
): string {
  const rows = days
    .map((d) => {
      const v = valueByDate.get(d);
      return `<tr><td>${escapeHtml(d)}</td><td>${
        v === undefined || v === null ? "—" : escapeHtml(v)
      }</td></tr>`;
    })
    .join("");
  return `<h2>${escapeHtml(title)}</h2>
    <div class="card"><table><thead><tr><th>Date</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

router.get("/dashboard", async (_req, res) => {
  try {
    const [morning, evening, health, workouts, weight, hydration] = await Promise.all([
      listRecords(tables.cbtMorning, { sortField: "Date" }),
      listRecords(tables.cbtEvening, { sortField: "Date" }),
      listRecords(tables.dailyHealth, { sortField: "Date" }),
      listRecords(tables.workouts, { sortField: "Date" }),
      listRecords(tables.weight, { sortField: "Date" }),
      listRecords(tables.hydration, { sortField: "Date" }),
    ]);

    const todayStr = today();
    const days7 = lastNDays(7);
    const { start, end } = previousSevenDays(today());
    // For "this week" we use a rolling last-7-days window ending today.
    const weekStart = lastNDays(7)[0];

    // Today's CBT (prefer morning, fall back to evening).
    const todayMorning = morning.find((r) => dateOf(r) === todayStr);
    const todayEvening = evening.find((r) => dateOf(r) === todayStr);
    const todayCbt = todayMorning ?? todayEvening;

    const latestHealth = latest(health);
    const latestWeight = latest(weight);
    const latestHydration = latest(hydration);

    const workoutsThisWeek = workouts.filter(
      (r) => isWithin(dateOf(r), weekStart, todayStr) && String(r["Completed Yes/No"]).toLowerCase() === "yes"
    ).length;

    const morningDaysThisWeek = new Set(
      morning.filter((r) => isWithin(dateOf(r), weekStart, todayStr)).map(dateOf)
    ).size;
    const eveningDaysThisWeek = new Set(
      evening.filter((r) => isWithin(dateOf(r), weekStart, todayStr)).map(dateOf)
    ).size;

    const topStats = `
      <div class="grid">
        ${stat(todayCbt?.["Mood Score 1-10"], "Mood today")}
        ${stat(todayCbt?.["Energy Score 1-10"], "Energy today")}
        ${stat(todayCbt?.["Hopefulness Score 1-10"], "Hopefulness today")}
        ${stat(latestHealth?.["Oura Sleep Score"], "Latest sleep score")}
        ${stat(latestHealth?.["Oura Readiness Score"], "Latest readiness")}
        ${stat(latestHealth?.["HRV"], "Latest HRV")}
        ${stat(latestHealth?.["Resting Heart Rate"], "Resting HR")}
        ${stat(latestWeight?.["Weight"], "Latest weight")}
        ${stat(workoutsThisWeek, "Workouts this week")}
        ${stat(latestHydration?.["Hydration Goal Percentage"], "Hydration goal", "%")}
        ${stat(`${morningDaysThisWeek}/7`, "Morning CBT this week")}
        ${stat(`${eveningDaysThisWeek}/7`, "Evening CBT this week")}
      </div>`;

    // Trend maps (combine morning+evening for mood, prefer morning).
    const moodByDate = new Map<string, unknown>();
    for (const r of [...evening, ...morning]) moodByDate.set(dateOf(r), r["Mood Score 1-10"]);
    const sleepByDate = new Map(health.map((r) => [dateOf(r), r["Oura Sleep Score"]]));
    const readinessByDate = new Map(health.map((r) => [dateOf(r), r["Oura Readiness Score"]]));
    const weightByDate = new Map(weight.map((r) => [dateOf(r), r["Weight"]]));

    const workoutCountByDate = new Map<string, number>();
    for (const r of workouts) {
      const d = dateOf(r);
      workoutCountByDate.set(d, (workoutCountByDate.get(d) ?? 0) + 1);
    }

    const trends = [
      trendTable("Last 7 days — Mood", days7, moodByDate),
      trendTable("Last 7 days — Sleep score", days7, sleepByDate),
      trendTable("Last 7 days — Readiness", days7, readinessByDate),
      trendTable("Last 7 days — Weight", days7, weightByDate),
      trendTable("Last 7 days — Workouts logged", days7, workoutCountByDate),
    ].join("");

    const body = `${topStats}${trends}
      <h2>Actions</h2>
      <div class="card">
        <p>
          <a href="/api/sync/oura" onclick="event.preventDefault();fetch('/api/sync/oura',{method:'POST'}).then(r=>r.json()).then(d=>alert(JSON.stringify(d,null,2)))">Sync Oura (yesterday)</a>
          &nbsp;·&nbsp;
          <a href="/api/generate-weekly-scorecard" onclick="event.preventDefault();fetch('/api/generate-weekly-scorecard',{method:'POST'}).then(r=>r.json()).then(d=>alert(JSON.stringify(d,null,2)))">Generate weekly scorecard</a>
        </p>
        <p class="hint">Scorecard window: ${escapeHtml(start)} → ${escapeHtml(end)}</p>
      </div>`;

    res.send(page("Performance Dashboard", body, `Snapshot for ${todayStr}`));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Dashboard failed:", message);
    res
      .status(500)
      .send(page("Dashboard error", `<div class="card"><p>${escapeHtml(message)}</p></div>`));
  }
});

export default router;
