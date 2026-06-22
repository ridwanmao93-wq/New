import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyReview } from "@/lib/analytics/weekly-review";

export const dynamic = "force-dynamic";

/**
 * POST /api/generate-weekly-review
 * Aggregates the previous 7 days and upserts a weekly_reviews row.
 * Optional JSON body: { reflection_notes, intentions_for_next_week }.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  let notes = {};
  try {
    notes = await request.json();
  } catch {
    /* no body */
  }

  try {
    const result = await generateWeeklyReview(supabase, user.id, notes);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Weekly review failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
