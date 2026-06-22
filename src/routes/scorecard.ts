import { Router } from "express";
import { generateWeeklyScorecard } from "../services/weeklyScorecard";

const router = Router();

/**
 * POST /api/generate-weekly-scorecard
 * Aggregates the previous 7 days and upserts a Weekly Scorecard row.
 */
router.post("/api/generate-weekly-scorecard", async (_req, res) => {
  try {
    const result = await generateWeeklyScorecard();
    res.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Scorecard generation failed:", message);
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
