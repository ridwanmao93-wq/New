import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * A friendly post-deploy check. Reports (without leaking any secret
 * values) whether the required environment variables are present and
 * whether the Supabase database is reachable. Open this URL right after
 * deploying to confirm everything is wired up.
 */
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OURA_ACCESS_TOKEN: !!process.env.OURA_ACCESS_TOKEN,
    CRON_SECRET: !!process.env.CRON_SECRET,
    DASHBOARD_USER_ID: !!process.env.DASHBOARD_USER_ID,
  };

  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // Database reachability (connection only — RLS keeps data private).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    checks.database = { ok: false, detail: "Supabase URL / anon key not set" };
  } else {
    try {
      const supabase = createClient(url, anon, {
        auth: { persistSession: false },
      });
      const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
      checks.database = error
        ? { ok: false, detail: error.message }
        : { ok: true, detail: "Connected. Migration table 'profiles' found." };
    } catch (e) {
      checks.database = { ok: false, detail: e instanceof Error ? e.message : "connection failed" };
    }
  }

  const requiredEnvOk =
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY;
  const ok = requiredEnvOk && checks.database.ok;

  // Friendly next-step hints.
  const hints: string[] = [];
  if (!requiredEnvOk) hints.push("Add the missing Supabase env vars in your host, then redeploy.");
  if (requiredEnvOk && !checks.database.ok)
    hints.push("Run supabase/migrations/0001_init.sql in the Supabase SQL editor.");
  if (!env.OURA_ACCESS_TOKEN) hints.push("Add OURA_ACCESS_TOKEN to enable Oura sync.");
  if (!env.DASHBOARD_USER_ID) hints.push("Sign in once, then set DASHBOARD_USER_ID for cron/CLI jobs.");
  if (ok && hints.length === 0) hints.push("All systems go. Open /login to begin.");

  return NextResponse.json(
    { ok, time: new Date().toISOString(), env, checks, hints },
    { status: ok ? 200 : 503 }
  );
}
