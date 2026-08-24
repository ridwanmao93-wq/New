import { NextResponse } from "next/server";
import { Client } from "pg";
import { createClient } from "@/lib/supabase/server";
import { CATCH_UP_SQL } from "@/lib/db-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Applies pending database updates from inside the app — the "Apply updates"
 * button on /system. Runs the same idempotent catch-up SQL that page shows,
 * so it's always safe to run (nothing is destructive). Requires a logged-in
 * user, and a DATABASE_URL secret that lives only in the hosting env — never
 * in the client or in chat.
 */
export async function POST() {
  // Must be signed in.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      {
        ok: false,
        needsSetup: true,
        error:
          "One-time setup needed: add your Supabase database connection string as DATABASE_URL in your Vercel project settings, then redeploy.",
      },
      { status: 200 }
    );
  }

  const client = new Client({
    connectionString,
    // Supabase requires SSL; the managed cert isn't in Node's default bundle.
    ssl: { rejectUnauthorized: false },
    // Don't let a bad connection string hang the request.
    connectionTimeoutMillis: 10_000,
    statement_timeout: 60_000,
  });

  try {
    await client.connect();
    // The simple query protocol runs all statements in one round trip.
    await client.query(CATCH_UP_SQL);
    return NextResponse.json({ ok: true, message: "Database updated. Everything is caught up." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  } finally {
    await client.end().catch(() => {});
  }
}
