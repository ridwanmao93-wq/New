"use client";

import { useState } from "react";
import { WORKOUT_TEMPLATES } from "@/lib/workouts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SetRow = { weight: string; reps: string };
type Ex = { name: string; target: string; sets: SetRow[] };
type TemplateKey = "A" | "B" | "Custom";

function fromTemplate(key: "A" | "B"): Ex[] {
  return WORKOUT_TEMPLATES[key].exercises.map((e) => ({
    name: e.name,
    target: `${e.sets} × ${e.reps} reps`,
    sets: Array.from({ length: e.sets }, () => ({ weight: "", reps: "" })),
  }));
}

/**
 * Structured workout logger. Pick Workout A / B (pre-loaded with your
 * exercises) or Custom, then log weight × reps for each set. Emits a
 * hidden `exercises_data` JSON field + `workout_type` for the form.
 */
export function WorkoutLogger() {
  const [template, setTemplate] = useState<TemplateKey>("A");
  const [exercises, setExercises] = useState<Ex[]>(() => fromTemplate("A"));

  function choose(t: TemplateKey) {
    setTemplate(t);
    if (t === "Custom") setExercises([{ name: "", target: "", sets: [{ weight: "", reps: "" }] }]);
    else setExercises(fromTemplate(t));
  }

  function update(fn: (next: Ex[]) => void) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      fn(next);
      return next;
    });
  }

  const setVal = (ei: number, si: number, key: keyof SetRow, v: string) =>
    update((n) => {
      n[ei].sets[si][key] = v;
    });
  const addSet = (ei: number) => update((n) => n[ei].sets.push({ weight: "", reps: "" }));
  const removeSet = (ei: number) =>
    update((n) => {
      if (n[ei].sets.length > 1) n[ei].sets.pop();
    });
  const setName = (ei: number, v: string) => update((n) => (n[ei].name = v));
  const addExercise = () =>
    update((n) => n.push({ name: "", target: "", sets: [{ weight: "", reps: "" }] }));
  const removeExercise = (ei: number) => update((n) => n.splice(ei, 1));

  const workoutType = template === "Custom" ? "Custom" : WORKOUT_TEMPLATES[template].name;
  const payload = JSON.stringify({
    template: workoutType,
    exercises: exercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        target: e.target || undefined,
        sets: e.sets
          .map((s) => ({
            weight: s.weight === "" ? undefined : Number(s.weight),
            reps: s.reps === "" ? undefined : Number(s.reps),
          }))
          .filter((s) => s.weight !== undefined || s.reps !== undefined),
      })),
  });

  const TEMPLATES: TemplateKey[] = ["A", "B", "Custom"];

  return (
    <div className="space-y-4">
      <input type="hidden" name="exercises_data" value={payload} />
      <input type="hidden" name="workout_type" value={workoutType} />

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => choose(t)}
            className={
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
              (template === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-input text-muted-foreground hover:bg-accent")
            }
          >
            {t === "Custom" ? "Custom" : WORKOUT_TEMPLATES[t].name}
          </button>
        ))}
      </div>

      {exercises.map((ex, ei) => (
        <Card key={ei}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-2">
            {template === "Custom" ? (
              <Input
                value={ex.name}
                placeholder="Exercise name"
                onChange={(e) => setName(ei, e.target.value)}
                className="max-w-xs"
              />
            ) : (
              <div>
                <div className="font-semibold">{ex.name}</div>
                <div className="text-xs text-muted-foreground">Target: {ex.target}</div>
              </div>
            )}
            {template === "Custom" ? (
              <button
                type="button"
                onClick={() => removeExercise(ei)}
                className="text-xs text-muted-foreground hover:text-red-400"
              >
                Remove
              </button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {ex.sets.map((s, si) => (
              <div key={si} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">Set {si + 1}</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="weight"
                  value={s.weight}
                  onChange={(e) => setVal(ei, si, "weight", e.target.value)}
                />
                <span className="text-xs text-muted-foreground">×</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="reps"
                  value={s.reps}
                  onChange={(e) => setVal(ei, si, "reps", e.target.value)}
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={() => addSet(ei)}>
                + Set
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeSet(ei)} disabled={ex.sets.length <= 1}>
                − Set
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {template === "Custom" ? (
        <Button type="button" variant="outline" onClick={addExercise}>
          + Add exercise
        </Button>
      ) : null}
    </div>
  );
}
