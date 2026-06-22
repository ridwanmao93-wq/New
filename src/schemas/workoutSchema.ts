import { z } from "zod";
import { dateSchema, scoreSchema, optionalText } from "./common";

export const workoutSchema = z.object({
  date: dateSchema,
  workoutType: optionalText,
  durationMinutes: z
    .union([z.literal(""), z.coerce.number().min(0, "Duration cannot be negative")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  exercises: optionalText,
  setsRepsWeight: optionalText,
  intensity: z
    .union([z.literal(""), scoreSchema])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  // Checkbox / select: "yes"/"no"/"on" -> boolean
  completed: z
    .union([z.literal(""), z.string(), z.boolean()])
    .optional()
    .transform((v) => {
      if (typeof v === "boolean") return v;
      const s = (v ?? "").toString().toLowerCase();
      return s === "yes" || s === "true" || s === "on" || s === "1";
    }),
  notes: optionalText,
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
