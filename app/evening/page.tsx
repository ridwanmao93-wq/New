import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveEvening } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DEFAULT_SURRENDER =
  "I surrender any tension or resistance I’m holding. I allow myself to rest.";

export default async function EveningPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pull this morning's anti-avoidance commitment so it reappears here.
  const { data: aa } = await supabase
    .from("anti_avoidance_entries")
    .select("hardest_thing_i_did_not_want_to_do")
    .eq("user_id", user.id)
    .eq("date", today())
    .maybeSingle();
  const hardestThing = aa?.hardest_thing_i_did_not_want_to_do ?? "";

  return (
    <div>
      <PageHeader title="Evening Practice" subtitle="Close the day gently. Nothing here is required." />
      <FormShell action={saveEvening} submitLabel="Save evening">
        <DateField />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Self-Rating</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreField name="mood_score" label="Mood (1–10)" />
            <ScoreField name="energy_score" label="Energy (1–10)" />
            <ScoreField name="hopefulness_score" label="Hopefulness (1–10)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Silent Reflection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• What did I do well today?</li>
              <li>• Did I act in alignment with my values?</li>
              <li>• What emotions stood out — did I let them pass or resist them?</li>
              <li>• What can I gently let go of now?</li>
            </ul>
            <Field label="Reflection notes (optional)">
              <Textarea name="reflection_notes" />
            </Field>
          </CardContent>
        </Card>

        {/* Anti-avoidance review — carried over from this morning */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Anti-Avoidance Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="The hardest thing I set out to do today" hint="Carried over from your morning routine — edit if needed.">
              <Input name="hardest_thing_i_did_not_want_to_do" defaultValue={hardestThing} />
            </Field>
            <CheckboxField name="did_i_do_it" label="Did I do it?" />
            <Field label="Why or why not?">
              <Textarea name="why_or_why_not" />
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
