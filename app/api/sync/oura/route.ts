import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncOura } from "@/lib/oura/sync";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * POST /api/sync/oura
 * Syncs yesterday's Oura data for the authenticated user (upsert).
 * Optional JSON body: { "date": "YYYY-MM-DD" } to sync a specific day.
 */
export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  let date: string | undefined;
  try {
    const body = await request.json();
    date = body?.date;
  } catch {
    /* no body — default to yesterday */
  }

  try {
    const result = await syncOura(supabase, user.id, date ? { startDate: date, endDate: date } : {});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Oura sync (POST) failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/sync/oura?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Two modes:
 *  - Signed-in user (browser): syncs that user. Supports backfill params.
 *  - Vercel Cron (valid CRON_SECRET bearer): syncs every user in the
 *    `profiles` table automatically. No DASHBOARD_USER_ID needed — though
 *    if it is set, only that user is synced.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? startDate ?? undefined;

  // 1) Signed-in browser user.
  const { supabase, user } = await requireUser();
  if (user) {
    try {
      const result = await syncOura(supabase, user.id, { startDate, endDate });
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("❌ Oura sync (GET) failed:", message);
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  // 2) Vercel Cron — authenticated by CRON_SECRET.
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Which users to sync: the configured one, or everyone (single-user
    // apps "just work" with zero extra config).
    let userIds: string[];
    if (process.env.DASHBOARD_USER_ID) {
      userIds = [process.env.DASHBOARD_USER_ID];
    } else {
      const { data, error } = await admin.from("profiles").select("id");
      if (error) throw new Error(error.message);
      userIds = (data ?? []).map((r: { id: string }) => r.id);
    }

    const results = [];
    for (const id of userIds) {
      try {
        const r = await syncOura(admin, id, { startDate, endDate });
        results.push({ userId: id, ok: true, synced: r.synced, days: r.days });
      } catch (err) {
        results.push({ userId: id, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return NextResponse.json({ ok: true, users: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Oura cron sync failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
