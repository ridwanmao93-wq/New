"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  morningSchema,
  eveningSchema,
  workoutSchema,
  weightSchema,
  hydrationSchema,
  weeklyReviewNotesSchema,
  alignmentSchema,
  sobrietySchema,
  debtSchema,
  momentumSchema,
  antiAvoidanceSchema,
  relationshipSchema,
  futureSelfGoalSchema,
} from "@/lib/validation/schemas";
import { generateWeeklyReview } from "@/lib/analytics/weekly-review";

/** Shape returned by every form action (consumed by useFormState). */
export type ActionState = { ok: boolean; error?: string; message?: string };

const formObject = (formData: FormData) => Object.fromEntries(formData.entries());

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

function zodMessage(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(" · ");
}

/**
 * Generic insert/upsert helper. `conflict` enables upsert-by-date for
 * tables with a unique (user_id, date) constraint.
 */
async function save(
  table: string,
  fields: Record<string, unknown>,
  opts: { conflict?: string; revalidate?: string[] } = {}
): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const row = { ...fields, user_id: userId };
    const query = opts.conflict
      ? supabase.from(table).upsert(row, { onConflict: opts.conflict })
      : supabase.from(table).insert(row);
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    for (const path of opts.revalidate ?? ["/dashboard"]) revalidatePath(path);
    return { ok: true, message: "Saved." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/* ------------------------------ CBT ------------------------------ */

export async function saveMorning(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formObject(formData);
  // sentence stems arrive as a JSON string from the client component.
  let stems: unknown = [];
  try {
    stems = JSON.parse((raw.sentence_stems as string) || "[]");
  } catch {
    return { ok: false, error: "Sentence stems were malformed." };
  }
  const parsed = morningSchema.safeParse({ ...raw, sentence_stems: stems });
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  return save("cbt_morning_entries", {
    date: d.date,
    mood_score: d.mood_score,
    energy_score: d.energy_score,
    hopefulness_score: d.hopefulness_score,
    centering_completed: d.centering_completed,
    sentence_stems_json: d.sentence_stems,
    identity_action_statement: d.identity_action_statement,
    fully_accepted_success_response: d.fully_accepted_success_response,
    no_longer_needed_to_suffer_response: d.no_longer_needed_to_suffer_response,
    identity_releasing: d.identity_releasing,
    identity_stepping_into: d.identity_stepping_into,
    affirmation_completed: d.affirmation_completed,
    notes: d.notes,
  });
}

export async function saveEvening(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = eveningSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("cbt_evening_entries", parsed.data);
}

/* --------------------------- Tracking ---------------------------- */

export async function saveWorkout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = workoutSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  return save("workouts", {
    date: d.date,
    workout_type: d.workout_type,
    duration_minutes: d.duration_minutes,
    exercises_json: d.exercises ? { raw: d.exercises } : null,
    intensity_score: d.intensity_score,
    completed: d.completed,
    notes: d.notes,
  });
}

export async function saveWeight(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = weightSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("weight_entries", parsed.data);
}

export async function saveHydration(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = hydrationSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("hydration_entries", parsed.data);
}

/* --------------------------- Life OS ----------------------------- */

export async function saveAlignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = alignmentSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("daily_alignment_entries", parsed.data, { conflict: "user_id,date" });
}

export async function saveSobriety(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = sobrietySchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("sobriety_entries", parsed.data, { conflict: "user_id,date" });
}

export async function saveDebt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = debtSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("debt_entries", parsed.data, { revalidate: ["/dashboard", "/future-self"] });
}

export async function saveMomentum(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = momentumSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("daily_momentum_entries", parsed.data, { conflict: "user_id,date" });
}

export async function saveAntiAvoidance(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = antiAvoidanceSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("anti_avoidance_entries", parsed.data, { conflict: "user_id,date" });
}

export async function saveRelationship(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = relationshipSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("relationship_entries", parsed.data);
}

export async function saveFutureSelfGoal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = futureSelfGoalSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("future_self_goals", parsed.data, { revalidate: ["/future-self", "/dashboard"] });
}

/* ----------------------------- Profile --------------------------- */

export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const raw = formObject(formData);
    const row = {
      id: userId,
      full_name: (raw.full_name as string)?.trim() || null,
      hydration_goal_ml: raw.hydration_goal_ml ? Number(raw.hydration_goal_ml) : 3000,
      weight_goal_lbs: raw.weight_goal_lbs ? Number(raw.weight_goal_lbs) : null,
      weight_unit: (raw.weight_unit as string) || "lbs",
    };
    const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, message: "Profile saved." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/* ----------------------- Weekly review --------------------------- */

export async function runWeeklyReview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const notes = weeklyReviewNotesSchema.safeParse(formObject(formData));
  try {
    const { supabase, userId } = await requireUser();
    await generateWeeklyReview(supabase, userId, notes.success ? notes.data : {});
    revalidatePath("/weekly-review");
    return { ok: true, message: "Weekly review generated." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate review" };
  }
}

/* ------------------- Combined daily check-in --------------------- */

/**
 * One submit that fans out into morning CBT + alignment + sobriety +
 * momentum + anti-avoidance for the day. Used by /daily-check-in.
 */
export async function saveDailyCheckIn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const results = await Promise.all([
    saveMorning(_prev, formData),
    saveAlignment(_prev, formData),
    saveSobriety(_prev, formData),
    saveMomentum(_prev, formData),
    saveAntiAvoidance(_prev, formData),
  ]);
  const failed = results.find((r) => !r.ok);
  if (failed) return failed;
  revalidatePath("/dashboard");
  return { ok: true, message: "Morning check-in saved. Go make it a great day." };
}

/**
 * Evening shutdown: evening CBT + sobriety + momentum review +
 * anti-avoidance review.
 */
export async function saveEveningShutdown(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const results = await Promise.all([
    saveEvening(_prev, formData),
    saveSobriety(_prev, formData),
    saveMomentum(_prev, formData),
    saveAntiAvoidance(_prev, formData),
  ]);
  const failed = results.find((r) => !r.ok);
  if (failed) return failed;
  revalidatePath("/dashboard");
  return { ok: true, message: "Evening shutdown complete. Rest well." };
}
