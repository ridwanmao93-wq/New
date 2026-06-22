import { Router } from "express";
import { tables } from "../config/env";
import { createRecord } from "../services/airtable";
import { eveningSchema } from "../schemas/eveningSchema";
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

router.get("/evening", (_req, res) => {
  const form = `
  <form method="post" action="/evening" class="card">
    ${dateField()}
    ${numberField("mood", "Mood (1–10)", { min: 1, max: 10, required: true })}
    ${numberField("energy", "Energy (1–10)", { min: 1, max: 10, required: true })}
    ${numberField("hopefulness", "Hopefulness (1–10)", { min: 1, max: 10, required: true })}
    ${textArea("whatWentWell", "What went well")}
    ${textArea("actedWithValues", "Where I acted with values")}
    ${textField("keyEmotions", "Key emotions")}
    ${textArea("trigger", "Trigger / Event")}
    ${textArea("automaticThought", "Automatic thought")}
    ${textField("cognitiveDistortion", "Cognitive distortion")}
    ${textArea("balancedPerspective", "Balanced perspective")}
    ${textField("gratitude1", "Gratitude 1")}
    ${textField("gratitude2", "Gratitude 2")}
    ${textField("gratitude3", "Gratitude 3")}
    ${textArea("notes", "Notes")}
    <button type="submit">Save evening entry</button>
  </form>`;
  res.send(page("Evening CBT Practice", form, "Reflect and reframe before bed."));
});

router.post("/evening", async (req, res) => {
  const parsed = eveningSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return res.status(400).send(errorPage(msg, "/evening"));
  }
  const d = parsed.data;
  try {
    await createRecord(tables.cbtEvening, {
      Date: d.date,
      "Mood Score 1-10": d.mood,
      "Energy Score 1-10": d.energy,
      "Hopefulness Score 1-10": d.hopefulness,
      "What went well": d.whatWentWell,
      "Where I acted with values": d.actedWithValues,
      "Key emotions": d.keyEmotions,
      "Trigger/Event": d.trigger,
      "Automatic Thought": d.automaticThought,
      "Cognitive Distortion": d.cognitiveDistortion,
      "Balanced Perspective": d.balancedPerspective,
      "Gratitude 1": d.gratitude1,
      "Gratitude 2": d.gratitude2,
      "Gratitude 3": d.gratitude3,
      Notes: d.notes,
      "Created At": new Date().toISOString(),
    });
    res.send(successPage("Evening CBT entry", "/evening"));
  } catch (err) {
    console.error("❌ Failed to save evening entry:", err);
    res.status(500).send(errorPage("Could not save to Airtable. Check server logs.", "/evening"));
  }
});

export default router;
