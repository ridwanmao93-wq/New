import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebPush, type PushPayload } from "@/lib/push/web-push";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/push/send?slot=morning|midday|evening
 *
 * Sends the reminder for a time slot to every saved subscription.
 * Auth: CRON_SECRET via `Authorization: Bearer …` header OR `?key=…`
 * (the query form is convenient for external schedulers like
 * cron-job.org). Vercel Cron supplies the header automatically.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slot = (searchParams.get("slot") || "morning").toLowerCase();

  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const key = searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let webpush: ReturnType<typeof getWebPush>;
  try {
    webpush = getWebPush();
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "VAPID" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: subs, error } = await admin.from("push_subscriptions").select("*");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const td = today();

  async function payloadFor(userId: string): Promise<PushPayload> {
    if (slot === "morning") {
      return {
        title: "Good morning ☀️",
        body: "Set your one most important action and start the day with intention.",
        url: "/morning",
      };
    }
    if (slot === "midday") {
      const { data } = await admin
        .from("daily_momentum_entries")
        .select("most_important_action")
        .eq("user_id", userId)
        .eq("date", td)
        .maybeSingle();
      const mit = data?.most_important_action;
      return {
        title: "Midday check-in",
        body: mit ? `Are you on it? “${mit}”` : "Glance at your momentum — are you on your most important action?",
        url: "/dashboard",
      };
    }
    // evening
    const { data } = await admin
      .from("anti_avoidance_entries")
      .select("hardest_thing_i_did_not_want_to_do")
      .eq("user_id", userId)
      .eq("date", td)
      .maybeSingle();
    const hard = data?.hardest_thing_i_did_not_want_to_do;
    return {
      title: "Evening shutdown 🌙",
      body: hard ? `Did you do it? “${hard}” — then close the day.` : "Close the day: evening practice + sobriety check.",
      url: "/evening",
    };
  }

  let sent = 0;
  let removed = 0;
  const payloadCache = new Map<string, PushPayload>();

  for (const s of subs) {
    try {
      let payload = payloadCache.get(s.user_id);
      if (!payload) {
        payload = await payloadFor(s.user_id);
        payloadCache.set(s.user_id, payload);
      }
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      // Drop stale subscriptions (browser unsubscribed / expired).
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        removed++;
      } else {
        console.error("push send error:", err?.statusCode, err?.body || err?.message);
      }
    }
  }

  return NextResponse.json({ ok: true, slot, sent, removed });
}
