"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveVisionItem, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUTURE_SELF_CATEGORIES } from "@/lib/validation/schemas";

/** Add a vision board tile — upload an image or paste an image URL. */
export function VisionItemForm({
  userId,
  goals,
}: {
  userId: string;
  goals: { id: string; goal_name: string }[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      let imageUrl = (data.get("image_url") as string)?.trim();

      // If a file was chosen, upload it to Supabase Storage first.
      if (file) {
        const supabase = createClient();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage
          .from("vision-board")
          .upload(path, file, { upsert: true });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        imageUrl = supabase.storage.from("vision-board").getPublicUrl(path).data.publicUrl;
        data.set("image_url", imageUrl);
      }

      if (!imageUrl) {
        setStatus({ ok: false, error: "Choose an image or paste an image URL." });
        setLoading(false);
        return;
      }

      const result = await saveVisionItem({ ok: false }, data);
      setStatus(result);
      if (result.ok) {
        form.reset();
        setFile(null);
        router.refresh();
      }
    } catch (err) {
      setStatus({ ok: false, error: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Image</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:text-foreground"
        />
        <p className="text-xs text-muted-foreground">…or paste an image URL below.</p>
        <Input name="image_url" type="url" placeholder="https://…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="caption">Caption / affirmation</Label>
        <Input id="caption" name="caption" placeholder="Debt-free and at peace" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select name="category" defaultValue="Health">
            {FUTURE_SELF_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target_date">Target date (optional)</Label>
          <Input id="target_date" name="target_date" type="date" />
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-1.5">
          <Label>Link to a Future Self goal (optional)</Label>
          <select name="future_self_goal_id" defaultValue="">
            <option value="">— none —</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.goal_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {status?.ok ? (
        <p className="rounded-md bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-400">✅ Added to your vision board.</p>
      ) : null}
      {status && !status.ok ? (
        <p className="rounded-md bg-destructive/15 px-4 py-2.5 text-sm text-red-400">⚠️ {status.error}</p>
      ) : null}

      <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
        {loading ? "Adding…" : "Add to vision board"}
      </Button>
    </form>
  );
}
