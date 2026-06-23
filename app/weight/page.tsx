import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countToday } from "@/lib/today-count";
import { PageHeader } from "@/components/page-header";
import { DoneTodayBanner } from "@/components/done-today-banner";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveWeight } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const n = await countToday(supabase, user.id, "weight_entries");

  return (
    <div>
      <PageHeader title="Weight & Progress" subtitle="Default unit is lbs." />
      {n > 0 ? <DoneTodayBanner>You’ve already recorded your weight today.</DoneTodayBanner> : null}
      <FormShell action={saveWeight} submitLabel="Save weight">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <DateField />
            <Field label="Weight (lbs) *">
              <Input name="weight_lbs" type="number" step="0.1" min={0} required />
            </Field>
            <Field label="Waist measurement (optional)">
              <Input name="waist_measurement" type="number" step="0.1" min={0} />
            </Field>
            <Field label="Progress photo URL (optional)">
              <Input name="progress_photo_url" type="url" placeholder="https://…" />
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
