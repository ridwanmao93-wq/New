import { Router } from "express";
import { tables } from "../config/env";
import { createRecord } from "../services/airtable";
import { weightSchema } from "../schemas/weightSchema";
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

router.get("/weight", (_req, res) => {
  const form = `
  <form method="post" action="/weight" class="card">
    ${dateField()}
    ${numberField("weight", "Weight", { min: 0, step: "0.1", required: true, hint: "kg or lb — be consistent." })}
    ${numberField("waist", "Waist measurement (optional)", { min: 0, step: "0.1" })}
    ${textField("progressPhotoUrl", "Progress photo URL (optional)")}
    ${textArea("notes", "Notes")}
    <button type="submit">Save weight</button>
  </form>`;
  res.send(page("Weight & Progress", form, "Log weight and measurements."));
});

router.post("/weight", async (req, res) => {
  const parsed = weightSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return res.status(400).send(errorPage(msg, "/weight"));
  }
  const d = parsed.data;
  try {
    await createRecord(tables.weight, {
      Date: d.date,
      Weight: d.weight,
      "Waist Measurement": d.waist,
      "Progress Photo URL": d.progressPhotoUrl,
      Notes: d.notes,
      "Created At": new Date().toISOString(),
    });
    res.send(successPage("Weight entry", "/weight"));
  } catch (err) {
    console.error("❌ Failed to save weight:", err);
    res.status(500).send(errorPage("Could not save to Airtable. Check server logs.", "/weight"));
  }
});

export default router;
