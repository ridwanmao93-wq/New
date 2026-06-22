"use client";

import { FormShell } from "@/components/forms/form-shell";
import { SentenceStemsField } from "@/components/forms/sentence-stems-field";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveMorning } from "@/lib/actions";

export function MorningForm() {
  return (
    <FormShell action={saveMorning} submitLabel="Save morning routine">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Centering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="italic text-muted-foreground">
            “Today, I choose to live consciously and align with my values.”
          </p>
          <CheckboxField name="centering_completed" label="Centering completed" />
        </CardContent>
      </Card>

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
          <CardTitle className="text-base">Sentence Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <SentenceStemsField />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Identity-Aware Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Today I will act like the kind of person who…">
            <Textarea name="identity_action_statement" />
          </Field>
          <Field label="If I fully accepted my success, I would…">
            <Textarea name="fully_accepted_success_response" />
          </Field>
          <Field label="If I no longer needed to suffer, I would…">
            <Textarea name="no_longer_needed_to_suffer_response" />
          </Field>
          <Field label="The identity I am releasing is…">
            <Input name="identity_releasing" />
          </Field>
          <Field label="The identity I am stepping into is…">
            <Input name="identity_stepping_into" />
          </Field>
        </CardContent>
      </Card>

      {/* Momentum — commit to today's items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Momentum — what will you commit to today?</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckboxField name="morning_cbt_completed" label="Morning CBT" defaultChecked />
          <CheckboxField name="evening_cbt_completed" label="Evening CBT" />
          <CheckboxField name="workout_completed" label="Workout" />
          <CheckboxField name="hydration_goal_hit" label="Hydration goal" />
          <CheckboxField name="no_cannabis" label="No cannabis" />
          <CheckboxField name="family_connection_completed" label="Family connection" />
          <CheckboxField name="business_growth_action_completed" label="Business growth action" />
          <CheckboxField name="hardest_thing_done" label="Do the hardest thing" />
        </CardContent>
      </Card>

      {/* Anti-avoidance plan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Anti-Avoidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="The hardest thing I don’t want to do today">
            <Input name="hardest_thing_i_did_not_want_to_do" />
          </Field>
          <Field label="What usually makes me avoid it">
            <Input name="avoidance_trigger" />
          </Field>
          <Field label="What will help me take action">
            <Input name="what_helped_me_take_action" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Optional Affirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="italic text-muted-foreground">
            “I am worthy, capable, and deserving of happiness and success.”
          </p>
          <CheckboxField name="affirmation_completed" label="Affirmation completed" />
        </CardContent>
      </Card>

      <Field label="Notes">
        <Textarea name="notes" />
      </Field>
    </FormShell>
  );
}
