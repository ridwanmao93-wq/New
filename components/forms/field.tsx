import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { today } from "@/lib/dates";

/** Label + helper text wrapper used across all forms. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A 1–10 number input. */
export function ScoreField({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: number;
}) {
  return (
    <Field label={`${label}${required ? " *" : ""}`} htmlFor={name}>
      <Input
        id={name}
        name={name}
        type="number"
        min={1}
        max={10}
        required={required}
        defaultValue={defaultValue}
      />
    </Field>
  );
}

/** Date input defaulting to today. */
export function DateField({ defaultToday = true }: { defaultToday?: boolean }) {
  return (
    <Field label="Date" htmlFor="date" hint="Defaults to today.">
      <Input id="date" name="date" type="date" defaultValue={defaultToday ? today() : undefined} />
    </Field>
  );
}

/** Native checkbox with a label, sized for touch. */
export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-input bg-transparent px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

export { Input, Textarea };
