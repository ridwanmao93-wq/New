"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFocus, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * A deep-work timer. Start it, work, then log the session. Minutes are
 * auto-filled from the timer but stay editable (so you can also log a
 * block you already did).
 */
export function FocusTimer() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [status, setStatus] = useState<ActionState | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  // Keep the minutes field synced with the running timer until edited.
  useEffect(() => {
    if (running) setMinutes(String(Math.max(1, Math.round(seconds / 60))));
  }, [seconds, running]);

  async function logSession() {
    setSaving(true);
    setStatus(null);
    const mins = parseInt(minutes || "0", 10) || Math.max(1, Math.round(seconds / 60));
    const data = new FormData();
    data.set("minutes", String(mins));
    if (focusArea) data.set("focus_area", focusArea);
    const result = await saveFocus({ ok: false }, data);
    setStatus(result);
    setSaving(false);
    if (result.ok) {
      setRunning(false);
      setSeconds(0);
      setMinutes("");
      setFocusArea("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="font-mono text-5xl font-bold tabular-nums">{fmt(seconds)}</div>
        <div className="mt-3 flex justify-center gap-2">
          <Button type="button" onClick={() => setRunning((r) => !r)} variant={running ? "secondary" : "default"}>
            {running ? "Pause" : seconds === 0 ? "Start" : "Resume"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
          >
            Reset
          </Button>
        </div>
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
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
      </div>

      {status?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-400">✅ Focus session logged.</p>
      ) : null}
      {status && !status.ok ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-sm text-red-400">⚠️ {status.error}</p>
      ) : null}

      <Button type="button" onClick={logSession} disabled={saving} size="lg" className="w-full sm:w-auto">
        {saving ? "Logging…" : "Log session"}
      </Button>
    </div>
  );
}
