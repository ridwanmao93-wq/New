"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrainDump } from "@/lib/actions";

export function DeleteNote({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteBrainDump(id);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground transition-colors hover:text-red-400"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
