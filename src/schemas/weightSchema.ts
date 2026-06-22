import { z } from "zod";
import { dateSchema, optionalText } from "./common";

export const weightSchema = z.object({
  date: dateSchema,
  weight: z.coerce
    .number({ invalid_type_error: "Weight must be a number" })
    .positive("Weight must be greater than 0"),
  waist: z
    .union([z.literal(""), z.coerce.number().positive()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  progressPhotoUrl: optionalText,
  notes: optionalText,
});

export type WeightInput = z.infer<typeof weightSchema>;
