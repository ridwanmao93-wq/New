import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWebPush } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/test
 * Sends a test notification to the signed-in user's own subscriptions.
 * Returns a detailed result so the Settings page can show exactly what
 * went wrong (VAPID not configured, no subscription saved, etc.).
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let webpush: ReturnType<typeof getWebPush>;
  try {
    webpush = getWebPush();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "VAPID keys not configured on the server." },
      { status: 500 }
    );
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: `Could not read subscriptions: ${error.message}. Did you run migration 0004?` },
      { status: 500 }
    );
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No subscription found on this account. Tap “Enable notifications” first (on this device)." },
      { status: 400 }
    );
  }

  const payload = JSON.stringify({
    title: "✅ Test notification",
    body: "Push is working. You’ll get your morning, midday and evening nudges.",
    url: "/dashboard",
  });

  let sent = 0;
  let removed = 0;
  const errors: string[] = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        removed++;
      } else {
        errors.push(`${err?.statusCode ?? ""} ${err?.body || err?.message || "send failed"}`.trim());
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          removed > 0
            ? "Your saved subscription was stale and has been cleared — tap “Enable notifications” again."
            : `Send failed: ${errors.join("; ") || "unknown error"}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sent, removed });
}
