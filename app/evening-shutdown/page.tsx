import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveEveningShutdown } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DEFAULT_SURRENDER =
  "I surrender any tension or resistance I’m holding. I allow myself to rest.";

/** Calm end-of-day page: evening CBT + sobriety + momentum + anti-avoidance review. */
export default function EveningShutdownPage() {
  return (
    <div>
      <PageHeader title="Evening Shutdown" subtitle="Close the day gently. Review, give thanks, surrender." />
      <FormShell action={saveEveningShutdown} submitLabel="Complete shutdown">
        <DateField />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Self-Rating</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreField name="mood_score" label="Mood (1–10)" required />
            <ScoreField name="energy_score" label="Energy (1–10)" required />
            <ScoreField name="hopefulness_score" label="Hopefulness (1–10)" required />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reflection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• What did I do well today?</li>
              <li>• Did I act in alignment with my values?</li>
              <li>• What emotions stood out — did I let them pass?</li>
              <li>• What can I gently let go of now?</li>
            </ul>
            <Field label="Reflection notes (optional)">
              <Textarea name="reflection_notes" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sobriety Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckboxField name="cannabis_used" label="Cannabis used today" />
            <ScoreField name="craving_score" label="Craving intensity (1–10)" />
            <Field label="Trigger / response (optional)">
              <Input name="response_to_trigger" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Momentum Review — what did you actually do?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckboxField name="morning_cbt_completed" label="Morning CBT" />
            <CheckboxField name="evening_cbt_completed" label="Evening CBT" defaultChecked />
            <CheckboxField name="workout_completed" label="Workout" />
            <CheckboxField name="hydration_goal_hit" label="Hydration goal" />
            <CheckboxField name="no_cannabis" label="No cannabis" />
            <CheckboxField name="family_connection_completed" label="Family connection" />
            <CheckboxField name="business_growth_action_completed" label="Business growth action" />
            <CheckboxField name="hardest_thing_done" label="Did the hardest thing" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Anti-Avoidance Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="The hardest thing I didn’t want to do">
              <Input name="hardest_thing_i_did_not_want_to_do" />
            </Field>
            <CheckboxField name="did_i_do_it" label="I did it" />
            <Field label="What helped me take action">
              <Input name="what_helped_me_take_action" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gratitude & Surrender</CardTitle>
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
