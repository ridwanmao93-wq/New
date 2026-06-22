"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Triggers POST /api/sync/oura and shows the result inline. */
export function SyncOuraButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/sync/oura", { method: "POST" });
      const json = await res.json();
      setStatus(
        json.ok
          ? `✅ Synced ${json.synced} day(s): ${json.days?.join(", ") || "—"}`
          : `⚠️ ${json.error}`
      );
    } catch (e) {
      setStatus(`⚠️ ${e instanceof Error ? e.message : "Sync failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={sync} disabled={loading}>
        {loading ? "Syncing…" : "Sync Oura now (yesterday)"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
