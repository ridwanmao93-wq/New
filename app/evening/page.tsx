import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, ScoreField, DateField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveEvening } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DEFAULT_SURRENDER =
  "I surrender any tension or resistance I’m holding. I allow myself to rest.";

export default function EveningPage() {
  return (
    <div>
      <PageHeader title="Evening Practice" subtitle="Lightweight reflection. No long-form journaling required." />
      <FormShell action={saveEvening} submitLabel="Save evening practice">
        <DateField />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Step 1 · Self-Rating</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreField name="mood_score" label="Mood (1–10)" required />
            <ScoreField name="energy_score" label="Energy (1–10)" required />
            <ScoreField name="hopefulness_score" label="Hopefulness (1–10)" required />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Step 2 · Silent Reflection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• What did I do well today?</li>
              <li>• Did I act in alignment with my values?</li>
              <li>• What emotions stood out — did I allow them to pass or resist them?</li>
              <li>• What can I gently let go of now?</li>
            </ul>
            <Field label="Reflection notes (optional)">
              <Textarea name="reflection_notes" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Step 3 · Gratitude & Surrender</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="One thing I’m grateful for today is…">
              <Input name="gratitude" />
            </Field>
            <Field label="Surrender statement">
              <Textarea name="surrender_statement" defaultValue={DEFAULT_SURRENDER} />
            </Field>
          </CardContent>
        </Card>
      </FormShell>
    </div>
  );
}
