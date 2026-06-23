import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countToday } from "@/lib/today-count";
import { PageHeader } from "@/components/page-header";
import { DoneTodayBanner } from "@/components/done-today-banner";
import { FormShell } from "@/components/forms/form-shell";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveWorkout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const n = await countToday(supabase, user.id, "workouts");

  return (
    <div>
      <PageHeader title="Log a Workout" subtitle="Track training type, intensity and consistency." />
      {n > 0 ? (
        <DoneTodayBanner>
          You’ve logged {n} workout{n === 1 ? "" : "s"} today. You can add another.
        </DoneTodayBanner>
      ) : null}
      <FormShell action={saveWorkout} submitLabel="Save workout">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <DateField />
            <Field label="Workout type">
              <Input name="workout_type" placeholder="Strength, Run, Yoga…" />
            </Field>
            <Field label="Duration (minutes)">
              <Input name="duration_minutes" type="number" min={0} />
            </Field>
            <Field label="Exercises / Sets / Reps / Weight">
              <Textarea name="exercises" placeholder="Bench 3x5 @135; Squat 3x5 @185…" />
            </Field>
            <ScoreField name="intensity_score" label="Intensity (1–10)" />
            <CheckboxField name="completed" label="Completed" defaultChecked />
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </CardContent>
        </Card>
      </FormShell>
    </div>
  );
}
