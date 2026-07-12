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
  visionItemSchema,
  focusSchema,
  meditationSchema,
  brainDumpSchema,
} from "@/lib/validation/schemas";
import { generateWeeklyReview } from "@/lib/analytics/weekly-review";
import { momentumScore } from "@/lib/momentum";

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

/**
 * Morning routine — one submit that saves the morning CBT practice plus
 * the momentum checklist (with "most important action") and the
 * anti-avoidance plan (the hardest thing + triggers). Nothing is
 * mandatory; empty sections are simply skipped.
 */
export async function saveMorning(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formObject(formData);

  // Sentence stems arrive as a JSON string from the client component.
  let stems: unknown = [];
  try {
    stems = JSON.parse((raw.sentence_stems as string) || "[]");
  } catch {
    return { ok: false, error: "Sentence stems were malformed." };
  }
  const cbt = morningSchema.safeParse({ ...raw, sentence_stems: stems });
  if (!cbt.success) return { ok: false, error: zodMessage(cbt.error) };
  const m = cbt.data;

  const mom = momentumSchema.safeParse(raw);
  const aa = antiAvoidanceSchema.safeParse(raw);

  try {
    const { supabase, userId } = await requireUser();

    const cbtRes = await supabase.from("cbt_morning_entries").insert({
      user_id: userId,
      date: m.date,
      mood_score: m.mood_score,
      energy_score: m.energy_score,
      hopefulness_score: m.hopefulness_score,
      centering_completed: m.centering_completed,
      sentence_stems_json: m.sentence_stems,
      identity_action_statement: m.identity_action_statement,
      fully_accepted_success_response: m.fully_accepted_success_response,
      no_longer_needed_to_suffer_response: m.no_longer_needed_to_suffer_response,
      identity_releasing: m.identity_releasing,
      identity_stepping_into: m.identity_stepping_into,
      affirmation_completed: m.affirmation_completed,
      notes: m.notes,
    });
    if (cbtRes.error) return { ok: false, error: cbtRes.error.message };

    // Momentum (commit to today's items + most important action).
    if (mom.success) {
      const d = mom.data;
      const momRes = await supabase.from("daily_momentum_entries").upsert(
        {
          user_id: userId,
          date: d.date,
          morning_cbt_completed: d.morning_cbt_completed,
          evening_cbt_completed: d.evening_cbt_completed,
          workout_completed: d.workout_completed,
          hydration_goal_hit: d.hydration_goal_hit,
          no_cannabis: d.no_cannabis,
          family_connection_completed: d.family_connection_completed,
          business_growth_action_completed: d.business_growth_action_completed,
          hardest_thing_done: d.hardest_thing_done,
          meditation_completed: d.meditation_completed,
          most_important_action: d.most_important_action,
          momentum_score: d.momentum_score,
        },
        { onConflict: "user_id,date" }
      );
      if (momRes.error) return { ok: false, error: momRes.error.message };
    }

    // Anti-avoidance plan (only when there's a hardest thing to face).
    if (aa.success && aa.data.hardest_thing_i_did_not_want_to_do) {
      const a = aa.data;
      const aaRes = await supabase.from("anti_avoidance_entries").upsert(
        {
          user_id: userId,
          date: a.date,
          hardest_thing_i_did_not_want_to_do: a.hardest_thing_i_did_not_want_to_do,
          avoidance_trigger: a.avoidance_trigger,
          what_helped_me_take_action: a.what_helped_me_take_action,
        },
        { onConflict: "user_id,date" }
      );
      if (aaRes.error) return { ok: false, error: aaRes.error.message };
    }

    revalidatePath("/dashboard");
    return { ok: true, message: "Morning routine saved. Go make it a great day." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/**
 * Evening routine — saves the evening reflection plus a sobriety check
 * and the anti-avoidance review (did I do the hard thing from this
 * morning, and why / why not). Nothing is mandatory.
 */
export async function saveEvening(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formObject(formData);
  const ev = eveningSchema.safeParse(raw);
  if (!ev.success) return { ok: false, error: zodMessage(ev.error) };

  const sob = sobrietySchema.safeParse(raw);

  try {
    const { supabase, userId } = await requireUser();

    const evRes = await supabase.from("cbt_evening_entries").insert({ ...ev.data, user_id: userId });
    if (evRes.error) return { ok: false, error: evRes.error.message };

    if (sob.success) {
      const sobRes = await supabase
        .from("sobriety_entries")
        .upsert({ ...sob.data, user_id: userId }, { onConflict: "user_id,date" });
      if (sobRes.error) return { ok: false, error: sobRes.error.message };
    }

    // Anti-avoidance review — update today's row (hardest thing carried
    // over from the morning), recording whether it got done and why.
    const hardest = (raw.hardest_thing_i_did_not_want_to_do as string)?.trim();
    const why = (raw.why_or_why_not as string)?.trim();
    const didItRaw = (raw.did_i_do_it as string) ?? "";
    const didIt = ["true", "on", "1", "yes"].includes(didItRaw.toLowerCase());
    if (hardest || why || didIt) {
      const aaRes = await supabase.from("anti_avoidance_entries").upsert(
        {
          user_id: userId,
          date: ev.data.date,
          hardest_thing_i_did_not_want_to_do: hardest || undefined,
          did_i_do_it: didIt,
          notes: why || undefined,
        },
        { onConflict: "user_id,date" }
      );
      if (aaRes.error) return { ok: false, error: aaRes.error.message };
    }

    revalidatePath("/dashboard");
    return { ok: true, message: "Evening saved. Rest well." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/* --------------------------- Tracking ---------------------------- */

export async function saveWorkout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = workoutSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  // Prefer structured set/weight data; fall back to free text.
  let exercisesJson: unknown = d.exercises ? { raw: d.exercises } : null;
  if (d.exercises_data) {
    try {
      const parsedData = JSON.parse(d.exercises_data);
      if (parsedData && Array.isArray(parsedData.exercises) && parsedData.exercises.length > 0) {
        exercisesJson = parsedData;
      }
    } catch {
      /* keep fallback */
    }
  }
  return save("workouts", {
    date: d.date,
    workout_type: d.workout_type,
    duration_minutes: d.duration_minutes,
    exercises_json: exercisesJson,
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

// Note: the morning and evening routines are now single combined actions
// (saveMorning / saveEvening above). The separate /daily-check-in and
// /evening-shutdown pages were removed in favour of the Morning and
// Evening tabs.

/* --------------------------- Vision board ------------------------ */

export async function saveVisionItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = visionItemSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("vision_board_items", parsed.data, {
    revalidate: ["/vision-board", "/dashboard", "/morning"],
  });
}

export async function deleteVisionItem(id: string): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("vision_board_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/vision-board");
    revalidatePath("/dashboard");
    return { ok: true, message: "Removed." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/* --------------------------- Brain dump -------------------------- */

export async function saveBrainDump(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = brainDumpSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("brain_dumps", parsed.data, { revalidate: ["/brain-dump"] });
}

export async function deleteBrainDump(id: string): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("brain_dumps").delete().eq("id", id).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/brain-dump");
    return { ok: true, message: "Deleted." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/* ----------------------------- Focus ----------------------------- */

export async function saveFocus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = focusSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("focus_sessions", parsed.data, { revalidate: ["/focus", "/dashboard"] });
}

/* --------------------------- Meditation -------------------------- */

export async function saveMeditation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = meditationSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  return save("meditation_sessions", parsed.data, { revalidate: ["/meditation", "/dashboard"] });
}

/* ----------------- Today card quick toggles ---------------------- */

export interface MomentumItems {
  morning_cbt_completed: boolean;
  evening_cbt_completed: boolean;
  workout_completed: boolean;
  hydration_goal_hit: boolean;
  no_cannabis: boolean;
  family_connection_completed: boolean;
  business_growth_action_completed: boolean;
  hardest_thing_done: boolean;
  meditation_completed: boolean;
}

/** Tick momentum items straight from the dashboard; recomputes the score. */
export async function updateMomentumToday(
  date: string,
  items: MomentumItems,
  mostImportant?: string
): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const score = momentumScore(items);
    const { error } = await supabase.from("daily_momentum_entries").upsert(
      {
        user_id: userId,
        date,
        ...items,
        most_important_action: mostImportant || undefined,
        momentum_score: score,
      },
      { onConflict: "user_id,date" }
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, message: "Updated." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/** Toggle "did I do the hard thing" for the day from the dashboard. */
export async function setHardThingDone(date: string, didIt: boolean): Promise<ActionState> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("anti_avoidance_entries")
      .upsert({ user_id: userId, date, did_i_do_it: didIt }, { onConflict: "user_id,date" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, message: "Updated." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
