import { Router, Request, Response } from "express";
import { tables } from "../config/env";
import { listRecords } from "../services/airtable";
import { toCSV } from "../utils/csv";

/**
 * Export endpoints for Looker Studio / Google Sheets.
 *
 * Each endpoint returns clean JSON by default, or CSV when called with
 * ?format=csv. Connect Looker Studio either to the JSON (via a
 * connector) or import the CSV into a Google Sheet and use that as the
 * data source — both stay in sync with Airtable on each request.
 */

const router = Router();

/** Column order per table, matching the Airtable schema. */
const COLUMNS: Record<string, string[]> = {
  dailyHealth: [
    "Date",
    "Oura Sleep Score",
    "Oura Readiness Score",
    "Oura Activity Score",
    "Total Sleep Duration",
    "Resting Heart Rate",
    "HRV",
    "Steps",
    "Calories Burned",
    "Sleep Efficiency",
    "Deep Sleep Duration",
    "REM Sleep Duration",
    "Awake Time",
    "Source",
    "Synced At",
  ],
  workouts: [
    "Date",
    "Workout Type",
    "Duration Minutes",
    "Exercises",
    "Sets/Reps/Weight",
    "Intensity 1-10",
    "Completed Yes/No",
    "Notes",
    "Created At",
  ],
  weight: ["Date", "Weight", "Waist Measurement", "Progress Photo URL", "Notes", "Created At"],
  hydration: [
    "Date",
    "Water Intake ML",
    "Water Intake OZ",
    "Hydration Goal ML",
    "Hydration Goal Percentage",
    "Source",
    "Notes",
    "Created At",
  ],
  weeklyScorecard: [
    "Week Start Date",
    "Week End Date",
    "Average Mood",
    "Average Energy",
    "Average Hopefulness",
    "Average Sleep Score",
    "Average Readiness Score",
    "Average HRV",
    "Average Resting Heart Rate",
    "Average Weight",
    "Workouts Completed",
    "Average Water Goal Percentage",
    "CBT Morning Completion %",
    "CBT Evening Completion %",
    "Weekly Reflection",
    "Created At",
  ],
};

/** Send records as JSON or CSV depending on ?format=csv. */
function respond(
  res: Response,
  req: Request,
  rows: Record<string, unknown>[],
  columns?: string[],
  filename = "export"
) {
  if (String(req.query.format).toLowerCase() === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    return res.send(toCSV(rows, columns));
  }
  res.json(rows);
}

async function exportTable(
  res: Response,
  req: Request,
  table: string,
  columns: string[],
  filename: string,
  sortField = "Date"
) {
  try {
    const rows = await listRecords(table, { sortField, sortDirection: "asc" });
    respond(res, req, rows, columns, filename);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Export "${table}" failed:`, message);
    res.status(500).json({ ok: false, error: message });
  }
}

router.get("/api/export/daily-health", (req, res) =>
  exportTable(res, req, tables.dailyHealth, COLUMNS.dailyHealth, "daily-health")
);

/**
 * CBT export merges morning + evening into one tidy table with a
 * "Period" column so Looker can pivot on it.
 */
router.get("/api/export/cbt", async (req, res) => {
  try {
    const [morning, evening] = await Promise.all([
      listRecords(tables.cbtMorning, { sortField: "Date" }),
      listRecords(tables.cbtEvening, { sortField: "Date" }),
    ]);
    const rows = [
      ...morning.map((r) => ({
        Date: r["Date"],
        Period: "Morning",
        Mood: r["Mood Score 1-10"],
        Energy: r["Energy Score 1-10"],
        Hopefulness: r["Hopefulness Score 1-10"],
        Notes: r["Notes"],
      })),
      ...evening.map((r) => ({
        Date: r["Date"],
        Period: "Evening",
        Mood: r["Mood Score 1-10"],
        Energy: r["Energy Score 1-10"],
        Hopefulness: r["Hopefulness Score 1-10"],
        Notes: r["Notes"],
      })),
    ].sort((a, b) => String(a.Date).localeCompare(String(b.Date)));
    respond(res, req, rows, ["Date", "Period", "Mood", "Energy", "Hopefulness", "Notes"], "cbt");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Export cbt failed:", message);
    res.status(500).json({ ok: false, error: message });
  }
});

router.get("/api/export/workouts", (req, res) =>
  exportTable(res, req, tables.workouts, COLUMNS.workouts, "workouts")
);

router.get("/api/export/weight", (req, res) =>
  exportTable(res, req, tables.weight, COLUMNS.weight, "weight")
);

router.get("/api/export/hydration", (req, res) =>
  exportTable(res, req, tables.hydration, COLUMNS.hydration, "hydration")
);

router.get("/api/export/weekly-scorecard", (req, res) =>
  exportTable(
    res,
    req,
    tables.weeklyScorecard,
    COLUMNS.weeklyScorecard,
    "weekly-scorecard",
    "Week Start Date"
  )
);

export default router;
