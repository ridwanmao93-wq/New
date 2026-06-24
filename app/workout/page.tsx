import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countToday } from "@/lib/today-count";
import { buildProgress, formatSet, type ProgressEntry } from "@/lib/workouts";
import { PageHeader } from "@/components/page-header";
import { DoneTodayBanner } from "@/components/done-today-banner";
import { FormShell } from "@/components/forms/form-shell";
import { WorkoutLogger } from "@/components/forms/workout-logger";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveWorkout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const n = await countToday(supabase, user.id, "workouts");

  // Recent workouts → per-exercise progress.
  const { data: recent } = await supabase
    .from("workouts")
    .select("date, exercises_json")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(40);
  const progress = buildProgress(recent ?? []);
  const exerciseNames = Array.from(progress.keys());

  return (
    <div className="space-y-6">
      <PageHeader title="Log a Workout" subtitle="Pick Workout A or B, log your sets, and watch the weight climb." />
      {n > 0 ? (
        <DoneTodayBanner>
          You’ve logged {n} workout{n === 1 ? "" : "s"} today. You can add another.
        </DoneTodayBanner>
      ) : null}

      <FormShell action={saveWorkout} submitLabel="Save workout">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <DateField />
            <WorkoutLogger />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Duration (minutes)">
              <Input name="duration_minutes" type="number" min={0} />
            </Field>
            <ScoreField name="intensity_score" label="Intensity (1–10)" />
            <CheckboxField name="completed" label="Completed" defaultChecked />
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </CardContent>
        </Card>
      </FormShell>

      {/* ===== Weekly progress per exercise ===== */}
      {exerciseNames.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Progress — best set per session
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {exerciseNames.map((name) => {
              const entries = (progress.get(name) ?? []).slice(0, 6);
              const latest = entries[0]?.best ?? null;
              const prev = entries[1]?.best ?? null;
              const up =
                latest?.weight != null && prev?.weight != null ? latest.weight - prev.weight : null;
              return (
                <Card key={name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      {up != null ? (
                        <span className={up > 0 ? "text-emerald-400" : up < 0 ? "text-red-400" : "text-muted-foreground"}>
                          {up > 0 ? `▲ +${up}` : up < 0 ? `▼ ${up}` : "—"}
                        </span>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <tbody>
                        {entries.map((e: ProgressEntry) => (
                          <tr key={e.date} className="border-b border-border/40 last:border-0">
                            <td className="py-1 text-muted-foreground">{e.date}</td>
                            <td className="py-1 text-right font-medium">{formatSet(e.best)}</td>
                            <td className="py-1 pl-3 text-right text-xs text-muted-foreground">
                              {e.sets.length} set{e.sets.length === 1 ? "" : "s"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
