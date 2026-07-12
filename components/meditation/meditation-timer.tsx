"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMeditation, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 15, 20];

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * A meditation countdown. Pick a length, sit, and it logs the session
 * when the timer completes (or when you end early).
 */
export function MeditationTimer() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(10);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function choose(mins: number) {
    setRunning(false);
    setMinutes(mins);
    setRemaining(mins * 60);
    setStatus(null);
  }

  async function log(mins: number) {
    if (mins < 1) return;
    setSaving(true);
    const data = new FormData();
    data.set("minutes", String(mins));
    const result = await saveMeditation({ ok: false }, data);
    setStatus(result);
    setSaving(false);
    if (result.ok) router.refresh();
  }

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            // Completed — stop and log the full session.
            setRunning(false);
            void log(minutes);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, minutes]);

  const elapsedMin = Math.max(0, Math.round((minutes * 60 - remaining) / 60));
  const done = remaining === 0;

  return (
    <div className="space-y-5">
      {/* Length presets */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => choose(p)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              minutes === p
                ? "border-primary bg-primary/15 text-primary"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            {p} min
          </button>
        ))}
      </div>

      <div className="text-center">
        <div className="font-mono text-6xl font-bold tabular-nums">{fmt(remaining)}</div>
        {done ? (
          <p className="mt-2 text-sm text-emerald-400">Session complete. Well done.</p>
        ) : null}
        <div className="mt-4 flex justify-center gap-2">
          <Button
            type="button"
            size="lg"
            onClick={() => setRunning((r) => !r)}
            disabled={done}
            variant={running ? "secondary" : "default"}
          >
            {running ? "Pause" : remaining === minutes * 60 ? "Begin" : "Resume"}
          </Button>
          <Button type="button" variant="outline" onClick={() => choose(minutes)}>
            Reset
          </Button>
          {!done ? (
            <Button
              type="button"
              variant="ghost"
              disabled={saving || elapsedMin < 1}
              onClick={() => {
                setRunning(false);
                log(elapsedMin);
              }}
            >
              End &amp; log ({elapsedMin}m)
            </Button>
          ) : null}
        </div>
      </div>

      {status?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-center text-sm text-emerald-400">
          ✅ Meditation logged.
        </p>
      ) : null}
      {status && !status.ok ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-center text-sm text-red-400">
          ⚠️ {status.error}
        </p>
      ) : null}
    </div>
  );
}
