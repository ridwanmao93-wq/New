"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateMomentumToday, setHardThingDone, type MomentumItems } from "@/lib/actions";
import { MOMENTUM_ITEMS, momentumScore } from "@/lib/momentum";

const ITEM_LABELS = MOMENTUM_ITEMS;

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

export function TodayPanel({
  date,
  momentum,
  mostImportant,
  identity,
  hardThing,
  didIt,
}: {
  date: string;
  momentum?: Record<string, any>;
  mostImportant?: string;
  identity?: string;
  hardThing?: string;
  didIt?: boolean;
}) {
  const [items, setItems] = useState<MomentumItems>(() => {
    const base = emptyItems();
    if (momentum) {
      for (const k of Object.keys(base) as (keyof MomentumItems)[]) {
        base[k] = !!momentum[k];
      }
    }
    return base;
  });
  const [done, setDone] = useState(!!didIt);
  const [, startTransition] = useTransition();

  const score = momentumScore(items);

  function toggle(key: keyof MomentumItems) {
    const next = { ...items, [key]: !items[key] };
    setItems(next);
    startTransition(() => {
      updateMomentumToday(date, next, mostImportant);
    });
  }

  function toggleDone() {
    const v = !done;
    setDone(v);
    startTransition(() => {
      setHardThingDone(date, v);
    });
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Today</span>
          <span className="text-sm font-normal text-muted-foreground">Momentum {score}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's mission — the single most important thing */}
        <div className="rounded-lg bg-background/60 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Today’s mission · one most important action
          </div>
          <div className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
            {mostImportant || (
              <span className="text-muted-foreground">Set it in Morning →</span>
            )}
          </div>
          <div className="mt-3 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Becoming · </span>
            <span className="font-semibold">
              {identity || <span className="text-muted-foreground">set your identity in Morning</span>}
            </span>
          </div>
        </div>

        {/* The hard thing */}
        {hardThing ? (
          <button
            type="button"
            onClick={toggleDone}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              done ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-background/60 hover:bg-accent"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm",
                done ? "border-emerald-500 bg-emerald-500 text-black" : "border-muted-foreground"
              )}
            >
              {done ? "✓" : ""}
            </span>
            <span>
              <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                The hard thing
              </span>
              <span className={cn("text-sm", done && "line-through opacity-70")}>{hardThing}</span>
            </span>
          </button>
        ) : null}

        {/* Quick momentum checklist */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Tap to check off as you go
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ITEM_LABELS.map(({ key, label }) => {
              const on = items[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                    on
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border bg-background/60 text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      on ? "border-primary bg-primary text-black" : "border-muted-foreground"
                    )}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
