import { z } from "zod";
import { dateSchema, scoreSchema, optionalText } from "./common";

export const morningSchema = z.object({
  date: dateSchema,
  mood: scoreSchema,
  energy: scoreSchema,
  hopefulness: scoreSchema,
  stem1: optionalText,
  answers1: optionalText,
  stem2: optionalText,
  answers2: optionalText,
  actLike: optionalText,
  valuesAction: optionalText,
  smallGoal: optionalText,
  notes: optionalText,
});

export type MorningInput = z.infer<typeof morningSchema>;
