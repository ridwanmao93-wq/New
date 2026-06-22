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
 * Resolve the actor for a request: a signed-in user (session cookie),
 * or — for Vercel Cron — a valid CRON_SECRET bearer token combined
 * with DASHBOARD_USER_ID, which uses the service-role client.
 */
async function resolveActor(request: Request) {
  const { supabase, user } = await requireUser();
  if (user) return { supabase, userId: user.id };

  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth === `Bearer ${secret}` && process.env.DASHBOARD_USER_ID) {
    return { supabase: createAdminClient(), userId: process.env.DASHBOARD_USER_ID };
  }
  return null;
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
 * Backfill a date range. Without params, defaults to yesterday.
 */
export async function GET(request: Request) {
  const actor = await resolveActor(request);
  if (!actor) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? startDate ?? undefined;

  try {
    const result = await syncOura(actor.supabase, actor.userId, { startDate, endDate });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Oura sync (GET) failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
