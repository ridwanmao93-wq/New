import { Router } from "express";
import { tables } from "../config/env";
import { createRecord } from "../services/airtable";
import { hydrationSchema } from "../schemas/hydrationSchema";
import {
  page,
  successPage,
  errorPage,
  numberField,
  textArea,
  dateField,
} from "../utils/html";

const router = Router();

router.get("/hydration", (_req, res) => {
  const form = `
  <form method="post" action="/hydration" class="card">
    ${dateField()}
    ${numberField("waterIntakeMl", "Water intake (ML)", { min: 0, hint: "Fill ML or OZ — the other is calculated." })}
    ${numberField("waterIntakeOz", "Water intake (OZ)", { min: 0, step: "0.1" })}
    ${numberField("hydrationGoalMl", "Hydration goal (ML)", { min: 0, hint: "Defaults to 3000 ml if blank." })}
    <label>Source</label>
    <select name="source">
      <option value="Manual">Manual</option>
      <option value="LARQ">LARQ</option>
      <option value="Apple Health">Apple Health</option>
    </select>
    ${textArea("notes", "Notes")}
    <button type="submit">Save hydration</button>
  </form>`;
  res.send(page("Hydration", form, "Manual logging now; LARQ / Apple Health later."));
});

router.post("/hydration", async (req, res) => {
  const parsed = hydrationSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return res.status(400).send(errorPage(msg, "/hydration"));
  }
  const d = parsed.data;
  try {
    await createRecord(tables.hydration, {
      Date: d.date,
      "Water Intake ML": d.waterIntakeMl,
      "Water Intake OZ": d.waterIntakeOz,
      "Hydration Goal ML": d.hydrationGoalMl,
      "Hydration Goal Percentage": d.hydrationGoalPercentage,
      Source: d.source,
      Notes: d.notes,
      "Created At": new Date().toISOString(),
    });
    res.send(successPage("Hydration entry", "/hydration"));
  } catch (err) {
    console.error("❌ Failed to save hydration:", err);
    res.status(500).send(errorPage("Could not save to Airtable. Check server logs.", "/hydration"));
  }
});

export default router;
