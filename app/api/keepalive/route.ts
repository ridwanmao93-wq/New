import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/keepalive
 *
 * Pings the database so Supabase's free tier never sees 7 days of
 * inactivity and auto-pauses the project. Vercel Cron hits this daily (see
 * vercel.json). It only runs a tiny read, needs no secrets beyond the
 * public Supabase keys the app already uses, and is safe to call anytime.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: "Supabase env vars not set" },
      { status: 200 }
    );
  }
  try {
    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    // A lightweight count — a real request to the project, which is what
    // resets Supabase's inactivity timer. RLS keeps the data private.
    const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    return NextResponse.json({ ok: true, pinged: true, time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ping failed" },
      { status: 200 }
    );
  }
}
