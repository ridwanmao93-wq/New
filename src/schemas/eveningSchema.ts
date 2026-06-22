import { z } from "zod";
import { dateSchema, scoreSchema, optionalText } from "./common";

export const eveningSchema = z.object({
  date: dateSchema,
  mood: scoreSchema,
  energy: scoreSchema,
  hopefulness: scoreSchema,
  whatWentWell: optionalText,
  actedWithValues: optionalText,
  keyEmotions: optionalText,
  trigger: optionalText,
  automaticThought: optionalText,
  cognitiveDistortion: optionalText,
  balancedPerspective: optionalText,
  gratitude1: optionalText,
  gratitude2: optionalText,
  gratitude3: optionalText,
  notes: optionalText,
});

export type EveningInput = z.infer<typeof eveningSchema>;
