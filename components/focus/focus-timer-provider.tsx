"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { saveFocus, type ActionState } from "@/lib/actions";

/**
 * A global deep-work timer that lives in the root layout, so it keeps
 * running while you navigate between pages. State is persisted to
 * localStorage and elapsed time is derived from a start timestamp — so it
 * stays accurate across a refresh, a backgrounded tab, or a locked phone.
 */

type Persisted = {
  running: boolean;
  startedAt: number | null; // epoch ms when the current run began
  baseSeconds: number; // seconds accumulated before the current run
  focusArea: string;
};

const STORAGE_KEY = "perfos.focusTimer";
const DEFAULT: Persisted = { running: false, startedAt: null, baseSeconds: 0, focusArea: "" };

type TimerContext = {
  ready: boolean;
  active: boolean;
  running: boolean;
  elapsed: number; // seconds
  focusArea: string;
  start: (focusArea?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setFocusArea: (s: string) => void;
  logSession: (minutesOverride?: number) => Promise<ActionState>;
};

const Ctx = createContext<TimerContext | null>(null);

export function useFocusTimer(): TimerContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFocusTimer must be used within FocusTimerProvider");
  return ctx;
}

function elapsedFrom(s: Persisted, nowMs: number): number {
  const live = s.running && s.startedAt ? Math.floor((nowMs - s.startedAt) / 1000) : 0;
  return s.baseSeconds + Math.max(0, live);
}

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Rehydrate from localStorage once, on mount (avoids SSR hydration drift).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        if (parsed && typeof parsed === "object") setState({ ...DEFAULT, ...parsed });
      }
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / blocked — timer still works in-memory */
    }
  }, [state, ready]);

  // Tick once a second while running so the display updates.
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  // Keep the clock honest when a backgrounded tab comes back to the front.
  useEffect(() => {
    const onVisible = () => setNowMs(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  const start = useCallback((focusArea?: string) => {
    setState((s) => ({
      running: true,
      startedAt: Date.now(),
      baseSeconds: 0,
      focusArea: focusArea ?? s.focusArea,
    }));
    setNowMs(Date.now());
  }, []);

  const pause = useCallback(() => {
    setState((s) => {
      if (!s.running) return s;
      return {
        ...s,
        running: false,
        startedAt: null,
        baseSeconds: elapsedFrom(s, Date.now()),
      };
    });
  }, []);

  const resume = useCallback(() => {
    setState((s) => (s.running ? s : { ...s, running: true, startedAt: Date.now() }));
    setNowMs(Date.now());
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...DEFAULT, focusArea: s.focusArea }));
  }, []);

  const setFocusArea = useCallback((focusArea: string) => {
    setState((s) => ({ ...s, focusArea }));
  }, []);

  const logSession = useCallback(async (minutesOverride?: number): Promise<ActionState> => {
    const s = stateRef.current;
    const elapsed = elapsedFrom(s, Date.now());
    const minutes = minutesOverride ?? Math.max(1, Math.round(elapsed / 60));
    const data = new FormData();
    data.set("minutes", String(minutes));
    if (s.focusArea) data.set("focus_area", s.focusArea);
    const res = await saveFocus({ ok: false }, data);
    if (res.ok) setState({ ...DEFAULT });
    return res;
  }, []);

  const elapsed = elapsedFrom(state, nowMs);
  const value: TimerContext = {
    ready,
    active: state.running || elapsed > 0,
    running: state.running,
    elapsed,
    focusArea: state.focusArea,
    start,
    pause,
    resume,
    reset,
    setFocusArea,
    logSession,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
