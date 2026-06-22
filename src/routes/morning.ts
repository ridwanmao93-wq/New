import { Router } from "express";
import { tables } from "../config/env";
import { createRecord } from "../services/airtable";
import { morningSchema } from "../schemas/morningSchema";
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

router.get("/morning", (_req, res) => {
  const form = `
  <form method="post" action="/morning" class="card">
    ${dateField()}
    ${numberField("mood", "Mood (1–10)", { min: 1, max: 10, required: true })}
    ${numberField("energy", "Energy (1–10)", { min: 1, max: 10, required: true })}
    ${numberField("hopefulness", "Hopefulness (1–10)", { min: 1, max: 10, required: true })}
    ${textField("stem1", "Sentence completion stem 1")}
    ${textArea("answers1", "Answers 1")}
    ${textField("stem2", "Sentence completion stem 2")}
    ${textArea("answers2", "Answers 2")}
    ${textField("actLike", "Today I will act like…")}
    ${textArea("valuesAction", "One action aligned with my values today")}
    ${textArea("smallGoal", "One small goal for today")}
    ${textArea("notes", "Notes")}
    <button type="submit">Save morning entry</button>
  </form>`;
  res.send(page("Morning CBT Practice", form, "Start the day with intention."));
});

router.post("/morning", async (req, res) => {
  const parsed = morningSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return res.status(400).send(errorPage(msg, "/morning"));
  }
  const d = parsed.data;
  try {
    await createRecord(tables.cbtMorning, {
      Date: d.date,
      "Mood Score 1-10": d.mood,
      "Energy Score 1-10": d.energy,
      "Hopefulness Score 1-10": d.hopefulness,
      "Sentence Completion Stem 1": d.stem1,
      "Sentence Completion Answers 1": d.answers1,
      "Sentence Completion Stem 2": d.stem2,
      "Sentence Completion Answers 2": d.answers2,
      "Today I will act like": d.actLike,
      "One action aligned with my values today": d.valuesAction,
      "One small goal for today": d.smallGoal,
      Notes: d.notes,
      "Created At": new Date().toISOString(),
    });
    res.send(successPage("Morning CBT entry", "/morning"));
  } catch (err) {
    console.error("❌ Failed to save morning entry:", err);
    res.status(500).send(errorPage("Could not save to Airtable. Check server logs.", "/morning"));
  }
});

export default router;
