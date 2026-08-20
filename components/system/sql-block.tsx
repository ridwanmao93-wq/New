"use client";

import { useState } from "react";

/** A read-only SQL block with a one-tap copy button. */
export function SqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the user can still select the text manually */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 z-10 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
      >
        {copied ? "Copied ✓" : "Copy SQL"}
      </button>
      <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-background/80 p-4 pt-12 text-[11px] leading-relaxed text-muted-foreground">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
