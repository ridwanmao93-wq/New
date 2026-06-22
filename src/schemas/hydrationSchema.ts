import { z } from "zod";
import { dateSchema, optionalText } from "./common";

const ML_PER_OZ = 29.5735;

const optionalNumber = z
  .union([z.literal(""), z.coerce.number().min(0)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

export const hydrationSchema = z
  .object({
    date: dateSchema,
    waterIntakeMl: optionalNumber,
    waterIntakeOz: optionalNumber,
    hydrationGoalMl: optionalNumber,
    source: z
      .enum(["Manual", "LARQ", "Apple Health"])
      .optional()
      .default("Manual"),
    notes: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.waterIntakeMl === undefined && data.waterIntakeOz === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide water intake in either ML or OZ.",
        path: ["waterIntakeMl"],
      });
    }
  })
  .transform((data) => {
    // Derive whichever unit is missing so both columns are always populated.
    let ml = data.waterIntakeMl;
    let oz = data.waterIntakeOz;
    if (ml === undefined && oz !== undefined) ml = Math.round(oz * ML_PER_OZ);
    if (oz === undefined && ml !== undefined) oz = Math.round((ml / ML_PER_OZ) * 10) / 10;

    const goalMl = data.hydrationGoalMl ?? 3000; // sensible default daily goal
    const goalPct =
      ml !== undefined && goalMl > 0 ? Math.round((ml / goalMl) * 1000) / 10 : undefined;

    return {
      ...data,
      waterIntakeMl: ml,
      waterIntakeOz: oz,
      hydrationGoalMl: goalMl,
      hydrationGoalPercentage: goalPct,
    };
  });

export type HydrationInput = z.infer<typeof hydrationSchema>;
