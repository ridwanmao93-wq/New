"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions";

const initialState: ActionState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Wraps a server action with progressive-enhancement status feedback.
 * Children are the form fields; the action handles validation + persist.
 */
export function FormShell({
  action,
  submitLabel = "Save",
  children,
  resetOnSuccess = true,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form
      action={formAction}
      key={resetOnSuccess && state.ok ? Math.random() : "form"}
      className="space-y-5"
    >
      {children}

      {state.ok && state.message ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-400">
          ✅ {state.message}
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-sm text-red-400">
          ⚠️ {state.error}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
