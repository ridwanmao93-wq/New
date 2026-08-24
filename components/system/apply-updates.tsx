"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type Result = { ok: boolean; message?: string; error?: string; needsSetup?: boolean };

/**
 * One-tap "Apply updates" — POSTs to /api/migrate, which runs the pending
 * database updates server-side. Falls back to clear setup guidance if the
 * DATABASE_URL secret hasn't been added yet.
 */
export function ApplyUpdates() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/migrate", { method: "POST" });
      const data = (await res.json()) as Result;
      setResult(data);
      if (data.ok) {
        // Re-check status so the page reflects the fix.
        setTimeout(() => router.refresh(), 600);
      }
    } catch {
      setResult({ ok: false, error: "Couldn’t reach the update service. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        <RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {busy ? "Applying updates…" : "Apply updates automatically"}
      </button>

      {result?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-300">
          ✅ {result.message ?? "Done."}
        </p>
      ) : null}

      {result && !result.ok && result.needsSetup ? (
        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium text-amber-200">One-time setup needed</p>
          <p className="text-muted-foreground">{result.error}</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              In Supabase → <span className="text-foreground">Project Settings → Database →
              Connection string</span>, copy the <span className="text-foreground">URI</span> (use the
              “Session pooler” one).
            </li>
            <li>
              In Vercel → your project → <span className="text-foreground">Settings → Environment
              Variables</span>, add <span className="text-foreground">DATABASE_URL</span> = that string.
            </li>
            <li>Redeploy (Vercel → Deployments → ⋯ → Redeploy), then tap the button again.</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Or just use the copy-paste SQL below — it does the same thing.
          </p>
        </div>
      ) : null}

      {result && !result.ok && !result.needsSetup ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-sm text-red-400">
          ⚠️ {result.error} — you can always use the copy-paste SQL below instead.
        </p>
      ) : null}
    </div>
  );
}
