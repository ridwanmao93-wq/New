import { z } from "zod";
import { today } from "@/lib/dates";

/** A 1–10 integer score. Coerces numeric strings from form posts. */
export const scoreSchema = z.coerce
  .number({ invalid_type_error: "Must be a number" })
  .int("Must be a whole number")
  .min(1, "Must be at least 1")
  .max(10, "Must be at most 10");

/** Optional 1–10 score — blank is allowed (nothing is mandatory). */
export const optionalScore = z
  .union([z.literal(""), scoreSchema])
  .optional()
  .transform((v) => (v === "" ? undefined : v));

/** ISO date, defaulting to today when blank/missing. */
export const dateSchema = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")])
  .optional()
  .transform((v) => (v && v !== "" ? v : today()));

const optionalText = z
  .string()
  .optional()
  .transform((v) => {
    const t = (v ?? "").trim();
    return t === "" ? undefined : t;
  });

const optionalPositive = z
  .union([z.literal(""), z.coerce.number().positive()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/* ------------------------------------------------------------------ */
/* Morning practice                                                    */
/* ------------------------------------------------------------------ */

/** A single sentence-completion stem with up to 10 short responses (optional). */
export const sentenceStemSchema = z.object({
  stem: z.string().min(1, "Stem is required"),
  responses: z.array(z.string().min(1)).max(10, "Each stem allows at most 10 responses"),
});

export const morningSchema = z.object({
  date: dateSchema,
  mood_score: optionalScore,
  energy_score: optionalScore,
  hopefulness_score: optionalScore,
  centering_completed: z.coerce.boolean().optional().default(false),
  // Sentence completion is entirely optional.
  sentence_stems: z.array(sentenceStemSchema).max(3, "Choose at most 3 sentence stems").optional().default([]),
  identity_action_statement: optionalText,
  fully_accepted_success_response: optionalText,
  no_longer_needed_to_suffer_response: optionalText,
  identity_releasing: optionalText,
  identity_stepping_into: optionalText,
  affirmation_completed: z.coerce.boolean().optional().default(false),
  notes: optionalText,
});
export type MorningInput = z.infer<typeof morningSchema>;

/* ------------------------------------------------------------------ */
/* Evening practice                                                    */
/* ------------------------------------------------------------------ */

export const eveningSchema = z.object({
  date: dateSchema,
  mood_score: optionalScore,
  energy_score: optionalScore,
  hopefulness_score: optionalScore,
  reflection_notes: optionalText,
  gratitude: optionalText,
  surrender_statement: optionalText,
  completed: z.coerce.boolean().optional().default(true),
});
export type EveningInput = z.infer<typeof eveningSchema>;

/* ------------------------------------------------------------------ */
/* Workout                                                             */
/* ------------------------------------------------------------------ */

export const workoutSchema = z.object({
  date: dateSchema,
  workout_type: optionalText,
  duration_minutes: z
    .union([z.literal(""), z.coerce.number().min(0)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  exercises: optionalText, // free-form: "Bench 3x5 @ 135; Squat 3x5 @ 185"
  intensity_score: z
    .union([z.literal(""), scoreSchema])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  completed: z.coerce.boolean().optional().default(true),
  notes: optionalText,
});
export type WorkoutInput = z.infer<typeof workoutSchema>;

/* ------------------------------------------------------------------ */
/* Weight                                                              */
/* ------------------------------------------------------------------ */

export const weightSchema = z.object({
  date: dateSchema,
  weight_lbs: z.coerce.number({ invalid_type_error: "Weight is required" }).positive("Weight must be positive"),
  waist_measurement: optionalPositive,
  progress_photo_url: optionalText,
  notes: optionalText,
});
export type WeightInput = z.infer<typeof weightSchema>;

/* ------------------------------------------------------------------ */
/* Hydration                                                           */
/* ------------------------------------------------------------------ */

const ML_PER_OZ = 29.5735;

export const hydrationSchema = z
  .object({
    date: dateSchema,
    water_intake_ml: z
      .union([z.literal(""), z.coerce.number().positive("Must be positive")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? undefined : v)),
    water_intake_oz: z
      .union([z.literal(""), z.coerce.number().positive("Must be positive")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? undefined : v)),
    hydration_goal_ml: z
      .union([z.literal(""), z.coerce.number().positive()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? 3000 : v)),
    source: z.enum(["Manual", "LARQ", "Apple Health"]).optional().default("Manual"),
    notes: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.water_intake_ml === undefined && data.water_intake_oz === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter water intake in ML or OZ.",
        path: ["water_intake_ml"],
      });
    }
  })
  .transform((data) => {
    let ml = data.water_intake_ml;
    let oz = data.water_intake_oz;
    if (ml === undefined && oz !== undefined) ml = Math.round(oz * ML_PER_OZ);
    if (oz === undefined && ml !== undefined) oz = Math.round((ml / ML_PER_OZ) * 10) / 10;
    const goal = data.hydration_goal_ml ?? 3000;
    const pct = ml !== undefined && goal > 0 ? Math.round((ml / goal) * 1000) / 10 : undefined;
    return {
      ...data,
      water_intake_ml: ml,
      water_intake_oz: oz,
      hydration_goal_ml: goal,
      hydration_goal_percentage: pct,
    };
  });
export type HydrationInput = z.infer<typeof hydrationSchema>;

/* ------------------------------------------------------------------ */
/* Weekly review (free-form fields only; metrics are computed)         */
/* ------------------------------------------------------------------ */

export const weeklyReviewNotesSchema = z.object({
  reflection_notes: optionalText,
  intentions_for_next_week: optionalText,
});
export type WeeklyReviewNotesInput = z.infer<typeof weeklyReviewNotesSchema>;

/* ================================================================== */
/* LIFE OPERATING SYSTEM                                               */
/* ================================================================== */

const bool = z.coerce.boolean().optional().default(false);

/** Daily alignment — score is the average of the four sub-scores. */
export const alignmentSchema = z
  .object({
    date: dateSchema,
    followed_values_score: scoreSchema,
    avoided_something_important_score: scoreSchema,
    acted_courageously_score: scoreSchema,
    kept_promises_score: scoreSchema,
    notes: optionalText,
  })
  .transform((d) => ({
    ...d,
    daily_alignment_score:
      Math.round(
        ((d.followed_values_score +
          d.avoided_something_important_score +
          d.acted_courageously_score +
          d.kept_promises_score) /
          4) *
          100
      ) / 100,
  }));
export type AlignmentInput = z.infer<typeof alignmentSchema>;

export const sobrietySchema = z.object({
  date: dateSchema,
  cannabis_used: bool,
  craving_score: z
    .union([z.literal(""), scoreSchema])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  trigger: optionalText,
  response_to_trigger: optionalText,
  notes: optionalText,
});
export type SobrietyInput = z.infer<typeof sobrietySchema>;

export const debtSchema = z.object({
  date: dateSchema,
  total_debt_remaining: optionalPositive,
  debt_paid_this_month: optionalPositive,
  savings_balance: optionalPositive,
  emergency_fund_balance: optionalPositive,
  notes: optionalText,
});
export type DebtInput = z.infer<typeof debtSchema>;

/** Momentum — score is the % of the eight items completed. */
export const momentumSchema = z
  .object({
    date: dateSchema,
    morning_cbt_completed: bool,
    evening_cbt_completed: bool,
    workout_completed: bool,
    hydration_goal_hit: bool,
    no_cannabis: bool,
    family_connection_completed: bool,
    business_growth_action_completed: bool,
    hardest_thing_done: bool,
    most_important_action: optionalText,
    notes: optionalText,
  })
  .transform((d) => {
    const items = [
      d.morning_cbt_completed,
      d.evening_cbt_completed,
      d.workout_completed,
      d.hydration_goal_hit,
      d.no_cannabis,
      d.family_connection_completed,
      d.business_growth_action_completed,
      d.hardest_thing_done,
    ];
    const done = items.filter(Boolean).length;
    return { ...d, momentum_score: Math.round((done / items.length) * 100) };
  });
export type MomentumInput = z.infer<typeof momentumSchema>;

export const antiAvoidanceSchema = z.object({
  date: dateSchema,
  hardest_thing_i_did_not_want_to_do: optionalText,
  did_i_do_it: bool,
  avoidance_trigger: optionalText,
  what_helped_me_take_action: optionalText,
  notes: optionalText,
});
export type AntiAvoidanceInput = z.infer<typeof antiAvoidanceSchema>;

export const relationshipSchema = z.object({
  date: dateSchema,
  person: z.string().min(1, "Choose a person"),
  connection_type: optionalText,
  completed: z.coerce.boolean().optional().default(true),
  notes: optionalText,
});
export type RelationshipInput = z.infer<typeof relationshipSchema>;

export const futureSelfGoalSchema = z.object({
  category: z.string().min(1, "Category is required"),
  goal_name: z.string().min(1, "Goal name is required"),
  target_value: optionalPositive,
  current_value: z
    .union([z.literal(""), z.coerce.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  target_date: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  why_it_matters: optionalText,
});
export type FutureSelfGoalInput = z.infer<typeof futureSelfGoalSchema>;

export const RELATIONSHIP_PEOPLE = ["Wife", "Hoyo", "Abo", "Ayeeyo", "Colleen", "Friends"] as const;
export const FUTURE_SELF_CATEGORIES = [
  "Health",
  "Sobriety",
  "Marriage",
  "Family",
  "Money",
  "Business",
  "Faith/Values",
  "Personal Growth",
] as const;
