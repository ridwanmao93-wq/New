/**
 * Workout program templates and helpers for structured set/weight
 * logging and weekly progress tracking.
 */

export interface TemplateExercise {
  name: string;
  sets: number;
  reps: string; // e.g. "4-6"
}

export const WORKOUT_TEMPLATES: Record<"A" | "B", { name: string; exercises: TemplateExercise[] }> = {
  A: {
    name: "Workout A",
    exercises: [
      { name: "Incline Dumbbell Bench Press", sets: 3, reps: "4-6" },
      { name: "Close Grip Barbell Bench Press", sets: 2, reps: "4-6" },
      { name: "Weighted Chin Ups", sets: 3, reps: "3-5" },
      { name: "Bent Over Flyes", sets: 2, reps: "6-10" },
      { name: "Standing Barbell Curls", sets: 2, reps: "4-6" },
    ],
  },
  B: {
    name: "Workout B",
    exercises: [
      { name: "Seated DB Shoulder Press", sets: 3, reps: "4-6" },
      { name: "Weighted Bar Dips", sets: 2, reps: "6-8" },
      { name: "Weighted Chin Ups", sets: 3, reps: "4-6" },
      { name: "Lateral Raises", sets: 3, reps: "6-10" },
      { name: "Standing Dumbbell Curls", sets: 2, reps: "4-6" },
    ],
  },
};

export interface LoggedSet {
  weight?: number;
  reps?: number;
}
export interface LoggedExercise {
  name: string;
  target?: string;
  sets: LoggedSet[];
}
export interface WorkoutData {
  template?: string;
  exercises: LoggedExercise[];
}

/** Parse a workout row's exercises_json into structured data (handles legacy {raw}). */
export function parseExercises(json: any): WorkoutData | null {
  if (!json || typeof json !== "object") return null;
  if (Array.isArray(json.exercises)) return json as WorkoutData;
  return null; // legacy free-text {raw} — no structured data
}

/** The best (heaviest) set of an exercise in a session. */
export function topSet(ex: LoggedExercise): LoggedSet | null {
  let best: LoggedSet | null = null;
  for (const s of ex.sets) {
    if (typeof s.weight !== "number") continue;
    if (!best || (best.weight ?? 0) < s.weight) best = s;
  }
  return best;
}

export interface ProgressEntry {
  date: string;
  best: LoggedSet | null;
  sets: LoggedSet[];
}

/**
 * Build per-exercise history from a list of workout rows (newest first
 * within each exercise), so you can see weight progressing week to week.
 */
export function buildProgress(
  workouts: { date: string; exercises_json: any }[]
): Map<string, ProgressEntry[]> {
  const byExercise = new Map<string, ProgressEntry[]>();
  for (const w of workouts) {
    const data = parseExercises(w.exercises_json);
    if (!data) continue;
    for (const ex of data.exercises) {
      const sets = (ex.sets ?? []).filter((s) => s.weight != null || s.reps != null);
      if (sets.length === 0) continue;
      const list = byExercise.get(ex.name) ?? [];
      list.push({ date: String(w.date), best: topSet(ex), sets });
      byExercise.set(ex.name, list);
    }
  }
  // newest first
  for (const list of byExercise.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return byExercise;
}

export function formatSet(s: LoggedSet | null): string {
  if (!s) return "—";
  const w = s.weight != null ? `${s.weight}` : "?";
  const r = s.reps != null ? `${s.reps}` : "?";
  return `${w} × ${r}`;
}
