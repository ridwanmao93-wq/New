import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/dashboard/stat-card";
import { FormShell } from "@/components/forms/form-shell";
import { Field, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveFutureSelfGoal } from "@/lib/actions";
import { FUTURE_SELF_CATEGORIES } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

type Goal = Record<string, any>;

function percent(goal: Goal): number {
  const t = Number(goal.target_value);
  const c = Number(goal.current_value);
  if (!Number.isFinite(t) || t === 0 || !Number.isFinite(c)) return 0;
  return Math.max(0, Math.min(100, (c / t) * 100));
}

export default async function FutureSelfPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goalsData } = await supabase
    .from("future_self_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const goals = (goalsData ?? []) as Goal[];

  const statement = goals.find((g) => /future self|12.?month/i.test(g.goal_name ?? ""));

  return (
    <div className="space-y-8">
      <PageHeader title="Future Self" subtitle="Who you are becoming over the next 12 months." />

      {/* 12-month statement */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">12-Month Future Self Statement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {statement?.why_it_matters ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed">{statement.why_it_matters}</p>
          ) : (
            <p className="text-muted-foreground">
              Add a goal named “12-Month Future Self Statement” below and write your statement in
              “Why it matters”.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Goal progress bars */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Goals & progress
        </h2>
        {goals.length ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              {goals.map((g) => (
                <div key={g.id}>
                  <ProgressBar
                    label={`${g.category ? `${g.category} · ` : ""}${g.goal_name}`}
                    percent={percent(g)}
                    caption={
                      g.target_value != null
                        ? `${g.current_value ?? 0} / ${g.target_value}${g.target_date ? ` by ${g.target_date}` : ""}`
                        : g.target_date
                          ? `by ${g.target_date}`
                          : "—"
                    }
                  />
                  {g.why_it_matters ? (
                    <p className="mt-1 text-xs text-muted-foreground">{g.why_it_matters}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No goals yet. Add your first below.</p>
        )}
      </section>

      {/* Add goal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add / update a goal</CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={saveFutureSelfGoal} submitLabel="Add goal">
            <Field label="Category">
              <select name="category" defaultValue="Health">
                {FUTURE_SELF_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Goal name *">
              <Input name="goal_name" required placeholder="Debt-free, 180 lbs, $20k saved…" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current value">
                <Input name="current_value" type="number" step="any" />
              </Field>
              <Field label="Target value">
                <Input name="target_value" type="number" step="any" min={0} />
              </Field>
            </div>
            <Field label="Target date">
              <Input name="target_date" type="date" />
            </Field>
            <Field label="Why it matters">
              <Textarea name="why_it_matters" />
            </Field>
          </FormShell>
        </CardContent>
      </Card>
    </div>
  );
}
