import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { FormShell } from "@/components/forms/form-shell";
import { Field, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runWeeklyReview } from "@/lib/actions";
import { previousSevenDays } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false })
    .limit(1);
  const r = reviews?.[0];
  const { start, end } = previousSevenDays();

  return (
    <div className="space-y-8">
      <PageHeader title="Weekly Review" subtitle={`Next review window: ${start} → ${end}`} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Generate this week’s review</CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={runWeeklyReview} submitLabel="Generate Weekly Review" resetOnSuccess={false}>
            <Field label="Reflection notes">
              <Textarea name="reflection_notes" />
            </Field>
            <Field label="Intentions for next week">
              <Textarea name="intentions_for_next_week" />
            </Field>
          </FormShell>
        </CardContent>
      </Card>

      {r ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest review · {r.week_start_date} → {r.week_end_date}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Avg mood" value={r.avg_mood} />
            <StatCard label="Avg energy" value={r.avg_energy} />
            <StatCard label="Avg hopefulness" value={r.avg_hopefulness} />
            <StatCard label="Avg sleep" value={r.avg_sleep_score} />
            <StatCard label="Avg readiness" value={r.avg_readiness_score} />
            <StatCard label="Avg HRV" value={r.avg_hrv} />
            <StatCard label="Avg resting HR" value={r.avg_resting_heart_rate} />
            <StatCard label="Avg weight" value={r.avg_weight} suffix=" lb" />
            <StatCard label="Workouts" value={r.workouts_completed} />
            <StatCard label="Hydration avg" value={r.avg_hydration_percentage} suffix="%" />
            <StatCard label="Morning %" value={r.morning_completion_percentage} suffix="%" />
            <StatCard label="Evening %" value={r.evening_completion_percentage} suffix="%" />
            <StatCard label="Current streak" value={r.current_streak} suffix=" d" />
            <StatCard label="Longest streak" value={r.longest_streak} suffix=" d" />
          </div>
          {(r.reflection_notes || r.intentions_for_next_week) && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {r.reflection_notes ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Reflection</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {r.reflection_notes}
                  </CardContent>
                </Card>
              ) : null}
              {r.intentions_for_next_week ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Intentions for next week</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {r.intentions_for_next_week}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No reviews yet. Generate your first one above.
        </p>
      )}
    </div>
  );
}
