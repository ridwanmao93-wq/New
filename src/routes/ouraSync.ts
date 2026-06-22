import { Router } from "express";
import { syncOuraForDay, syncYesterday } from "../services/oura";

const router = Router();

/**
 * POST /api/sync/oura
 *
 * Body (optional): { "date": "YYYY-MM-DD" }
 * If no date is given, syncs yesterday (the safe default — the current
 * day's Oura data is usually incomplete).
 */
router.post("/api/sync/oura", async (req, res) => {
  const date: string | undefined = req.body?.date;
  try {
    const result = date ? await syncOuraForDay(date) : await syncYesterday();
    res.json({
      ok: true,
      day: result.day,
      action: result.action,
      metrics: result.row,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Oura sync failed:", message);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
