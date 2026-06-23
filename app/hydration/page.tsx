import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countToday } from "@/lib/today-count";
import { PageHeader } from "@/components/page-header";
import { DoneTodayBanner } from "@/components/done-today-banner";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveHydration } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function HydrationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const n = await countToday(supabase, user.id, "hydration_entries");

  return (
    <div>
      <PageHeader
        title="Hydration"
        subtitle="Manual logging for now. Built to extend to LARQ / Apple Health later."
      />
      {n > 0 ? (
        <DoneTodayBanner>You’ve logged hydration {n} time{n === 1 ? "" : "s"} today.</DoneTodayBanner>
      ) : null}
      <FormShell action={saveHydration} submitLabel="Save hydration">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <DateField />
            <Field label="Water intake (ML)" hint="Fill ML or OZ — the other is calculated.">
              <Input name="water_intake_ml" type="number" min={0} />
            </Field>
            <Field label="Water intake (OZ)">
              <Input name="water_intake_oz" type="number" step="0.1" min={0} />
            </Field>
            <Field label="Hydration goal (ML)" hint="Defaults to 3000 ml.">
              <Input name="hydration_goal_ml" type="number" min={0} defaultValue={3000} />
            </Field>
            <Field label="Source">
              <select name="source" defaultValue="Manual">
                <option value="Manual">Manual</option>
                <option value="LARQ">LARQ</option>
                <option value="Apple Health">Apple Health</option>
              </select>
            </Field>
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </CardContent>
        </Card>
      </FormShell>
    </div>
  );
}
