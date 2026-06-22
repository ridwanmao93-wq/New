import { Router } from "express";
import { tables } from "../config/env";
import { createRecord } from "../services/airtable";
import { workoutSchema } from "../schemas/workoutSchema";
import {
  page,
  successPage,
  errorPage,
  numberField,
  textField,
  textArea,
  dateField,
} from "../utils/html";

const router = Router();

router.get("/workout", (_req, res) => {
  const form = `
  <form method="post" action="/workout" class="card">
    ${dateField()}
    ${textField("workoutType", "Workout type", { placeholder: "Strength, Run, Yoga…" })}
    ${numberField("durationMinutes", "Duration (minutes)", { min: 0 })}
    ${textArea("exercises", "Exercises")}
    ${textArea("setsRepsWeight", "Sets / Reps / Weight")}
    ${numberField("intensity", "Intensity (1–10)", { min: 1, max: 10 })}
    <label>Completed?</label>
    <select name="completed">
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
    ${textArea("notes", "Notes")}
    <button type="submit">Save workout</button>
  </form>`;
  res.send(page("Log a Workout", form, "Track training and consistency."));
});

router.post("/workout", async (req, res) => {
  const parsed = workoutSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return res.status(400).send(errorPage(msg, "/workout"));
  }
  const d = parsed.data;
  try {
    await createRecord(tables.workouts, {
      Date: d.date,
      "Workout Type": d.workoutType,
      "Duration Minutes": d.durationMinutes,
      Exercises: d.exercises,
      "Sets/Reps/Weight": d.setsRepsWeight,
      "Intensity 1-10": d.intensity,
      "Completed Yes/No": d.completed ? "Yes" : "No",
      Notes: d.notes,
      "Created At": new Date().toISOString(),
    });
    res.send(successPage("Workout", "/workout"));
  } catch (err) {
    console.error("❌ Failed to save workout:", err);
    res.status(500).send(errorPage("Could not save to Airtable. Check server logs.", "/workout"));
  }
});

export default router;
