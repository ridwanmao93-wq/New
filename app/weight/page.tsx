import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveWeight } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function WeightPage() {
  return (
    <div>
      <PageHeader title="Weight & Progress" subtitle="Default unit is lbs." />
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
