import { z } from "zod";
import { today } from "../utils/dates";

/** A 1–10 score. Accepts numeric strings from form posts. */
export const scoreSchema = z.coerce
  .number({ invalid_type_error: "Score must be a number" })
  .int("Score must be a whole number")
  .min(1, "Score must be at least 1")
  .max(10, "Score must be at most 10");

/** Optional 1–10 score (blank form fields allowed). */
export const optionalScoreSchema = z
  .union([z.literal(""), scoreSchema])
  .transform((v) => (v === "" ? undefined : v))
  .optional();

/**
 * Date field: ISO YYYY-MM-DD. Defaults to today if missing/blank.
 * Form posts send "" for empty date inputs, so coerce those too.
 */
export const dateSchema = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")])
  .optional()
  .transform((v) => (v && v !== "" ? v : today()));

/** Trim a string, turn "" into undefined. */
export const optionalText = z
  .string()
  .optional()
  .transform((v) => {
    const t = (v ?? "").trim();
    return t === "" ? undefined : t;
  });
