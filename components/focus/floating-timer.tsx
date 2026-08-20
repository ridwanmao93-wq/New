"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pause, Play, Check, X, Timer } from "lucide-react";
import { useFocusTimer } from "@/components/focus/focus-timer-provider";
import { cn } from "@/lib/utils";

function fmt(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * A floating deep-work timer that appears on every page while a session is
 * running, so you can leave the Focus page and it keeps counting. Pause,
 * resume, or log the session from anywhere.
 */
export function FloatingTimer() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, active, running, elapsed, focusArea, pause, resume, reset, logSession } =
    useFocusTimer();
  const [saving, setSaving] = useState(false);

  // Never show on the login screen, before hydration, or when idle.
  if (!ready || !active || pathname?.startsWith("/login")) return null;

  async function log() {
    setSaving(true);
    const res = await logSession();
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(20rem,calc(100vw-2rem))]">
      <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-card/95 p-3 shadow-lg backdrop-blur">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            running ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}
        >
          <Timer className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-lg font-bold leading-none tabular-nums">{fmt(elapsed)}</div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {focusArea || "Deep work"} · {running ? "running" : "paused"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {running ? (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resume}
              aria-label="Resume"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={log}
            disabled={saving}
            aria-label="Log session"
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "…" : "Log"}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Discard"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
