"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVisionItem } from "@/lib/actions";
import { cn } from "@/lib/utils";

function daysUntil(date?: string | null): string | null {
  if (!date) return null;
  const diff = Math.ceil((Date.parse(date + "T00:00:00Z") - Date.now()) / 86400000);
  if (diff < 0) return "passed";
  if (diff === 0) return "today";
  return `${diff} day${diff === 1 ? "" : "s"}`;
}

/** A single vision board image tile with caption, countdown and delete. */
export function VisionTile({ item }: { item: Record<string, any> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const countdown = daysUntil(item.target_date);

  function remove() {
    startTransition(async () => {
      await deleteVisionItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.caption || "Vision"}
        className="h-56 w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        {item.category ? (
          <span className="inline-block rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-medium uppercase text-black">
            {item.category}
          </span>
        ) : null}
        {item.caption ? (
          <p className="mt-1 text-sm font-semibold text-white">{item.caption}</p>
        ) : null}
        {countdown ? (
          <p className="text-xs text-white/80">
            {countdown === "passed" ? "Target date passed" : countdown === "today" ? "Target: today" : `${countdown} to go`}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => (confirming ? remove() : setConfirming(true))}
        onBlur={() => setConfirming(false)}
        disabled={pending}
        className={cn(
          "absolute right-2 top-2 rounded-md px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100",
          confirming ? "bg-destructive text-white opacity-100" : "bg-black/60 text-white"
        )}
      >
        {pending ? "…" : confirming ? "Confirm" : "Remove"}
      </button>
    </div>
  );
}
