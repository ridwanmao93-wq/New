"use client";

import { FormShell } from "@/components/forms/form-shell";
import { SentenceStemsField } from "@/components/forms/sentence-stems-field";
import { Field, ScoreField, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveMorning } from "@/lib/actions";

export function MorningForm() {
  return (
    <FormShell action={saveMorning} submitLabel="Save morning practice">
      <DateField />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step 1 · Centering</CardTitle>
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
          <CardTitle className="text-base">Step 2 · Self-Rating</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ScoreField name="mood_score" label="Mood (1–10)" required />
          <ScoreField name="energy_score" label="Energy (1–10)" required />
          <ScoreField name="hopefulness_score" label="Hopefulness (1–10)" required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step 3 · Sentence Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <SentenceStemsField />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step 4 · Identity-Aware Action</CardTitle>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step 5 · Optional Affirmation</CardTitle>
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
