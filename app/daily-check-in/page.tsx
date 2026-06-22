import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { SentenceStemsField } from "@/components/forms/sentence-stems-field";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveDailyCheckIn } from "@/lib/actions";

export const dynamic = "force-dynamic";

/**
 * One morning page to orient the whole day: morning CBT + alignment +
 * sobriety + momentum + anti-avoidance + most important action.
 */
export default function DailyCheckInPage() {
  return (
    <div>
      <PageHeader title="Daily Check-In" subtitle="Open this each morning and orient your whole day." />
      <FormShell action={saveDailyCheckIn} submitLabel="Start my day">
        <DateField />

        {/* Most important action — front and center */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today’s one most important action</CardTitle>
          </CardHeader>
          <CardContent>
            <Input name="most_important_action" placeholder="The one thing that matters most today" />
          </CardContent>
        </Card>

        {/* Morning CBT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Morning CBT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="italic text-muted-foreground">
              “Today, I choose to live consciously and align with my values.”
            </p>
            <CheckboxField name="centering_completed" label="Centering completed" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ScoreField name="mood_score" label="Mood (1–10)" required />
              <ScoreField name="energy_score" label="Energy (1–10)" required />
              <ScoreField name="hopefulness_score" label="Hopefulness (1–10)" required />
            </div>
            <SentenceStemsField />
            <Field label="Today I will act like the kind of person who…">
              <Textarea name="identity_action_statement" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Identity I am releasing">
                <Input name="identity_releasing" />
              </Field>
              <Field label="Identity I am stepping into">
                <Input name="identity_stepping_into" />
              </Field>
            </div>
            <CheckboxField name="affirmation_completed" label="Affirmation completed" />
          </CardContent>
        </Card>

        {/* Alignment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Alignment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ScoreField name="followed_values_score" label="Followed my values (1–10)" required />
            <ScoreField name="avoided_something_important_score" label="Faced what I'd normally avoid (1–10)" required />
            <ScoreField name="acted_courageously_score" label="Acted courageously (1–10)" required />
            <ScoreField name="kept_promises_score" label="Kept my promises (1–10)" required />
          </CardContent>
        </Card>

        {/* Sobriety */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sobriety Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckboxField name="cannabis_used" label="Cannabis used today" />
            <ScoreField name="craving_score" label="Craving intensity (1–10)" />
            <Field label="Trigger (if any)">
              <Input name="trigger" />
            </Field>
            <Field label="Response to trigger">
              <Input name="response_to_trigger" />
            </Field>
          </CardContent>
        </Card>

        {/* Momentum */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Momentum (check what you’ll commit to)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckboxField name="morning_cbt_completed" label="Morning CBT" defaultChecked />
            <CheckboxField name="evening_cbt_completed" label="Evening CBT" />
            <CheckboxField name="workout_completed" label="Workout" />
            <CheckboxField name="hydration_goal_hit" label="Hydration goal" />
            <CheckboxField name="no_cannabis" label="No cannabis" />
            <CheckboxField name="family_connection_completed" label="Family connection" />
            <CheckboxField name="business_growth_action_completed" label="Business growth action" />
            <CheckboxField name="hardest_thing_done" label="Did the hardest thing" />
          </CardContent>
        </Card>

        {/* Anti-avoidance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Anti-Avoidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="The hardest thing I don’t want to do today">
              <Input name="hardest_thing_i_did_not_want_to_do" />
            </Field>
            <CheckboxField name="did_i_do_it" label="I will do it / I did it" />
            <Field label="What usually makes me avoid it">
              <Input name="avoidance_trigger" />
            </Field>
            <Field label="What will help me take action">
              <Input name="what_helped_me_take_action" />
            </Field>
          </CardContent>
        </Card>
      </FormShell>
    </div>
  );
}
