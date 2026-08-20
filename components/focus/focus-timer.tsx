"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFocusTimer } from "@/components/focus/focus-timer-provider";
import { type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function fmt(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * The Focus-page timer. It drives the SHARED global timer (from
 * FocusTimerProvider), so once you start it you can navigate anywhere in the
 * dashboard and a floating timer keeps counting. Minutes auto-fill from the
 * clock but stay editable so you can also log a block you already did.
 */
export function FocusTimer() {
  const router = useRouter();
  const { running, elapsed, active, focusArea, start, pause, resume, reset, setFocusArea, logSession } =
    useFocusTimer();

  const [minutesOverride, setMinutesOverride] = useState("");
  const [status, setStatus] = useState<ActionState | null>(null);
  const [saving, setSaving] = useState(false);

  async function log() {
    setSaving(true);
    setStatus(null);
    const override = minutesOverride.trim() ? parseInt(minutesOverride, 10) : undefined;
    const result = await logSession(Number.isFinite(override as number) ? override : undefined);
    setStatus(result);
    setSaving(false);
    if (result.ok) {
      setMinutesOverride("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="font-mono text-5xl font-bold tabular-nums">{fmt(elapsed)}</div>
        <div className="mt-3 flex justify-center gap-2">
          {running ? (
            <Button type="button" onClick={pause} variant="secondary">
              Pause
            </Button>
          ) : (
            <Button type="button" onClick={() => (active ? resume() : start())}>
              {active ? "Resume" : "Start"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={reset} disabled={!active}>
            Reset
          </Button>
        </div>
        {active ? (
          <p className="mt-2 text-xs text-muted-foreground">
            The timer keeps running while you move around — look for it floating in the corner.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="focus_area">Focus area</Label>
          <Input
            id="focus_area"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="Business, study, deep work…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minutes">Minutes to log</Label>
          <Input
            id="minutes"
            type="number"
            min={1}
            value={minutesOverride}
            onChange={(e) => setMinutesOverride(e.target.value)}
            placeholder={elapsed > 0 ? String(Math.max(1, Math.round(elapsed / 60))) : "e.g. 50"}
          />
        </div>
      </div>

      {status?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-400">✅ Focus session logged.</p>
      ) : null}
      {status && !status.ok ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-sm text-red-400">⚠️ {status.error}</p>
      ) : null}

      <Button type="button" onClick={log} disabled={saving} size="lg" className="w-full sm:w-auto">
        {saving ? "Logging…" : "Log session"}
      </Button>
    </div>
  );
}
