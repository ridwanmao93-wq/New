"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  updateMomentumToday,
  setHardThingDone,
  setTodayFocus,
  type MomentumItems,
} from "@/lib/actions";

/**
 * The 30-second check-in — the whole point is that you can never fail it.
 * One screen: name the single hard thing, tap when it's done, and flick the
 * two or three items that matter most. Everything writes straight to the
 * momentum + anti-avoidance tables, so it stays in sync with the full
 * Morning practice. Designed to be the floor: showing up badly beats not
 * showing up.
 */

// The few items worth a one-tap chip — the highest-leverage wins only.
const QUICK_CHIPS: { key: keyof MomentumItems; label: string }[] = [
  { key: "no_cannabis", label: "Stayed clean" },
  { key: "workout_completed", label: "Moved my body" },
  { key: "meditation_completed", label: "Got centered" },
];

function emptyItems(): MomentumItems {
  return {
    morning_cbt_completed: false,
    evening_cbt_completed: false,
    workout_completed: false,
    hydration_goal_hit: false,
    no_cannabis: false,
    family_connection_completed: false,
    business_growth_action_completed: false,
    hardest_thing_done: false,
    meditation_completed: false,
  };
}

export function QuickCheckIn({
  date,
  hardThing,
  didIt,
  momentum,
  standalone = false,
}: {
  date: string;
  hardThing?: string;
  didIt?: boolean;
  momentum?: Record<string, any>;
  /** When true, renders as a full-page focus screen (the /today route). */
  standalone?: boolean;
}) {
  const [items, setItems] = useState<MomentumItems>(() => {
    const base = emptyItems();
    if (momentum) {
      for (const k of Object.keys(base) as (keyof MomentumItems)[]) base[k] = !!momentum[k];
    }
    return base;
  });
  const [focus, setFocus] = useState(hardThing ?? "");
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState(!!didIt);
  const [, startTransition] = useTransition();

  function commitFocus() {
    const text = draft.trim();
    if (!text) return;
    setFocus(text);
    setDraft("");
    startTransition(() => {
      setTodayFocus(date, text);
    });
  }

  function toggleDone() {
    const v = !done;
    setDone(v);
    // Reflect it in momentum too (hardest_thing_done is the heaviest win).
    const next = { ...items, hardest_thing_done: v };
    setItems(next);
    startTransition(() => {
      setHardThingDone(date, v);
      updateMomentumToday(date, next, focus || undefined);
    });
  }

  function toggleChip(key: keyof MomentumItems) {
    const next = { ...items, [key]: !items[key] };
    setItems(next);
    startTransition(() => {
      updateMomentumToday(date, next, focus || undefined);
    });
  }

  const chipsDone = QUICK_CHIPS.filter((c) => items[c.key]).length;
  const showedUp = done || chipsDone > 0;

  const inner = (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          30-second check-in
        </div>
        <div className="text-xs text-muted-foreground">{date}</div>
      </div>

      {/* The one hard thing — the star of the screen */}
      {focus ? (
        <button
          type="button"
          onClick={toggleDone}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
            done
              ? "border-emerald-500/50 bg-emerald-500/10"
              : "border-primary/40 bg-background/60 hover:bg-accent"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-base font-bold",
              done ? "border-emerald-500 bg-emerald-500 text-black" : "border-muted-foreground text-transparent"
            )}
          >
            ✓
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground">
              The one hard thing today
            </span>
            <span
              className={cn(
                "block text-xl font-bold leading-tight sm:text-2xl",
                done && "text-emerald-300 line-through opacity-80"
              )}
            >
              {focus}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {done ? "Done. That’s the whole game." : "Tap when it’s done."}
            </span>
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-primary/40 bg-background/60 p-4">
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">
            What’s the one hard thing today?
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitFocus();
                }
              }}
              placeholder="The thing you’re avoiding…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              autoFocus={standalone}
            />
            <button
              type="button"
              onClick={commitFocus}
              disabled={!draft.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              Set
            </button>
          </div>
        </div>
      )}

      {/* Three highest-leverage one-tap wins */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_CHIPS.map(({ key, label }) => {
          const on = items[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleChip(key)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center text-xs font-medium transition-colors",
                on
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border bg-background/60 text-muted-foreground hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                  on ? "border-primary bg-primary text-black" : "border-muted-foreground text-transparent"
                )}
              >
                ✓
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* The floor — you showed up, and that's the point */}
      <div
        className={cn(
          "rounded-lg px-4 py-2.5 text-center text-sm",
          showedUp ? "bg-emerald-500/10 text-emerald-300" : "text-muted-foreground"
        )}
      >
        {showedUp
          ? "✓ You showed up today. Never miss twice — that’s the only rule."
          : "One tap is a win. Showing up badly beats not showing up."}
      </div>
    </div>
  );

  if (standalone) {
    return (
      <Card className="mx-auto max-w-md border-primary/40 bg-primary/5">
        <CardContent className="p-5 sm:p-6">{inner}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-4 sm:p-5">{inner}</CardContent>
    </Card>
  );
}
